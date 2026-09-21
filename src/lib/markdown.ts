/**
 * 輕量 Markdown → HTML（build-time）。
 *
 * 對齊舊專案 `BlogPost.tsx` 的 parseContent 邏輯，但：
 * - 不帶 Tailwind class（由 `.blog-prose` / `.blog-prose-anti` 統一樣式）
 * - 無互動（copy 按鈕等）改交給 client island
 * - 純函式，可在 Astro frontmatter 呼叫
 */
import pako from 'pako';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * build-time 檢查 `public/<url>` 是否真的存在對應的 .webp 檔。
 * renderMarkdown 在 Astro frontmatter(Node build env)執行,有 fs 權限。
 *
 * 為什麼需要:`![](...png)` 會被包成 <picture><source webp><img png>。
 * 但專案沒有 build step 產 .webp,若 webp 不存在,支援 webp 的瀏覽器會選中
 * <source> 拿到 404 且**不會** fallback 到 <img>(picture 規格:type 命中後
 * img 只在「無 source 命中」時當 fallback,不在「source 載入失敗」時)→ 破圖。
 * 解法:webp 真的存在才掛 <source>,否則只給乾淨 <img>。
 */
function webpSiblingExists(url: string): boolean {
  // 只處理站內絕對路徑(/images/...);外部 / 相對路徑一律當不存在
  if (!url.startsWith('/')) return false;
  const webpRel = url.replace(/\.(png|jpe?g)$/i, '.webp').replace(/^\//, '');
  try {
    return existsSync(join(process.cwd(), 'public', webpRel));
  } catch {
    return false;
  }
}

/**
 * Kroki 服務 endpoint。預設用環境變數，沒設就退到公服務。
 * - 本機 / GHA build：請 docker compose -f docker-compose.kroki.yml up -d，
 *   或設 KROKI_ENDPOINT=http://localhost:8000
 * - 公服務：https://kroki.io（可能掛，僅作為 fallback）
 */
const KROKI_ENDPOINT =
  (typeof process !== 'undefined' && process.env?.KROKI_ENDPOINT) ||
  'https://kroki.io';

const KROKI_SUPPORTED: ReadonlySet<string> = new Set([
  'blockdiag', 'seqdiag', 'actdiag', 'nwdiag', 'packetdiag', 'rackdiag',
  'bpmn', 'bytefield', 'c4plantuml', 'd2', 'dbml', 'ditaa', 'erd',
  'excalidraw', 'graphviz', 'mermaid', 'nomnoml', 'pikchr', 'plantuml',
  'structurizr', 'svgbob', 'symbolator', 'tikz', 'umlet', 'vega', 'vegalite',
  'wavedrom', 'wireviz',
]);

/**
 * 把圖表原始碼編碼成 Kroki GET URL。
 * 流程：UTF-8 → deflate(level 9) → base64 → URL-safe (- _).
 * Reference: https://docs.kroki.io/kroki/setup/encode-diagram/
 */
function encodeKrokiPath(source: string): string {
  const utf8 = new TextEncoder().encode(source);
  const compressed = pako.deflate(utf8, { level: 9 });
  let binary = '';
  for (let i = 0; i < compressed.length; i += 1) {
    binary += String.fromCharCode(compressed[i]);
  }
  const b64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(compressed).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_');
}

function buildKrokiUrl(
  type: string,
  source: string,
  format: 'svg' | 'png' = 'svg',
): string {
  const path = encodeKrokiPath(source);
  return `${KROKI_ENDPOINT}/${type}/${format}/${path}`;
}

const slugify = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '');

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

interface TocItem {
  id: string;
  text: string;
}

export interface RenderedMarkdown {
  html: string;
  toc: TocItem[];
}

/**
 * 移除文章內手寫的「目錄」段落，頁面會以同一份 h2 資料生成導覽。
 * 「目錄」是頁面層級的保留章節名；正文中若存在就整段移除，避免雙重導覽。
 */
export function stripManualTableOfContents(content: string): string {
  return content.replace(
    /^##\s+(?:本文)?目錄[^\n]*\n([\s\S]*?)(?=^##\s+|\s*$)/gim,
    '',
  );
}

/**
 * 逐行掃出 fenced code block 的範圍。
 * regex 追蹤不了巢狀 fence（```markdown 裡面又有 ```bash），會在內層的收尾處提早
 * 結束，害外層後半段漏出去被當成真的 markdown 渲染，而且收尾位移會一路往後串。
 * 依 CommonMark：收尾 fence 不得帶 info string，長度不得少於開頭 fence。
 */
function scanFences(
  content: string,
  onCode: (lang: string, filename: string, body: string) => string,
  onText: (line: string) => string
): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const open = /^(`{3,})([\w-]*)(?::([^\r\n]+))?[ \t]*\r?$/.exec(raw);
    if (!open) {
      out.push(onText(raw));
      i += 1;
      continue;
    }
    const closeRe = new RegExp('^`{' + open[1].length + ',}[ \t]*\r?$');
    const body: string[] = [];
    let j = i + 1;
    let closed = false;
    while (j < lines.length) {
      if (closeRe.test(lines[j])) {
        closed = true;
        break;
      }
      body.push(lines[j]);
      j += 1;
    }
    if (!closed) {
      // 沒有收尾 fence：原樣輸出這一行，不吞掉後面所有內容。
      out.push(onText(raw));
      i += 1;
      continue;
    }
    // 收尾 fence 行尾若有 CR 要保留，否則以 CRLF 為界的段落規則會在這行失準。
    const cr = lines[j].endsWith('\r') ? '\r' : '';
    out.push(onCode(open[2] ?? '', open[3] ?? '', body.join('\n')) + cr);
    i = j + 1;
  }
  return out.join('\n');
}

/** 從 content 解析出所有 `##` 標題的 TOC。 */
function extractToc(content: string): TocItem[] {
  const items: TocItem[] = [];
  const used = new Set<string>();
  // 先移除 fenced code block,否則範例 markdown 裡的 `## Goal` 會被收進側邊 TOC。
  const withoutCode = scanFences(content, () => '', (line) => line);
  const regex = /^## (.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(withoutCode)) !== null) {
    const text = m[1].trim();
    let id = slugify(text) || `heading-${items.length}`;
    let unique = id;
    let n = 1;
    while (used.has(unique)) {
      unique = `${id}-${n}`;
      n += 1;
    }
    used.add(unique);
    items.push({ id: unique, text });
  }
  return items;
}

/** Markdown → HTML。樣式由 `.blog-prose` 統一處理。 */
export function renderMarkdown(content: string): RenderedMarkdown {
  const toc = extractToc(content);
  const tocIds = new Set<string>();
  const resolveId = (text: string): string => {
    let id = slugify(text) || `heading-${tocIds.size}`;
    let unique = id;
    let n = 1;
    while (tocIds.has(unique)) {
      unique = `${id}-${n}`;
      n += 1;
    }
    tocIds.add(unique);
    return unique;
  };

  // 先把 code block 抽成 placeholder,全部行內／區塊規則跑完再換回去。
  // 只做 escapeHtml 不夠:`## Goal`、`- item` 這類內容沒有角括號,escape 後原樣
  // 保留,後面的標題／清單 regex 就會在 <pre> 裡面把它們當成真的 markdown 處理,
  // 產出 <h2> 與破損的 <ul>/<li> 巢狀,並把後續段落吃進 <ul> 裡。
  const codeBlocks: string[] = [];
  const stash = (h: string): string => {
    codeBlocks.push(h);
    return `\u0000CODEBLOCK${codeBlocks.length - 1}\u0000`;
  };

  // 把一個 fenced code block 轉成最終 HTML（kroki 或 <pre>）。
  const renderFence = (lang: string, filename: string, code: string): string => {
    const trimmed = code.replace(/\r?\n$/, '');
    const langLabel = (lang || 'code').toLowerCase();

    // Kroki diagram block
    if (langLabel === 'kroki' && filename) {
      const krokiType = filename.trim().toLowerCase();
      if (KROKI_SUPPORTED.has(krokiType)) {
        const src = buildKrokiUrl(krokiType, trimmed);
        const alt = `${krokiType} diagram`;
        // data-kroki-source 保留原始碼，方便後處理 / debug
        const sourceB64 =
          typeof btoa === 'function'
            ? btoa(unescape(encodeURIComponent(trimmed)))
            : Buffer.from(trimmed, 'utf-8').toString('base64');
        return `<figure data-kroki="${krokiType}" data-kroki-source="${sourceB64}"><img src="${src}" alt="${alt}" loading="lazy" decoding="async" /></figure>`;
      }
    }

    const escaped = escapeHtml(trimmed);
    const prismClass = langLabel === 'code' ? '' : ` class="language-${langLabel}"`;
    const fileAttr = filename ? ` data-filename="${escapeHtml(filename.trim())}"` : '';
    return `<pre data-lang="${langLabel}"${fileAttr}><code${prismClass}>${escaped}</code></pre>`;
  };

  // Code blocks first — protect their content。支援：
  //   ```lang             → 一般 highlight code block
  //   ```lang:filename    → 帶檔名 hint
  //   ```kroki:<type>     → 攔截，輸出 <figure data-kroki ...><img src="...kroki url..."/></figure>
  //                         （可用 inlineKrokiImages() 後處理改寫成 inline SVG）
  let html = scanFences(
    content,
    (lang, filename, body) => stash(renderFence(lang, filename, body)),
    (line) => line
  );


  // GFM tables — must run BEFORE other block-level regexes so `|` pipes aren't
  // mistaken for inline syntax. Matches header + separator + 1+ body rows.
  // Alignment hints in the separator (`:--`, `:-:`, `--:`) map to th/td align.
  const tableRe =
    /^(\|.+\|)\n(\|[-: |]+\|)\n((?:\|.*\|(?:\n|$))+)/gm;
  html = html.replace(tableRe, (_m, header: string, sep: string, body: string) => {
    const parseRow = (row: string): string[] =>
      row
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());

    const alignFromSep = (cell: string): string => {
      const l = cell.startsWith(':');
      const r = cell.endsWith(':');
      if (l && r) return 'center';
      if (r) return 'right';
      if (l) return 'left';
      return '';
    };

    const heads = parseRow(header);
    const aligns = parseRow(sep).map(alignFromSep);
    const rows = body
      .trim()
      .split('\n')
      .map(parseRow);

    const headHtml = heads
      .map((h, i) => {
        const a = aligns[i] ? ` style="text-align:${aligns[i]}"` : '';
        return `<th${a}>${h}</th>`;
      })
      .join('');
    const bodyHtml = rows
      .map(
        (r) =>
          '<tr>' +
          r
            .map((c, i) => {
              const a = aligns[i] ? ` style="text-align:${aligns[i]}"` : '';
              return `<td${a}>${c}</td>`;
            })
            .join('') +
          '</tr>',
      )
      .join('');

    return `<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
  });

  // YouTube 嵌入：@[youtube](VIDEO_ID) 或 @[youtube](https://youtu.be/VIDEO_ID)
  // → responsive 16:9 iframe。VIDEO_ID 走嚴格白名單，杜絕注入。
  // 必須在 image / link 規則之前跑，才不會被 ![]() / []() 先吃掉。
  html = html.replace(
    /@\[youtube\]\(([^)]+)\)/gi,
    (_m, raw: string) => {
      const idMatch = raw
        .trim()
        .match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/)|^)([a-zA-Z0-9_-]{6,20})/);
      const id = idMatch?.[1];
      if (!id || !/^[a-zA-Z0-9_-]{6,20}$/.test(id)) return '';
      const src = `https://www.youtube-nocookie.com/embed/${id}`;
      return `<figure class="yt-embed"><iframe src="${src}" title="YouTube video player" loading="lazy" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></figure>`;
    }
  );

  html = html
    .replace(/^## (.+)$/gm, (_m, title: string) => {
      const id = resolveId(title.trim());
      return `<h2 id="${id}">${title}</h2>`;
    })
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, url: string) => {
      const isLocalRaster = /^\/?[^:]+\.(png|jpe?g)$/i.test(url);
      const isSvg = /\.svg(\?|$)/i.test(url);
      const safeAlt = alt.replace(/"/g, '&quot;');
      const loadAttrs = isSvg
        ? 'loading="eager" decoding="sync"'
        : 'loading="lazy" decoding="async"';
      if (!isLocalRaster) {
        return `<img src="${url}" alt="${safeAlt}" ${loadAttrs} />`;
      }
      // 只在 .webp 真的存在時掛 <source>,否則 webp-capable 瀏覽器會吃 404 不 fallback。
      if (webpSiblingExists(url)) {
        const webp = url.replace(/\.(png|jpe?g)$/i, '.webp');
        return `<picture><source srcset="${webp}" type="image/webp" /><img src="${url}" alt="${safeAlt}" ${loadAttrs} /></picture>`;
      }
      return `<img src="${url}" alt="${safeAlt}" ${loadAttrs} />`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, url: string) => {
      const external = /^https?:\/\//.test(url);
      const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${url}"${rel}>${text}</a>`;
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ol">$1</li>');

  // Wrap consecutive <li> into <ul>
  html = html.replace(
    /(?:<li>(?:.|\n)*?<\/li>\s*)+/g,
    (m) => `<ul>${m.replace(/\s+/g, ' ')}</ul>`
  );
  // Wrap ordered list items
  html = html.replace(
    /<ul>(\s*(<li class="ol">[^<]*<\/li>\s*)+)<\/ul>/g,
    (_m, inner: string) => {
      const cleaned = inner.replace(/ class="ol"/g, '');
      return `<ol>${cleaned}</ol>`;
    }
  );

  // Paragraphs: split by blank line, skip lines that already look like block elements
  const isBlock = (line: string): boolean =>
    /^\u0000CODEBLOCK\d+\u0000$/.test(line.trim()) ||
    /^<(h2|h3|pre|ul|ol|blockquote|img|picture|figure|div|table|svg)\b/.test(
      line.trim()
    );

  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (isBlock(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  html = html.replace(
    /\u0000CODEBLOCK(\d+)\u0000/g,
    (_m, n: string) => codeBlocks[Number(n)]
  );

  return { html, toc };
}

/**
 * 把 renderMarkdown 產出的 HTML 裡所有 Kroki <figure> 改寫成 inline SVG。
 *
 * 為什麼要 inline：
 * - 部落格部署到 GitHub Pages 之後，讀者不需要連 kroki.io（公服務常掛）
 * - HTML 寫死 SVG，build 一次就確定能顯示
 * - 圖表搜尋可被 Google 索引（SVG 內容可搜）
 *
 * 何時呼叫：
 * - Astro page frontmatter（top-level await）
 * - 失敗時保留原本的 <img>，讓讀者瀏覽器自己 fallback 回 kroki.io（會破圖但不會 build 失敗）
 *
 * @param html renderMarkdown 產出的 html
 * @param endpoint Kroki 服務位置；不傳就用 KROKI_ENDPOINT 環境變數，或公服務
 */
export async function inlineKrokiImages(
  html: string,
  endpoint: string = KROKI_ENDPOINT,
): Promise<string> {
  const figureRe =
    /<figure data-kroki="([^"]+)" data-kroki-source="([^"]+)"><img [^>]*\/><\/figure>/g;

  const matches: Array<{
    full: string;
    type: string;
    source: string;
  }> = [];

  let m: RegExpExecArray | null;
  while ((m = figureRe.exec(html)) !== null) {
    const sourceB64 = m[2];
    const source =
      typeof atob === 'function'
        ? decodeURIComponent(escape(atob(sourceB64)))
        : Buffer.from(sourceB64, 'base64').toString('utf-8');
    matches.push({ full: m[0], type: m[1], source });
  }

  if (matches.length === 0) return html;

  // 並行抓所有 SVG
  const results = await Promise.all(
    matches.map(async ({ type, source }) => {
      try {
        const res = await fetch(`${endpoint}/${type}/svg`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: source,
        });
        if (!res.ok) {
          return { ok: false as const, svg: '' };
        }
        const svg = await res.text();
        return { ok: true as const, svg };
      } catch {
        return { ok: false as const, svg: '' };
      }
    }),
  );

  let result = html;
  matches.forEach((entry, i) => {
    const r = results[i];
    if (!r.ok) return; // fall back to <img>
    // 清掉 SVG 裡的 XML declaration / DOCTYPE，避免破壞 HTML
    const cleanSvg = r.svg
      .replace(/<\?xml[^>]*\?>\s*/g, '')
      .replace(/<!DOCTYPE[^>]*>\s*/g, '');
    const replacement = `<figure data-kroki="${entry.type}" data-kroki-inlined="true">${cleanSvg}</figure>`;
    result = result.replace(entry.full, replacement);
  });

  return result;
}

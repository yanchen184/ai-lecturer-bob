/**
 * 輕量 Markdown → HTML（build-time）。
 *
 * 對齊舊專案 `BlogPost.tsx` 的 parseContent 邏輯，但：
 * - 不帶 Tailwind class（由 `.blog-prose` / `.blog-prose-anti` 統一樣式）
 * - 無互動（copy 按鈕等）改交給 client island
 * - 純函式，可在 Astro frontmatter 呼叫
 */
import pako from 'pako';

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

/** 從 content 解析出所有 `##` 標題的 TOC。 */
function extractToc(content: string): TocItem[] {
  const items: TocItem[] = [];
  const used = new Set<string>();
  const regex = /^## (.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
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

  let html = content
    // Code blocks first — protect their content
    // 支援：
    //   ```lang             → 一般 highlight code block
    //   ```lang:filename    → 帶檔名 hint
    //   ```kroki:<type>     → 攔截，輸出 <figure data-kroki ...><img src="...kroki url..."/></figure>
    //                         （可用 inlineKrokiImages() 後處理改寫成 inline SVG）
    .replace(/```([\w-]*)(?::([^\n]+))?\n?([\s\S]*?)```/g, (_m, lang: string, filename: string, code: string) => {
      const trimmed = code.replace(/\n$/, '');
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
    });

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

  html = html
    .replace(/^## (.+)$/gm, (_m, title: string) => {
      const id = resolveId(title.trim());
      return `<h2 id="${id}">${title}</h2>`;
    })
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, url: string) => {
      const isLocalRaster = /^\/?[^:]+\.(png|jpe?g)$/i.test(url);
      const safeAlt = alt.replace(/"/g, '&quot;');
      if (!isLocalRaster) {
        return `<img src="${url}" alt="${safeAlt}" loading="lazy" decoding="async" />`;
      }
      const webp = url.replace(/\.(png|jpe?g)$/i, '.webp');
      return `<picture><source srcset="${webp}" type="image/webp" /><img src="${url}" alt="${safeAlt}" loading="lazy" decoding="async" /></picture>`;
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

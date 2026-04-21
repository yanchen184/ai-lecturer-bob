/**
 * 輕量 Markdown → HTML（build-time）。
 *
 * 對齊舊專案 `BlogPost.tsx` 的 parseContent 邏輯，但：
 * - 不帶 Tailwind class（由 `.blog-prose` / `.blog-prose-anti` 統一樣式）
 * - 無互動（copy 按鈕等）改交給 client island
 * - 純函式，可在 Astro frontmatter 呼叫
 */

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

export interface TocItem {
  id: string;
  text: string;
}

export interface RenderedMarkdown {
  html: string;
  toc: TocItem[];
}

/** 從 content 解析出所有 `##` 標題的 TOC。 */
export function extractToc(content: string): TocItem[] {
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
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang: string, code: string) => {
      const trimmed = code.replace(/\n$/, '');
      const escaped = escapeHtml(trimmed);
      const langLabel = (lang || 'code').toLowerCase();
      return `<pre data-lang="${langLabel}"><code>${escaped}</code></pre>`;
    })
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
    /^<(h2|h3|pre|ul|ol|blockquote|img|picture|figure|div|table)\b/.test(
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

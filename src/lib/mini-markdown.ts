/**
 * 極輕量 client-side Markdown → HTML（會員全文用）。
 * 全文是登入後從 Worker 動態拿的,不能用 build-time 的 renderMarkdown(它吃 Node fs)。
 * 只支援部落格作品文會用到的語法:標題 / 粗體 / 行內 code / 圍欄 code / 連結 / 圖片 / 清單 / 表格 / 段落。
 * 所有純文字一律 HTML-escape,避免 content_md 內含 < > 被當標籤(防 XSS)。
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 行內語法:escape 後再套 code / bold / link / image */
function inline(text: string): string {
  let out = escapeHtml(text);
  // 行內 code（先處理,避免內部被其他規則動到）
  out = out.replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`);
  // 圖片 ![alt](src)
  out = out.replace(
    /!\[([^\]]*)\]\(([^)\s]+)\)/g,
    (_m, alt, src) => `<img src="${src}" alt="${alt}" loading="lazy" />`,
  );
  // 連結 [text](href)
  out = out.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, t, href) => `<a href="${href}" target="_blank" rel="noopener">${t}</a>`,
  );
  // 粗體 **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, (_m, t) => `<strong>${t}</strong>`);
  return out;
}

export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;

  const flushList = (buf: string[]) => {
    if (buf.length) html.push(`<ul>${buf.join('')}</ul>`);
    buf.length = 0;
  };

  let listBuf: string[] = [];

  while (i < lines.length) {
    const line = lines[i];

    // 圍欄 code block ```
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      flushList(listBuf);
      const lang = fence[1];
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // 跳過結尾 ```
      html.push(
        `<pre data-lang="${lang}"><code>${escapeHtml(code.join('\n'))}</code></pre>`,
      );
      continue;
    }

    // 表格（| a | b | 後接 |---|---|）
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flushList(listBuf);
      const parseRow = (r: string) =>
        r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const headers = parseRow(line);
      i += 2; // 跳表頭 + 分隔線
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${headers.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody>`;
      html.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    // 標題
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushList(listBuf);
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    // 清單項
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      listBuf.push(`<li>${inline(li[1])}</li>`);
      i++;
      continue;
    }

    // 空行
    if (line.trim() === '') {
      flushList(listBuf);
      i++;
      continue;
    }

    // 一般段落
    flushList(listBuf);
    html.push(`<p>${inline(line)}</p>`);
    i++;
  }
  flushList(listBuf);
  return html.join('\n');
}

#!/usr/bin/env node
/**
 * K8s 文章排程預覽 CLI
 *
 * 用法：
 *   npm run schedule:list                          # 預設今天
 *   PUBLISH_OVERRIDE_DATE=2026-05-30 npm run schedule:list
 *
 * 輸出：每篇文章的 slug / publishDate / status / 距今天幾天 / title
 */

// 直接 import .ts 檔需要 tsx，但為了零依賴，我們手動讀資料檔。
// 用 regex 解析 k8sLessons 陣列裡每個物件的 slug / publishDate / title / draft 即可。
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '../src/data/k8sLessons.ts');

function getToday() {
  const override = process.env.PUBLISH_OVERRIDE_DATE;
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
  return new Date().toISOString().slice(0, 10);
}

/**
 * 從資料檔解析每篇文章的關鍵欄位。
 * 不執行 TS、不開 import 工具鏈，純 regex 抓 metadata。
 */
function parseLessons(src) {
  // 用 "  {" 開頭、"  }," 結尾切出每個 lesson 物件區塊
  const blocks = [];
  const lines = src.split('\n');
  let depth = 0;
  let current = [];
  let inArray = false;

  for (const line of lines) {
    if (!inArray) {
      if (line.includes('k8sLessons: K8sLesson[] = [')) {
        inArray = true;
      }
      continue;
    }
    if (line.match(/^\s*{/)) {
      depth++;
      current = [line];
      continue;
    }
    if (depth > 0) {
      current.push(line);
      // 計算大括號平衡
      const opens = (line.match(/{/g) || []).length;
      const closes = (line.match(/}/g) || []).length;
      depth += opens - closes;
      if (depth === 0) {
        blocks.push(current.join('\n'));
        current = [];
      }
    }
  }

  return blocks.map((block) => {
    const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
    const order = parseInt(block.match(/order:\s*(\d+)/)?.[1] ?? '0', 10);
    const title = block.match(/title:\s*'([^']+)'/)?.[1] ?? block.match(/title:\s*"([^"]+)"/)?.[1];
    const publishDate = block.match(/publishDate:\s*'([^']+)'/)?.[1];
    const draft = /draft:\s*true/.test(block);
    return { slug, order, title, publishDate, draft };
  }).filter((l) => l.slug && l.publishDate);
}

function getStatus(lesson, today) {
  if (lesson.draft) return 'draft';
  if (lesson.publishDate <= today) return 'published';
  return 'scheduled';
}

function daysFromToday(publishDate, today) {
  const a = new Date(publishDate).getTime();
  const b = new Date(today).getTime();
  return Math.round((a - b) / 86_400_000);
}

const STATUS_COLOR = {
  published: '\x1b[32m', // 綠
  scheduled: '\x1b[33m', // 黃
  draft: '\x1b[90m',     // 灰
};
const RESET = '\x1b[0m';

function pad(s, n) {
  s = String(s);
  return s + ' '.repeat(Math.max(0, n - [...s].reduce((w, c) => w + (c.charCodeAt(0) > 127 ? 2 : 1), 0)));
}

async function main() {
  const src = await readFile(dataPath, 'utf-8');
  const lessons = parseLessons(src);
  const today = getToday();

  // 排序：先按 publishDate
  lessons.sort((a, b) => a.publishDate.localeCompare(b.publishDate));

  // 統計
  const stats = { published: 0, scheduled: 0, draft: 0 };
  lessons.forEach((l) => stats[getStatus(l, today)]++);

  console.log();
  console.log(`\x1b[1m📅 K8s 文章排程預覽\x1b[0m  (今天: ${today}${process.env.PUBLISH_OVERRIDE_DATE ? ' 〈override〉' : ''})`);
  console.log(`   ${STATUS_COLOR.published}● 已上線 ${stats.published}\x1b[0m   ${STATUS_COLOR.scheduled}● 排程中 ${stats.scheduled}\x1b[0m   ${STATUS_COLOR.draft}● 草稿 ${stats.draft}\x1b[0m   合計 ${lessons.length}`);
  console.log();
  console.log(`  #  ${pad('publish', 12)}${pad('Δ天', 6)}${pad('狀態', 12)}${pad('slug', 36)}標題`);
  console.log(`  ─  ${'─'.repeat(11)} ${'─'.repeat(5)} ${'─'.repeat(11)} ${'─'.repeat(35)} ${'─'.repeat(40)}`);

  for (const l of lessons) {
    const status = getStatus(l, today);
    const days = daysFromToday(l.publishDate, today);
    const dayLabel = days === 0 ? '今天' : days > 0 ? `+${days}d` : `${days}d`;
    const color = STATUS_COLOR[status];
    console.log(
      `  ${pad(l.order, 3)}` +
      `${pad(l.publishDate, 12)}` +
      `${pad(dayLabel, 6)}` +
      `${color}${pad(status, 11)}${RESET}` +
      ` ${pad(l.slug, 36)}` +
      `${l.title?.slice(0, 50) ?? ''}`,
    );
  }
  console.log();
}

main().catch((e) => {
  console.error('\x1b[31m排程預覽失敗：\x1b[0m', e);
  process.exit(1);
});

/**
 * Blog 封面圖偵測（build-time）。
 *
 * 約定：每篇文章的封面圖放在 `public/images/blog/<slug>/cover.png`。
 *
 * 為什麼這樣設計：
 * - 不污染 Firestore schema（封面圖屬於專案 asset，不屬於文章資料）
 * - 不存在時走 fallback（純色塊 + 大字），UI 仍可掃讀
 * - build 時偵測一次、之後純物件查詢，零 I/O 成本
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const BLOG_IMAGES_ROOT = join(PROJECT_ROOT, 'public', 'images', 'blog');

/**
 * 檢查指定 slug 是否有對應的 cover.png。
 * 回傳 web 路徑（`/images/blog/<slug>/cover.png`）或 undefined。
 */
export function detectCoverImage(slug: string): string | undefined {
  if (!slug) return undefined;
  const localPath = join(BLOG_IMAGES_ROOT, slug, 'cover.png');
  if (existsSync(localPath)) {
    return `/images/blog/${slug}/cover.png`;
  }
  return undefined;
}

/**
 * 依分類給出 fallback 色票（HEX）。
 * 不在表中的分類走預設黃。
 */
const CATEGORY_COLORS: Record<string, string> = {
  AI: '#FFD600',
  後端: '#7CC0FF',
  教學: '#FF6EC7',
  K8s: '#00FFD1',
  雲端: '#7CC0FF',
  前端: '#FF6EC7',
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#FFEB3B';
}

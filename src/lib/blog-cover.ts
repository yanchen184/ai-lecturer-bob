/**
 * Blog 封面圖偵測（build-time）。
 *
 * 約定（依優先順序）:
 *   1. `cover.{png,jpg,jpeg,webp}` — 顯式封面（推薦,寫文時主動命名）
 *   2. 該 slug 資料夾內第一張圖片(.png/.jpg/.jpeg/.webp,字母序最前)
 *      — 沒指定 cover 時的 fallback,通常會抓到 og/github-repo 截圖
 *   3. undefined — 資料夾不存在或沒任何圖
 *
 * 為什麼用 fallback:大多數舊文章資料夾沒命名 cover.*,但裡面都有
 * 截圖。與其逼我回去 rename 30+ 篇,不如 build 時自動撿一張。
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// 用 cwd 比 import.meta.url 穩 — Astro build 時 module 路徑會被 bundle,
// 但 build 一定從專案根執行 (package.json 跑 `astro build`)。
const BLOG_IMAGES_ROOT = join(process.cwd(), 'public', 'images', 'blog');

// webp 排最前:同 slug 同時有 cover.webp 與 cover.png 時撿 webp。
// (9 篇舊文內文 hard-code cover.png,那些 png 必須保留,但封面走 webp)
const COVER_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'] as const;
const IMG_PATTERN = /\.(png|jpe?g|webp)$/i;

export interface CoverDetection {
  /** 封面圖路徑（顯式或 fallback 撿到的）。沒有任何圖則 undefined。 */
  src?: string;
  /**
   * true = 顯式 `cover.*`（可信的封面）；
   * false = 字母序 fallback 撿到的圖（可能是 og/抽象圖,品質不保證）。
   * 消費端可據此決定 fallback 圖要不要改 render 程式畫的 TerminalCover。
   */
  explicit: boolean;
}

/** 完整偵測:回封面路徑 + 是否為顯式封面。 */
export function detectCover(slug: string): CoverDetection {
  if (!slug) return { explicit: false };
  const dir = join(BLOG_IMAGES_ROOT, slug);
  if (!existsSync(dir)) return { explicit: false };

  // 1) 顯式 cover.*
  for (const ext of COVER_EXTENSIONS) {
    if (existsSync(join(dir, `cover.${ext}`))) {
      return { src: `/images/blog/${slug}/cover.${ext}`, explicit: true };
    }
  }

  // 2) Fallback:資料夾內第一張圖(字母序最前,排除 caption.txt 等)
  try {
    const files = readdirSync(dir)
      .filter((f) => IMG_PATTERN.test(f))
      .sort();
    if (files.length > 0) {
      return { src: `/images/blog/${slug}/${files[0]}`, explicit: false };
    }
  } catch {
    // readdir 失敗就放棄
  }

  return { explicit: false };
}

/** 向後相容:只回路徑（顯式或 fallback）。 */
export function detectCoverImage(slug: string): string | undefined {
  return detectCover(slug).src;
}

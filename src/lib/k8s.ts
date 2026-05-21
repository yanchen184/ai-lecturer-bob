/**
 * K8s 系列文章 lib（純靜態，獨立於 firestore）。
 *
 * 設計動機：K8s 是完整教學系列，按順序學習 → 文章必須有 order，
 * 且不需要 Firestore 動態化（系列穩定，每篇都按學習路徑寫）。
 *
 * 路由策略：所有 K8s 文章 URL 都在 /blog/k8s/[slug]，
 * 但 /blog 首頁會把它們獨立成一個區塊（與其他文章視覺分開）。
 */

export interface K8sLesson {
  /** 短代號，例如 'ingress-intro'。/blog/k8s/[slug] 用這個 */
  slug: string;
  /** 在學習路徑中的順序（1, 2, 3...） */
  order: number;
  /** 主題分組：basics / networking / config / workload / ops */
  group: 'basics' | 'networking' | 'config' | 'workload' | 'ops';
  title: string;
  /** SEO meta description，120 字內 */
  excerpt: string;
  /** Markdown 本文 */
  content: string;
  /**
   * 發布日期（YYYY-MM-DD）。
   * 排程機制：build 時若日期 > 今天，文章不會出現在前台（route 不生成、列表不顯示、RSS/sitemap 排除）。
   * 想排程未來文章 → 把日期填成未來日期，build 當天就會自動上線。
   */
  publishDate: string;
  updateDate?: string;
  tags: string[];
  /** 預估閱讀時間（分鐘） */
  readingTime: number;
  /**
   * 草稿旗標。設為 true 時，無論 publishDate 是何時都不會發布。
   * 用於「寫到一半、還在改、不想被排程意外推上線」的文章。
   */
  draft?: boolean;
}

export const groupMeta: Record<K8sLesson['group'], { label: string; color: string; order: number }> = {
  basics:     { label: '入門基礎',  color: '#ffeb3b', order: 1 },
  networking: { label: '網路與服務', color: '#7cc0ff', order: 2 },
  config:     { label: '設定與儲存', color: '#00ffd1', order: 3 },
  workload:   { label: '工作負載',   color: '#ff6ec7', order: 4 },
  ops:        { label: '維運與部署', color: '#ffa07a', order: 5 },
};

import { k8sLessons } from '../data/k8sLessons';

/**
 * 今天日期（YYYY-MM-DD，用 ISO 字串比對；K8sLesson.publishDate 也是這個格式）。
 *
 * 環境變數 PUBLISH_OVERRIDE_DATE 可以強制改變「今天」是哪一天，
 * 用於 preview 未來排程效果（例：`PUBLISH_OVERRIDE_DATE=2026-05-30 npm run build`）。
 */
function getToday(): string {
  const override = process.env.PUBLISH_OVERRIDE_DATE;
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
  return new Date().toISOString().slice(0, 10);
}

/** 是否該發布：未標 draft 且 publishDate <= 今天 */
function isPublished(lesson: K8sLesson, today: string): boolean {
  if (lesson.draft) return false;
  return lesson.publishDate <= today;
}

/** 已發布的文章（前台用）。按 order 排序。 */
export function getAllK8sLessons(): K8sLesson[] {
  const today = getToday();
  return [...k8sLessons]
    .filter((l) => isPublished(l, today))
    .sort((a, b) => a.order - b.order);
}

/** 取得上一篇 / 下一篇（按 order，僅限已發布） */
export function getAdjacentLessons(slug: string): {
  prev: K8sLesson | null;
  next: K8sLesson | null;
} {
  const all = getAllK8sLessons();
  const idx = all.findIndex((l) => l.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? all[idx - 1]! : null,
    next: idx < all.length - 1 ? all[idx + 1]! : null,
  };
}

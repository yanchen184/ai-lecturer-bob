/**
 * Astro build-time Firestore fetch.
 *
 * Client SDK 跑在 Node（Astro build 環境）。Firestore `bob_blog_posts`
 * collection 設計為 public read，無需 service account。
 *
 * Fallback：Firestore 失敗時，讀取 `src/data/blogPosts.ts` 靜態陣列。
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  type Firestore,
} from 'firebase/firestore';
import { staticPosts } from '../data/staticPosts';
import { detectCover } from './blog-cover';

const firebaseConfig = {
  apiKey: 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk',
  authDomain: 'forbidden-beauty.firebaseapp.com',
  databaseURL: 'https://forbidden-beauty-default-rtdb.firebaseio.com',
  projectId: 'forbidden-beauty',
  storageBucket: 'forbidden-beauty.firebasestorage.app',
  messagingSenderId: '648798597728',
  appId: '1:648798597728:web:b4a446788abf83ea518905',
  measurementId: 'G-YGWRFWMNK3',
};

const POSTS_COLLECTION = 'bob_blog_posts';

/**
 * 部落格文章（build-time 靜態資料結構）
 * 對齊舊專案的 BlogPost + FirestorePost 欄位。
 */
interface FaqItem {
  q: string;
  a: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  updateDate?: string;
  category: string;
  tags: string[];
  readingTime: number;
  featured: boolean;
  defaultStyle?: 'neub' | 'anti';
  faqItems?: FaqItem[];
  /**
   * 封面圖（可選）。約定路徑：/images/blog/<slug>/cover.png
   * 列表頁透過 fs 在 build 時偵測；Firestore 不需要寫此欄位。
   */
  coverImage?: string;
  /**
   * coverImage 是否為「可信封面」。
   * - true：Firestore 顯式寫的 coverImage，或資料夾內有 `cover.*`
   * - false：字母序 fallback 撿到的圖（品質不保證）→ 消費端可改 render TerminalCover
   */
  coverIsExplicit?: boolean;
}

let db: Firestore | null = null;
const getDb = (): Firestore => {
  if (db) return db;
  const app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
  db = getFirestore(app);
  return db;
};

/** Firestore document → 標準 BlogPost */
const mapDoc = (id: string, data: Record<string, unknown>): BlogPost => ({
  id,
  slug: (data.slug as string) ?? '',
  title: (data.title as string) ?? '',
  excerpt: (data.excerpt as string) ?? '',
  content: (data.content as string) ?? '',
  author: (data.author as string) ?? '陳彥彤',
  publishDate: (data.publishDate as string) ?? '',
  updateDate: (data.updateDate as string) || undefined,
  category: (data.category as string) ?? '',
  tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
  readingTime: typeof data.readingTime === 'number' ? data.readingTime : 1,
  featured: Boolean(data.featured),
  defaultStyle:
    data.defaultStyle === 'anti' || data.defaultStyle === 'neub'
      ? (data.defaultStyle as 'anti' | 'neub')
      : undefined,
  faqItems: Array.isArray(data.faqItems)
    ? (data.faqItems as unknown[])
        .filter(
          (it): it is { q: string; a: string } =>
            typeof it === 'object' &&
            it !== null &&
            typeof (it as { q?: unknown }).q === 'string' &&
            typeof (it as { a?: unknown }).a === 'string',
        )
        .map((it) => ({ q: it.q, a: it.a }))
    : undefined,
});

/**
 * 今天日期（YYYY-MM-DD）。
 *
 * 環境變數 PUBLISH_OVERRIDE_DATE 可以強制改變「今天」是哪一天，
 * 用於 preview 未來排程的文章（例：`PUBLISH_OVERRIDE_DATE=2026-05-30 npm run build`）。
 * 與 src/lib/k8s.ts 的 getToday() 行為一致。
 */
function getToday(): string {
  const override = process.env.PUBLISH_OVERRIDE_DATE;
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
  return new Date().toISOString().slice(0, 10);
}

let cache: BlogPost[] | null = null;

/**
 * 取得所有已發布文章。
 * build 時呼叫一次，之後每次 `getStaticPaths()` 快取在模組作用域。
 *
 * 過濾條件：published=true AND publishDate <= today
 * （未來日的文章不會出現在前台，靠 daily cron rebuild 自動上線）
 *
 * Fallback 順序：
 *   1. Firestore 拉到合格文章
 *   2. Firestore 為空 / 全為未來排程 → 靜態 fallback（同樣套 publishDate 過濾）
 *   3. Firestore 失敗 → 靜態 fallback（不讓 build 掛掉）
 */
export async function getAllPublishedPosts(): Promise<BlogPost[]> {
  if (cache) return cache;

  const today = getToday();

  try {
    const db = getDb();
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('published', '==', true)
    );
    const snap = await getDocs(q);
    const allPosts = snap.docs.map((d) => mapDoc(d.id, d.data()));
    const posts = allPosts.filter((p) => p.publishDate && p.publishDate <= today);
    const scheduled = allPosts.length - posts.length;

    if (posts.length === 0) {
      console.warn('[firestore] bob_blog_posts 為空（或全為未來排程），使用靜態 fallback');
      cache = withCoverImages(
        staticPosts.filter((p) => p.publishDate && p.publishDate <= today),
      );
      return cache;
    }

    // dedup by slug：Firestore 偶爾有重複寫入 (publish-blog.mjs 早期版本用 addDoc
    // 不是 setDoc(slug),造成同 slug 多 doc)。
    // 策略:**優先保留 canonical doc(docId === slug)**,其餘 fallback 用 docId 字典序。
    //   publish-blog.mjs 現在 upsert 到 docId=slug,所以 canonical 一定是最新、最乾淨那筆。
    //   舊版只取「字典序最小 docId」→ 會挑中比 canonical 更小的舊 addDoc 髒 doc,
    //   害 re-publish canonical 後 build 仍渲染舊內容(2026-06-05 圖片前綴事故根因)。
    // 行為穩定可預期、跟 Firestore 回傳順序無關。
    const canonicalRank = (p: BlogPost): number => (p.id === p.slug ? 0 : 1);
    const seen = new Set<string>();
    const unique = [...posts]
      .sort((a, b) => {
        const ra = canonicalRank(a);
        const rb = canonicalRank(b);
        if (ra !== rb) return ra - rb; // canonical(0) 排在非 canonical(1) 前面
        return a.id < b.id ? -1 : 1; // 同級再按 docId 字典序,保持穩定
      })
      .filter((p) => {
        if (seen.has(p.slug)) return false;
        seen.add(p.slug);
        return true;
      });
    unique.sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
    const dupes = posts.length - unique.length;

    if (scheduled > 0 || dupes > 0) {
      console.log(`[firestore] 載入 ${unique.length} 篇文章（${scheduled} 排程 / ${dupes} 重複已去重）`);
    } else {
      console.log(`[firestore] 載入 ${unique.length} 篇文章`);
    }
    cache = withCoverImages(unique);
    return cache;
  } catch (error) {
    console.error('[firestore] fetch 失敗，使用靜態 fallback:', error);
    cache = withCoverImages(
      staticPosts.filter((p) => p.publishDate && p.publishDate <= today),
    );
    return cache;
  }
}

/** 為每篇文章補上 build-time 偵測到的 cover 圖路徑 + 可信度旗標 */
function withCoverImages(posts: BlogPost[]): BlogPost[] {
  return posts.map((p) => {
    // Firestore 顯式寫了 coverImage → 視為可信
    if (p.coverImage) {
      return { ...p, coverIsExplicit: true };
    }
    const detected = detectCover(p.slug);
    return {
      ...p,
      coverImage: detected.src,
      coverIsExplicit: detected.explicit,
    };
  });
}

/**
 * 依 bob_post_stats.totalViews 由高到低排序的點閱紀錄。
 * build 時呼叫一次，失敗回 []（caller 用 featured fallback）。
 */
export interface PostStat {
  slug: string;
  views: number;
}

let topStatsCache: PostStat[] | null = null;
async function getTopViewedStats(): Promise<PostStat[]> {
  if (topStatsCache) return topStatsCache;
  try {
    const db = getDb();
    const snap = await getDocs(collection(db, 'bob_post_stats'));
    const rows = snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        const slug = (data.slug as string) || d.id;
        const views = typeof data.totalViews === 'number' ? data.totalViews : 0;
        return { slug, views };
      })
      .filter((r) => r.slug && r.views > 0)
      .sort((a, b) => b.views - a.views);
    topStatsCache = rows;
    console.log(`[firestore] bob_post_stats 載入 ${rows.length} 篇有點閱紀錄`);
    return topStatsCache;
  } catch (error) {
    console.error('[firestore] bob_post_stats 抓取失敗:', error);
    topStatsCache = [];
    return topStatsCache;
  }
}

/** 取得依點閱排序的 slug 陣列（保留給既有 caller） */
export async function getTopViewedSlugs(): Promise<string[]> {
  const stats = await getTopViewedStats();
  return stats.map((s) => s.slug);
}

/** slug → views 的查詢表（用於卡片/Hero 顯示熱度） */
export async function getViewsMap(): Promise<Map<string, number>> {
  const stats = await getTopViewedStats();
  return new Map(stats.map((s) => [s.slug, s.views]));
}

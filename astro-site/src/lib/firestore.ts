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
});

/**
 * 取得所有已發布文章。
 * build 時呼叫一次，之後每次 `getStaticPaths()` 快取在模組作用域。
 *
 * 優先順序：
 *   1. Firestore（published=true）
 *   2. Firestore 為空 → 靜態 fallback
 *   3. Firestore 失敗 → 靜態 fallback（不讓 build 掛掉）
 */
let cache: BlogPost[] | null = null;

export async function getAllPublishedPosts(): Promise<BlogPost[]> {
  if (cache) return cache;

  try {
    const db = getDb();
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('published', '==', true)
    );
    const snap = await getDocs(q);
    const posts = snap.docs.map((d) => mapDoc(d.id, d.data()));

    if (posts.length === 0) {
      console.warn('[firestore] bob_blog_posts 為空，使用靜態 fallback');
      cache = staticPosts;
      return staticPosts;
    }

    posts.sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
    console.log(`[firestore] 載入 ${posts.length} 篇文章`);
    cache = posts;
    return posts;
  } catch (error) {
    console.error('[firestore] fetch 失敗，使用靜態 fallback:', error);
    cache = staticPosts;
    return staticPosts;
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const all = await getAllPublishedPosts();
  return all.find((p) => p.slug === slug) ?? null;
}

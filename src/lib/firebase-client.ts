/**
 * Firebase client 最小接口（留言板用）
 * - 和 forbidden-beauty 同專案，collection 前綴 bob_
 * - 只 export messages 的 read/write；避免把 admin/blog 功能帶進首頁 bundle
 * - initializeApp 做成 singleton，重複呼叫回傳同一 instance
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  limit as fsLimit,
  type Firestore,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { withBase } from './url';

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

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

function getApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  const existing = getApps()[0];
  cachedApp = existing ?? initializeApp(firebaseConfig);
  return cachedApp;
}

export function getDb(): Firestore {
  if (cachedDb) return cachedDb;
  cachedDb = getFirestore(getApp());
  return cachedDb;
}

export interface GuestMessage {
  id: string;
  nickname: string;
  content: string;
  createdAt: Timestamp | null;
}

const MESSAGES_COLLECTION = 'bob_messages';

export async function addGuestMessage(
  nickname: string,
  content: string
): Promise<void> {
  const db = getDb();
  await addDoc(collection(db, MESSAGES_COLLECTION), {
    nickname: nickname.trim().slice(0, 20),
    content: content.trim().slice(0, 500),
    createdAt: serverTimestamp(),
  });
}

// ============ 訪客追蹤（Astro SSG 用） ============

const detectSearchEngine = (referrer: string) => {
  const engines = [
    { name: 'Google', patterns: ['google.com', 'google.com.tw'] },
    { name: 'Bing', patterns: ['bing.com'] },
    { name: 'Yahoo', patterns: ['yahoo.com', 'search.yahoo.com'] },
    { name: 'DuckDuckGo', patterns: ['duckduckgo.com'] },
  ];
  for (const engine of engines) {
    for (const p of engine.patterns) {
      if (referrer.includes(p)) return { isFromSearch: true, searchEngine: engine.name };
    }
  }
  return { isFromSearch: false, searchEngine: undefined as string | undefined };
};

/**
 * 紀錄一次站點訪客。1 小時內同一 session 只記一次（用 sessionStorage 去重）。
 */
export async function trackVisitor(): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    const DEDUP_KEY = 'bob_visitor_last';
    const ONE_HOUR = 60 * 60 * 1000;
    const last = sessionStorage.getItem(DEDUP_KEY);
    if (last && Date.now() - Number(last) < ONE_HOUR) return;
    sessionStorage.setItem(DEDUP_KEY, String(Date.now()));

    const db = getDb();
    const referrer = document.referrer || '';
    const { isFromSearch, searchEngine } = detectSearchEngine(referrer);

    const data: Record<string, unknown> = {
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      referrer: referrer || 'direct',
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      path: window.location.pathname,
    };
    if (searchEngine) data.searchEngine = searchEngine;
    if (isFromSearch) data.isFromSearch = isFromSearch;

    await addDoc(collection(db, 'bob_visitors'), data);

    const statsRef = doc(db, 'bob_stats', 'visitors');
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      await updateDoc(statsRef, { totalVisits: increment(1), lastVisit: serverTimestamp() });
    } else {
      await setDoc(statsRef, { totalVisits: 1, lastVisit: serverTimestamp() });
    }
  } catch (err) {
    console.error('[bob] trackVisitor failed', err);
  }
}

/**
 * 紀錄一篇文章的瀏覽。1 小時內同 session 同 slug 只記一次。
 * - 寫入 bob_post_views（每次瀏覽一筆，用於時間分析）
 * - 更新 bob_post_stats/{slug}（累計數、最近瀏覽時間）
 */
export async function trackPostView(slug: string, title?: string): Promise<void> {
  try {
    if (typeof window === 'undefined' || !slug) return;
    const dedupKey = `bob_post_view_${slug}`;
    const ONE_HOUR = 60 * 60 * 1000;
    const last = sessionStorage.getItem(dedupKey);
    if (last && Date.now() - Number(last) < ONE_HOUR) return;
    sessionStorage.setItem(dedupKey, String(Date.now()));

    const db = getDb();
    const referrer = document.referrer || '';
    const { isFromSearch, searchEngine } = detectSearchEngine(referrer);

    const viewData: Record<string, unknown> = {
      slug,
      timestamp: serverTimestamp(),
      referrer: referrer || 'direct',
      userAgent: navigator.userAgent,
    };
    if (title) viewData.title = title;
    if (searchEngine) viewData.searchEngine = searchEngine;
    if (isFromSearch) viewData.isFromSearch = isFromSearch;

    await addDoc(collection(db, 'bob_post_views'), viewData);

    const statsRef = doc(db, 'bob_post_stats', slug);
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      await updateDoc(statsRef, {
        totalViews: increment(1),
        lastViewAt: serverTimestamp(),
        ...(title ? { title } : {}),
      });
    } else {
      await setDoc(statsRef, {
        slug,
        title: title || slug,
        totalViews: 1,
        lastViewAt: serverTimestamp(),
        firstViewAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error('[bob] trackPostView failed', err);
  }
}

/**
 * 紀錄外連點擊。識別並分類常見目標（instagram / youtube / github / email 等）。
 */
export async function trackOutboundClick(params: {
  url: string;
  /** 例如 'instagram' | 'github' | 'email' | 'youtube' | 'linkedin' | 'other' */
  target?: string;
  /** 顯示在頁面上的文字，例如按鈕 label */
  label?: string;
  /** 點擊發生的頁面 path */
  fromPath?: string;
}): Promise<void> {
  try {
    if (typeof window === 'undefined' || !params.url) return;
    const db = getDb();

    // 自動偵測 target 類別
    const auto = detectOutboundTarget(params.url);
    const target = params.target ?? auto;

    await addDoc(collection(db, 'bob_outbound_clicks'), {
      url: params.url,
      target,
      label: params.label ?? '',
      fromPath: params.fromPath ?? window.location.pathname,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });

    // 同步累計 target 計數
    const statsRef = doc(db, 'bob_outbound_stats', target);
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      await updateDoc(statsRef, { totalClicks: increment(1), lastClickAt: serverTimestamp() });
    } else {
      await setDoc(statsRef, {
        target,
        totalClicks: 1,
        lastClickAt: serverTimestamp(),
        firstClickAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error('[bob] trackOutboundClick failed', err);
  }
}

function detectOutboundTarget(url: string): string {
  const u = url.toLowerCase();
  if (u.startsWith('mailto:')) return 'email';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('github.com')) return 'github';
  if (u.includes('linkedin.com')) return 'linkedin';
  if (u.includes('threads.net')) return 'threads';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  if (u.includes('facebook.com')) return 'facebook';
  if (u.includes('t.me') || u.includes('telegram.org')) return 'telegram';
  return 'other';
}

export function subscribeToMessages(
  callback: (messages: GuestMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, MESSAGES_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: GuestMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          nickname: (data.nickname as string) || '匿名',
          content: (data.content as string) || '',
          createdAt: (data.createdAt as Timestamp) ?? null,
        };
      });
      callback(messages);
    },
    (error) => {
      onError?.(error);
    }
  );
}

// ============ Admin 讀取用 ============

export interface VisitorRecord {
  id: string;
  timestamp: Timestamp | null;
  userAgent: string;
  referrer: string;
  path: string;
  language: string;
  searchEngine?: string;
  isFromSearch?: boolean;
}

export interface PostStat {
  slug: string;
  title: string;
  totalViews: number;
  lastViewAt: Timestamp | null;
  firstViewAt: Timestamp | null;
}

export interface PostView {
  id: string;
  slug: string;
  title: string;
  timestamp: Timestamp | null;
  referrer: string;
  searchEngine?: string;
}

export interface OutboundStat {
  target: string;
  totalClicks: number;
  lastClickAt: Timestamp | null;
  firstClickAt: Timestamp | null;
}

export interface OutboundClick {
  id: string;
  url: string;
  target: string;
  label: string;
  fromPath: string;
  timestamp: Timestamp | null;
}

export interface VisitorStatsDoc {
  totalVisits: number;
  lastVisit: Timestamp | null;
}

export function subscribeToVisitorStats(
  callback: (stats: VisitorStatsDoc) => void
): Unsubscribe {
  const db = getDb();
  const ref = doc(db, 'bob_stats', 'visitors');
  return onSnapshot(ref, (snap) => {
    const data = snap.data();
    callback({
      totalVisits: (data?.totalVisits as number) ?? 0,
      lastVisit: (data?.lastVisit as Timestamp) ?? null,
    });
  });
}

export function subscribeToRecentVisitors(
  max = 500,
  callback: (visitors: VisitorRecord[]) => void
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, 'bob_visitors'),
    orderBy('timestamp', 'desc'),
    fsLimit(max)
  );
  return onSnapshot(q, (snap) => {
    const rows: VisitorRecord[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        timestamp: (data.timestamp as Timestamp) ?? null,
        userAgent: (data.userAgent as string) || '',
        referrer: (data.referrer as string) || '',
        path: (data.path as string) || '',
        language: (data.language as string) || '',
        searchEngine: data.searchEngine as string | undefined,
        isFromSearch: data.isFromSearch as boolean | undefined,
      };
    });
    callback(rows);
  });
}

export function subscribeToPostStats(
  callback: (stats: PostStat[]) => void
): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, 'bob_post_stats'), orderBy('totalViews', 'desc'));
  return onSnapshot(q, (snap) => {
    const rows: PostStat[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        slug: (data.slug as string) || d.id,
        title: (data.title as string) || d.id,
        totalViews: (data.totalViews as number) ?? 0,
        lastViewAt: (data.lastViewAt as Timestamp) ?? null,
        firstViewAt: (data.firstViewAt as Timestamp) ?? null,
      };
    });
    callback(rows);
  });
}

export function subscribeToPostViews(
  max = 500,
  callback: (views: PostView[]) => void
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, 'bob_post_views'),
    orderBy('timestamp', 'desc'),
    fsLimit(max)
  );
  return onSnapshot(q, (snap) => {
    const rows: PostView[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        slug: (data.slug as string) || '',
        title: (data.title as string) || (data.slug as string) || '',
        timestamp: (data.timestamp as Timestamp) ?? null,
        referrer: (data.referrer as string) || '',
        searchEngine: data.searchEngine as string | undefined,
      };
    });
    callback(rows);
  });
}

export function subscribeToOutboundStats(
  callback: (stats: OutboundStat[]) => void
): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, 'bob_outbound_stats'), orderBy('totalClicks', 'desc'));
  return onSnapshot(q, (snap) => {
    const rows: OutboundStat[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        target: (data.target as string) || d.id,
        totalClicks: (data.totalClicks as number) ?? 0,
        lastClickAt: (data.lastClickAt as Timestamp) ?? null,
        firstClickAt: (data.firstClickAt as Timestamp) ?? null,
      };
    });
    callback(rows);
  });
}

export function subscribeToOutboundClicks(
  max = 200,
  callback: (clicks: OutboundClick[]) => void
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, 'bob_outbound_clicks'),
    orderBy('timestamp', 'desc'),
    fsLimit(max)
  );
  return onSnapshot(q, (snap) => {
    const rows: OutboundClick[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        url: (data.url as string) || '',
        target: (data.target as string) || 'other',
        label: (data.label as string) || '',
        fromPath: (data.fromPath as string) || '',
        timestamp: (data.timestamp as Timestamp) ?? null,
      };
    });
    callback(rows);
  });
}

// ============ GSC（Google Search Console）每日數據 ============
// 由 ~/.claude/scripts/gsc-fetch-structured.py 每日寫入 bob_gsc_daily/{YYYY-MM-DD}。
// query+page 雙維度：每個關鍵字知道落在哪篇文章（核心訴求：別人搜什麼找到我的文章）。

/** 一個關鍵字 → 文章的對應 + 當日成效 */
export interface GscQueryRow {
  query: string;
  /** 該關鍵字主要落地的文章 path（已去掉 https://yanchen.app 前綴） */
  page: string;
  impressions: number;
  clicks: number;
  /** 百分比，例如 4.2 表示 4.2% */
  ctr: number;
  /** 平均排名 */
  position: number;
}

/** 單一頁面的當日聚合成效 */
export interface GscPageRow {
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

/** 單日 GSC 快照（doc id = date） */
export interface GscDailyRecord {
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  ctr: number; // 百分比
  position: number; // 平均排名
  queries: GscQueryRow[];
  pages: GscPageRow[];
}

/**
 * 抓最近 N 天的 GSC 每日數據，依日期升冪排序（方便畫時間序列圖）。
 *
 * 2026-05-27 起改讀 public/gsc-daily/*.json 靜態檔（不再走 Firestore）：
 * 收緊安全規則後 bob_gsc_daily 只認 service account，為了零帳號操作改純 JSON。
 * 靜態主機無法列目錄 → 先抓 manifest.json 取得日期清單，再平行抓最新 N 天的檔。
 */
export async function fetchGscDaily(maxDays = 90): Promise<GscDailyRecord[]> {
  const manifestUrl = withBase('/gsc-daily/manifest.json');
  const res = await fetch(manifestUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`gsc manifest ${res.status}`);
  const manifest = (await res.json()) as { dates?: string[] };
  const allDates = (manifest.dates ?? []).slice().sort(); // 升冪
  const dates = allDates.slice(-maxDays); // 最新 N 天

  const settled = await Promise.allSettled(
    dates.map(async (date) => {
      const r = await fetch(withBase(`/gsc-daily/${date}.json`), { cache: 'no-store' });
      if (!r.ok) throw new Error(`gsc ${date} ${r.status}`);
      const data = (await r.json()) as Partial<GscDailyRecord>;
      const row: GscDailyRecord = {
        date: data.date || date,
        impressions: data.impressions ?? 0,
        clicks: data.clicks ?? 0,
        ctr: data.ctr ?? 0,
        position: data.position ?? 0,
        queries: (data.queries ?? []).map((q2) => ({
          query: q2.query ?? '',
          page: q2.page ?? '',
          impressions: q2.impressions ?? 0,
          clicks: q2.clicks ?? 0,
          ctr: q2.ctr ?? 0,
          position: q2.position ?? 0,
        })),
        pages: (data.pages ?? []).map((p) => ({
          page: p.page ?? '',
          impressions: p.impressions ?? 0,
          clicks: p.clicks ?? 0,
          ctr: p.ctr ?? 0,
          position: p.position ?? 0,
        })),
      };
      return row;
    })
  );

  const rows = settled
    .filter((s): s is PromiseFulfilledResult<GscDailyRecord> => s.status === 'fulfilled')
    .map((s) => s.value);
  rows.sort((a, b) => a.date.localeCompare(b.date)); // 升冪：舊 → 新
  return rows;
}

/** 單篇文章的結構分明細（programmatically-measurable 14 項，滿分 100）。 */
export interface ContentScoreEntry {
  total: number;
  breakdown: Record<string, number>;
  wordCount: number;
}

/** content-scores.json 的整檔形狀：slug → 分數。 */
export interface ContentScoresFile {
  generatedAt: string; // YYYY-MM-DD
  scores: Record<string, ContentScoreEntry>;
}

/**
 * 抓全站文章的「結構分」（publish 時由 scripts/publish-blog.mjs 算好寫進
 * public/content-scores.json，按 slug keyed）。供 /admin 對照 SEO 流量做分析：
 * 高結構分是不是真的換到更多曝光/點擊。讀不到時回空集合，不讓整頁掛掉。
 */
export async function fetchContentScores(): Promise<ContentScoresFile> {
  const url = withBase('/content-scores.json');
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`content-scores ${res.status}`);
  const data = (await res.json()) as Partial<ContentScoresFile>;
  return {
    generatedAt: data.generatedAt ?? '',
    scores: data.scores ?? {},
  };
}

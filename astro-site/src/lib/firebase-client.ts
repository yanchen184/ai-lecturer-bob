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
  type Firestore,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

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

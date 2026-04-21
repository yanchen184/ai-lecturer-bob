import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  getDocs,
  deleteDoc,
  where,
  type Unsubscribe
} from 'firebase/firestore'

// 使用 forbidden-beauty 同一個 Firebase 專案
// 所有 collection 都用 bob_ 前綴，不會混到
const firebaseConfig = {
  apiKey: "AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk",
  authDomain: "forbidden-beauty.firebaseapp.com",
  databaseURL: "https://forbidden-beauty-default-rtdb.firebaseio.com",
  projectId: "forbidden-beauty",
  storageBucket: "forbidden-beauty.firebasestorage.app",
  messagingSenderId: "648798597728",
  appId: "1:648798597728:web:b4a446788abf83ea518905",
  measurementId: "G-YGWRFWMNK3"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// ============ 訪客追蹤 ============

const detectSearchEngine = (referrer: string) => {
  const engines = [
    { name: 'Google', patterns: ['google.com', 'google.com.tw'] },
    { name: 'Bing', patterns: ['bing.com'] },
    { name: 'Yahoo', patterns: ['yahoo.com', 'search.yahoo.com'] },
    { name: 'DuckDuckGo', patterns: ['duckduckgo.com'] },
  ]
  for (const engine of engines) {
    for (const pattern of engine.patterns) {
      if (referrer.includes(pattern)) {
        return { isFromSearch: true, searchEngine: engine.name }
      }
    }
  }
  return { isFromSearch: false, searchEngine: undefined }
}

export const trackVisitor = async () => {
  try {
    const referrer = document.referrer || ''
    const { isFromSearch, searchEngine } = detectSearchEngine(referrer)

    const visitorData: Record<string, unknown> = {
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      referrer: referrer || 'direct',
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      path: window.location.pathname + window.location.hash,
    }
    if (searchEngine) visitorData.searchEngine = searchEngine
    if (isFromSearch) visitorData.isFromSearch = isFromSearch

    await addDoc(collection(db, 'bob_visitors'), visitorData)

    // 更新計數
    const statsRef = doc(db, 'bob_stats', 'visitors')
    const statsDoc = await getDoc(statsRef)
    if (statsDoc.exists()) {
      await updateDoc(statsRef, { totalVisits: increment(1), lastVisit: serverTimestamp() })
    } else {
      await setDoc(statsRef, { totalVisits: 1, lastVisit: serverTimestamp() })
    }
  } catch (error) {
    console.error('訪客追蹤失敗:', error)
  }
}

// ============ 聯絡表單 ============

export interface ContactInquiry {
  name: string
  email: string
  company?: string
  subject: string
  message: string
}

export const addContactInquiry = async (inquiry: ContactInquiry) => {
  await addDoc(collection(db, 'bob_contacts'), {
    name: inquiry.name.trim(),
    email: inquiry.email.trim(),
    company: (inquiry.company || '').trim(),
    subject: inquiry.subject.trim(),
    message: inquiry.message.trim(),
    handled: false,
    createdAt: serverTimestamp(),
    userAgent: navigator.userAgent,
    referrerPath: window.location.pathname + window.location.hash,
  })
}

export interface ContactRecord extends ContactInquiry {
  id: string
  handled: boolean
  createdAt: Timestamp | null
  referrerPath?: string
}

export const subscribeToContacts = (
  callback: (contacts: ContactRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(collection(db, 'bob_contacts'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const contacts: ContactRecord[] = snapshot.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          name: data.name || '',
          email: data.email || '',
          company: data.company || '',
          subject: data.subject || '',
          message: data.message || '',
          handled: Boolean(data.handled),
          createdAt: (data.createdAt as Timestamp) ?? null,
          referrerPath: data.referrerPath || undefined,
        }
      })
      callback(contacts)
    },
    (error) => {
      console.error('聯絡訊息訂閱失敗:', error)
      onError?.(error)
    }
  )
}

export const markContactHandled = async (id: string, handled: boolean) => {
  await updateDoc(doc(db, 'bob_contacts', id), { handled })
}

// ============ 留言功能 ============

export interface GuestMessage {
  id: string
  nickname: string
  content: string
  createdAt: Timestamp | null
}

export const addGuestMessage = async (nickname: string, content: string) => {
  await addDoc(collection(db, 'bob_messages'), {
    nickname: nickname.trim(),
    content: content.trim(),
    createdAt: serverTimestamp()
  })
}

export const subscribeToMessages = (
  callback: (messages: GuestMessage[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, 'bob_messages'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: GuestMessage[] = snapshot.docs.map((d) => ({
        id: d.id,
        nickname: d.data().nickname || '匿名',
        content: d.data().content || '',
        createdAt: d.data().createdAt as Timestamp | null,
      }))
      callback(messages)
    },
    (error) => {
      console.error('留言訂閱失敗:', error)
      onError?.(error)
    }
  )
}

// ============ Admin 用的訂閱 ============

export interface VisitorStats {
  totalVisits: number
  lastVisit: Timestamp | null
}

export const subscribeToVisitorStats = (callback: (stats: VisitorStats) => void) => {
  const statsRef = doc(db, 'bob_stats', 'visitors')
  return onSnapshot(statsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data()
      callback({ totalVisits: data.totalVisits || 0, lastVisit: data.lastVisit || null })
    } else {
      callback({ totalVisits: 0, lastVisit: null })
    }
  })
}

interface Visitor {
  id: string
  timestamp: Timestamp | null
  userAgent: string
  referrer: string
  screenWidth: number
  screenHeight: number
  language: string
  path: string
  isFromSearch?: boolean
  searchEngine?: string
}

export const subscribeToRecentVisitors = (callback: (visitors: Visitor[]) => void, max = 100) => {
  const q = query(collection(db, 'bob_visitors'), orderBy('timestamp', 'desc'), limit(max))
  return onSnapshot(q, (snapshot) => {
    const visitors: Visitor[] = snapshot.docs.map((d) => ({
      id: d.id,
      timestamp: d.data().timestamp as Timestamp | null,
      userAgent: d.data().userAgent || '',
      referrer: d.data().referrer || 'direct',
      screenWidth: d.data().screenWidth || 0,
      screenHeight: d.data().screenHeight || 0,
      language: d.data().language || '',
      path: d.data().path || '/',
      isFromSearch: d.data().isFromSearch || false,
      searchEngine: d.data().searchEngine,
    }))
    callback(visitors)
  })
}

export const getAllVisitorCount = async () => {
  const snapshot = await getDocs(collection(db, 'bob_visitors'))
  return snapshot.size
}

// ============ 部落格文章 CMS ============

/**
 * Firestore 部落格文章資料結構
 * 和 src/data/blogPosts.ts 的 BlogPost 欄位對齊，另外新增 published 狀態與時間戳記。
 */
export interface FirestorePost {
  id?: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  publishDate: string
  updateDate?: string
  category: string
  tags: string[]
  readingTime: number
  featured: boolean
  published: boolean
  /** 作者指定的預設風格。讀者若已在 BlogStyleSwitcher 選過風格，仍以讀者選擇為準。 */
  defaultStyle?: 'neub' | 'anti'
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}

const POSTS_COLLECTION = 'bob_blog_posts'

/**
 * 將 Firestore document 轉為 FirestorePost
 * 集中處理欄位 fallback，避免各處散落。
 */
const mapDocToPost = (
  id: string,
  data: Record<string, unknown>
): FirestorePost => ({
  id,
  slug: (data.slug as string) || '',
  title: (data.title as string) || '',
  excerpt: (data.excerpt as string) || '',
  content: (data.content as string) || '',
  author: (data.author as string) || '',
  publishDate: (data.publishDate as string) || '',
  updateDate: (data.updateDate as string) || undefined,
  category: (data.category as string) || '',
  tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
  readingTime: typeof data.readingTime === 'number' ? data.readingTime : 0,
  featured: Boolean(data.featured),
  published: data.published !== false, // 預設視為已發布，避免舊資料被隱藏
  defaultStyle:
    data.defaultStyle === 'anti' || data.defaultStyle === 'neub'
      ? (data.defaultStyle as 'anti' | 'neub')
      : undefined,
  createdAt: (data.createdAt as Timestamp) ?? null,
  updatedAt: (data.updatedAt as Timestamp) ?? null,
})

/**
 * 建立新文章
 * @returns 新文章的 Firestore document id
 */
export const createPost = async (
  post: Omit<FirestorePost, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, POSTS_COLLECTION), {
    ...post,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/**
 * 更新文章
 * 刻意剔除 id / createdAt 欄位，避免覆寫原始值。
 */
export const updatePost = async (
  id: string,
  post: Partial<Omit<FirestorePost, 'id' | 'createdAt'>>
): Promise<void> => {
  const { ...rest } = post
  await updateDoc(doc(db, POSTS_COLLECTION, id), {
    ...rest,
    updatedAt: serverTimestamp(),
  })
}

/** 刪除文章 */
export const deletePost = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, POSTS_COLLECTION, id))
}

/** 取得單篇文章 */
export const getPost = async (id: string): Promise<FirestorePost | null> => {
  const snapshot = await getDoc(doc(db, POSTS_COLLECTION, id))
  if (!snapshot.exists()) return null
  return mapDocToPost(snapshot.id, snapshot.data())
}

/**
 * 訂閱文章列表
 * @param callback 變更時的回呼
 * @param publishedOnly 若為 true，只訂閱 published=true 的文章（給一般讀者用）
 * @returns Unsubscribe
 */
export const subscribeToPosts = (
  callback: (posts: FirestorePost[]) => void,
  publishedOnly: boolean = false,
  onError?: (error: Error) => void
): Unsubscribe => {
  const postsRef = collection(db, POSTS_COLLECTION)
  // publishedOnly 模式下需要 composite index (published, publishDate) 時會報錯，
  // 因此改為單欄位查詢再在 client 排序，不依賴 composite index。
  const q = publishedOnly
    ? query(postsRef, where('published', '==', true))
    : query(postsRef, orderBy('createdAt', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const posts = snapshot.docs.map((d) => mapDocToPost(d.id, d.data()))
      if (publishedOnly) {
        posts.sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1))
      }
      callback(posts)
    },
    (error) => {
      console.error('文章訂閱失敗:', error)
      onError?.(error)
    }
  )
}

/** 一次抓取所有文章（不含即時訂閱） */
export const getAllPosts = async (): Promise<FirestorePost[]> => {
  const snapshot = await getDocs(
    query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'))
  )
  return snapshot.docs.map((d) => mapDocToPost(d.id, d.data()))
}

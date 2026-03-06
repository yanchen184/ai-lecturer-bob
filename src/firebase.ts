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
  getDocs
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

export const subscribeToMessages = (callback: (messages: GuestMessage[]) => void) => {
  const q = query(collection(db, 'bob_messages'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const messages: GuestMessage[] = snapshot.docs.map((d) => ({
      id: d.id,
      nickname: d.data().nickname || '匿名',
      content: d.data().content || '',
      createdAt: d.data().createdAt as Timestamp | null,
    }))
    callback(messages)
  })
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

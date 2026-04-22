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

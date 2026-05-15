import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk',
  projectId: 'forbidden-beauty',
  authDomain: 'forbidden-beauty.firebaseapp.com',
});
const db = getFirestore(app);
const snap = await getDocs(collection(db, 'bob_post_stats'));
const rows = snap.docs.map(d => {
  const data = d.data();
  return {
    docId: d.id,
    slug: data.slug || d.id,
    views: typeof data.totalViews === 'number' ? data.totalViews : 0,
  };
}).filter(r => r.views > 0).sort((a, b) => b.views - a.views);
console.log(`Total with views: ${rows.length}`);
rows.slice(0, 10).forEach(r => console.log(`  ${r.views.toString().padStart(5)} - ${r.slug} (docId: ${r.docId})`));
process.exit(0);

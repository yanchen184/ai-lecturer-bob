import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk',
  projectId: 'forbidden-beauty',
  authDomain: 'forbidden-beauty.firebaseapp.com',
});
const db = getFirestore(app);
const snap = await getDocs(query(collection(db, 'bob_blog_posts'), where('published', '==', true)));

const seen = new Map();
snap.docs.forEach((d) => {
  const data = d.data();
  if (!seen.has(data.slug)) seen.set(data.slug, data);
});

const posts = [...seen.values()];
const tagCount = new Map();
posts.forEach(p => (p.tags || []).forEach(t => tagCount.set(t, (tagCount.get(t) || 0) + 1)));
const series = [...tagCount.entries()].filter(([_, n]) => n >= 3).sort((a,b) => b[1]-a[1]);
console.log('Tags with >= 3 posts (candidate series):');
series.forEach(([t, n]) => console.log(`  ${t}: ${n}`));

console.log('\nhermes-related slugs:');
posts.filter(p => p.slug.includes('hermes')).sort((a,b)=>a.publishDate.localeCompare(b.publishDate))
  .forEach(p => console.log(`  ${p.publishDate} ${p.slug} :: tags=${(p.tags||[]).join(',')}`));

console.log('\nclaude-code slugs:');
posts.filter(p => p.slug.includes('claude-code')).sort((a,b)=>a.publishDate.localeCompare(b.publishDate))
  .forEach(p => console.log(`  ${p.publishDate} ${p.slug} :: tags=${(p.tags||[]).join(',')}`));

console.log('\nralph-loop slugs:');
posts.filter(p => p.slug.includes('ralph')).sort((a,b)=>a.publishDate.localeCompare(b.publishDate))
  .forEach(p => console.log(`  ${p.publishDate} ${p.slug} :: tags=${(p.tags||[]).join(',')}`));

process.exit(0);

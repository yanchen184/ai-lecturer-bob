#!/usr/bin/env node
// Delete specific Firestore doc IDs from bob_blog_posts.
// Usage: node scripts/delete-blog-docs.mjs <docId1> <docId2> ...

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

const docIds = process.argv.slice(2)
if (!docIds.length) {
  console.error('Usage: node scripts/delete-blog-docs.mjs <docId1> <docId2> ...')
  process.exit(1)
}

let anyFail = false
for (const id of docIds) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${id}?key=${API_KEY}`
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.text()
    console.error(`FAIL [${id}]`, res.status, data)
    anyFail = true
    continue
  }
  console.log('DELETED', id)
}
process.exit(anyFail ? 1 : 0)

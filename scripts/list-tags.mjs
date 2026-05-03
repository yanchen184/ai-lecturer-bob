import { request } from 'node:https'

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'

function fetchAll(pageToken) {
  return new Promise((resolve, reject) => {
    let path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/bob_blog_posts?pageSize=100&key=${API_KEY}`
    if (pageToken) path += `&pageToken=${encodeURIComponent(pageToken)}`
    const req = request({ hostname: 'firestore.googleapis.com', path, method: 'GET' }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  let docs = []
  let token
  for (let i = 0; i < 5; i++) {
    const data = await fetchAll(token)
    docs.push(...(data.documents || []))
    if (!data.nextPageToken) break
    token = data.nextPageToken
  }

  const tagCounts = new Map()
  const catCounts = new Map()
  const posts = docs.map(d => {
    const f = d.fields
    const title = f.title?.stringValue || ''
    const cat = f.category?.stringValue || ''
    const slug = f.slug?.stringValue || ''
    const tags = (f.tags?.arrayValue?.values || []).map(t => t.stringValue || '')
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1)
    tags.forEach(t => tagCounts.set(t, (tagCounts.get(t) || 0) + 1))
    return { title, cat, slug, tags, docId: d.name.split('/').pop() }
  })

  console.log('=== Total posts:', posts.length, '===\n')
  console.log('=== Categories ===')
  for (const [c, n] of [...catCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n}x ${c}`)
  }
  console.log('\n=== Tags (sorted by count) ===')
  for (const [t, n] of [...tagCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n}x ${t}`)
  }
  console.log('\n=== Posts ===')
  for (const p of posts) {
    console.log(`[${p.cat}] ${p.title}`)
    console.log(`  slug: ${p.slug}`)
    console.log(`  docId: ${p.docId}`)
    console.log(`  tags: ${JSON.stringify(p.tags)}`)
    console.log()
  }
}

main().catch(e => { console.error(e); process.exit(1) })

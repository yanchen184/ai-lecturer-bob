// One-off: strip the broken `/ai-lecturer-bob/images/blog/` prefix from every
// blog doc's `content` field. Site base is `/`, so the correct path is
// `/images/blog/...`. Only the `content` field is PATCHed (updateMask), only
// when the bad prefix is present.
//
// Auth: owner OAuth token (firebase-tools refresh token) — pure apiKey writes
// are blocked by firestore.rules. Same path as publish-blog.mjs.
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'

const PROJECT_ID = 'forbidden-beauty'
const COLLECTION = 'bob_blog_posts'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const FIREBASE_CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

const BAD = '/ai-lecturer-bob/images/blog/'
const GOOD = '/images/blog/'

async function getOwnerAccessToken() {
  const cfgPath = `${homedir()}/.config/configstore/firebase-tools.json`
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'))
  const refreshToken = cfg?.tokens?.refresh_token
  if (!refreshToken) throw new Error('firebase CLI 缺 refresh_token,先 `firebase login`。')
  const body = new URLSearchParams({
    client_id: FIREBASE_CLI_CLIENT_ID,
    client_secret: FIREBASE_CLI_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  const res = await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) throw new Error(`token fail: ${JSON.stringify(data)}`)
  return data.access_token
}

const token = await getOwnerAccessToken()

// List all docs (apiKey read is allowed).
const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?key=${API_KEY}&pageSize=300`
const list = await fetch(listUrl, { cache: 'no-store' }).then((r) => r.json())
const docs = (list.documents || []).map((d) => ({
  id: d.name.split('/').pop(),
  slug: d.fields?.slug?.stringValue || '',
  content: d.fields?.content?.stringValue || '',
}))

const dirty = docs.filter((d) => d.content.includes(BAD))
console.log(`找到 ${dirty.length} 個含舊前綴的 doc,開始 PATCH content...`)

let ok = 0
let fail = 0
for (const d of dirty) {
  const fixed = d.content.split(BAD).join(GOOD)
  // sanity: must actually have changed, and must no longer contain BAD
  if (fixed === d.content || fixed.includes(BAD)) {
    console.log(`SKIP ${d.id} (${d.slug}): no-op or still dirty`)
    continue
  }
  // updateMask=content → only the content field is overwritten, rest untouched.
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(d.id)}` +
    `?updateMask.fieldPaths=content&key=${API_KEY}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: { content: { stringValue: fixed } } }),
  })
  if (res.ok) {
    ok++
    console.log(`OK   ${d.id} (${d.slug})`)
  } else {
    fail++
    console.error(`FAIL ${d.id} (${d.slug}): ${res.status} ${await res.text()}`)
  }
}
console.log(`完成: ${ok} 成功 / ${fail} 失敗`)

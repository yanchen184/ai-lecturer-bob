// One-off: remove <img> refs to image files that genuinely don't exist
// (404 on the server — not a path-prefix issue, the file was never generated).
// Targets each doc by docId (3 of 4 are non-canonical addDoc leftovers whose
// docId != slug). Removes only the single <img ...> block whose src contains
// the given missing filename, plus any now-orphaned blank line around it.
//
// Auth: owner OAuth token (firebase-tools refresh token) — apiKey writes are
// blocked by firestore.rules. Same path as publish-blog.mjs.
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'

const PROJECT_ID = 'forbidden-beauty'
const COLLECTION = 'bob_blog_posts'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const FIREBASE_CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

// docId → the missing image filename to strip the <img> for.
const TARGETS = [
  { docId: 'oYC7hmyVMS7tJVKaFIAV', file: 'tailwindui-repo.png', slug: 'ai-frontend-purple-problem-explained' },
  { docId: 'QMOQuE4zpoASA6XyB1aw', file: 'claude-code-repo.png', slug: 'ai-lesson-01-part2' },
  { docId: 'WlV9uy7Myl6MPIY0leJ2', file: 'anthropics-claude-code-repo.png', slug: 'claude-code-5hour-limit-schedule-loop' },
  { docId: 'kkterm-windows-terminal-ai', file: 'github-repo.png', slug: 'kkterm-windows-terminal-ai' },
]

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

const docUrl = (id) =>
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(id)}`

const token = await getOwnerAccessToken()

let ok = 0, fail = 0
for (const t of TARGETS) {
  // read via apiKey (read allowed)
  const doc = await fetch(`${docUrl(t.docId)}?key=${API_KEY}`, { cache: 'no-store' }).then((r) => r.json())
  if (!doc?.fields) { console.error(`SKIP ${t.docId} (${t.slug}): doc missing`); fail++; continue }
  const content = doc.fields?.content?.stringValue || ''
  if (!content.includes(t.file)) { console.log(`SKIP ${t.docId} (${t.slug}): file ref not present`); continue }

  // Remove the whole <img ...> tag whose src contains the filename. Tag may span
  // multiple lines (kkterm). Then collapse the blank line left behind.
  const imgRe = new RegExp(`<img\\b[^>]*?${t.file.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}[^>]*?>`, 'gs')
  let fixed = content.replace(imgRe, '')
  fixed = fixed.replace(/\n{3,}/g, '\n\n') // collapse the gap

  if (fixed === content || fixed.includes(t.file)) {
    console.error(`FAIL ${t.docId} (${t.slug}): no-op or still references ${t.file}`)
    fail++
    continue
  }

  const url = `${docUrl(t.docId)}?updateMask.fieldPaths=content&key=${API_KEY}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: { content: { stringValue: fixed } } }),
  })
  if (res.ok) { ok++; console.log(`OK   ${t.docId} (${t.slug}): removed <img> for ${t.file}`) }
  else { fail++; console.error(`FAIL ${t.docId} (${t.slug}): ${res.status} ${await res.text()}`) }
}
console.log(`完成: ${ok} 成功 / ${fail} 失敗`)

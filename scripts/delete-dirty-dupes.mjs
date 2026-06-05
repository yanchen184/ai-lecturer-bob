// One-off: delete dirty duplicate blog docs (early addDoc leftovers) so the
// build's dedup picks the clean canonical doc (docId == slug).
// Safety: before each DELETE, re-confirm the doc is dirty (old /ai-lecturer-bob/
// prefix) AND a clean canonical sibling (docId == slug) exists. Skip otherwise.
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'

const PROJECT_ID = 'forbidden-beauty'
const COLLECTION = 'bob_blog_posts'
const FIREBASE_CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

const BAD = '/ai-lecturer-bob/images/blog/'
const TARGETS = [
  '3UMCi79vA8T5fBKvoGGL', // claude-code-two-lessons-astro-and-tasklist
  '8AIwq6JqZA8a1VBxNzu8', // memory-governance-ep1-claude-bad-notes
  'CshrJ3z8etzkB1C5BJrB', // hermes-agent-academic
  'IsFVgGXJwK0f82W8LW9D', // hermes-agent-mac-install
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

const getDoc = async (id, token) =>
  fetch(docUrl(id), { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())

const token = await getOwnerAccessToken()

for (const id of TARGETS) {
  const doc = await getDoc(id, token)
  const slug = doc?.fields?.slug?.stringValue
  if (!slug) { console.log(`SKIP ${id}: doc missing/no slug`); continue }
  const dirty = (doc?.fields?.content?.stringValue || '').includes(BAD)
  const canon = await getDoc(slug, token)
  const canonClean = !!canon?.fields && !((canon?.fields?.content?.stringValue || '').includes(BAD))
  if (!dirty) { console.log(`SKIP ${id} (${slug}): not dirty`); continue }
  if (!canonClean) { console.log(`SKIP ${id} (${slug}): no clean canonical sibling`); continue }
  const del = await fetch(docUrl(id), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  console.log(`${del.ok ? 'DELETED' : 'FAIL ' + del.status} ${id} (${slug})`)
}

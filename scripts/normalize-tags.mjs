/**
 * 一次性 Firestore 修正：normalize tag/category 拼寫差異，把意思相同但寫法不同的合併。
 *
 * 規則：
 *   tags:
 *     - "ClaudeCode" → "Claude Code"
 *     - "AI工具" → "AI 工具"
 *     - "AI開發工作流" / "AI 開發工作流" / "AI工作流" → "AI 工作流"
 *   category:
 *     - 編碼壞掉的 "AI ��具" → "AI 工具"
 *     - "AI概論初階班" → "AI 概論初階班"
 */
import { request } from 'node:https'

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

const TAG_MAP = new Map([
  ['ClaudeCode', 'Claude Code'],
  ['AI工具', 'AI 工具'],
  ['AI工作流', 'AI 工作流'],
  ['AI 開發工作流', 'AI 工作流'],
  ['AI開發工作流', 'AI 工作流'],
  ['AI概論初階班', 'AI 概論初階班'],
])

const CATEGORY_MAP = new Map([
  ['AI概論初階班', 'AI 概論初階班'],
])

function fixCategory(cat) {
  if (cat == null) return cat
  // 編碼壞掉：含有 unicode replacement char 的歸到 AI 工具
  if (cat.includes('�')) return 'AI 工具'
  return CATEGORY_MAP.get(cat) ?? cat
}

function fixTags(tags) {
  if (!Array.isArray(tags)) return tags
  const mapped = tags.map(t => TAG_MAP.get(t) ?? t)
  // 去重，保留首次順序
  const seen = new Set()
  return mapped.filter(t => {
    if (seen.has(t)) return false
    seen.add(t)
    return true
  })
}

function httpRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const req = request(opts, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

async function listAllDocs() {
  const docs = []
  let token
  for (let i = 0; i < 5; i++) {
    let path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?pageSize=100&key=${API_KEY}`
    if (token) path += `&pageToken=${encodeURIComponent(token)}`
    const res = await httpRequest({ hostname: 'firestore.googleapis.com', path, method: 'GET' })
    if (res.status >= 300) throw new Error(`List failed: ${res.status} ${res.body}`)
    const json = JSON.parse(res.body)
    docs.push(...(json.documents || []))
    if (!json.nextPageToken) break
    token = json.nextPageToken
  }
  return docs
}

async function patchDoc(docId, fields) {
  const mask = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&')
  const path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${docId}?${mask}&key=${API_KEY}`
  const body = JSON.stringify({ fields })
  const res = await httpRequest({
    hostname: 'firestore.googleapis.com',
    path,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  }, body)
  if (res.status >= 300) throw new Error(`Patch ${docId} failed: ${res.status} ${res.body}`)
  return JSON.parse(res.body)
}

async function main() {
  const dryRun = process.argv.includes('--apply') ? false : true
  console.log(dryRun ? '🔍 DRY RUN — nothing will be patched. Pass --apply to write.' : '✏️  APPLYING changes')

  const docs = await listAllDocs()
  console.log(`Total docs: ${docs.length}\n`)

  let changed = 0
  for (const d of docs) {
    const id = d.name.split('/').pop()
    const f = d.fields
    const oldCat = f.category?.stringValue
    const oldTags = (f.tags?.arrayValue?.values || []).map(t => t.stringValue)
    const newCat = fixCategory(oldCat)
    const newTags = fixTags(oldTags)

    const catChanged = newCat !== oldCat
    const tagsChanged = JSON.stringify(newTags) !== JSON.stringify(oldTags)

    if (!catChanged && !tagsChanged) continue
    changed++

    const slug = f.slug?.stringValue || '(no slug)'
    console.log(`📝 ${slug} (${id})`)
    if (catChanged) console.log(`   category: ${JSON.stringify(oldCat)} → ${JSON.stringify(newCat)}`)
    if (tagsChanged) console.log(`   tags:     ${JSON.stringify(oldTags)} → ${JSON.stringify(newTags)}`)

    if (!dryRun) {
      const fields = {}
      if (catChanged) fields.category = { stringValue: newCat }
      if (tagsChanged) {
        fields.tags = {
          arrayValue: { values: newTags.map(t => ({ stringValue: t })) },
        }
      }
      fields.updatedAtIso = { stringValue: new Date().toISOString() }
      await patchDoc(id, fields)
      console.log('   ✓ patched')
    }
    console.log()
  }

  console.log(`\nSummary: ${changed} docs need changes (of ${docs.length})`)
  if (dryRun && changed > 0) console.log('Run again with --apply to write.')
}

main().catch(e => { console.error(e); process.exit(1) })

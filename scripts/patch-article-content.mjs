#!/usr/bin/env node
/**
 * 通用 patch:把 public/images/blog/<slug>/article.md 重新寫進 Firestore
 * bob_blog_posts collection 對應 doc 的 content + updateDate。
 *
 * 用法:
 *   node scripts/patch-article-content.mjs <slug>            # dry-run
 *   node scripts/patch-article-content.mjs <slug> --apply    # 真的寫
 *
 * 對應根因:
 *   - 舊文章 img src 寫死 /ai-lecturer-bob/ prefix(yanchen184.github.io 時代),
 *     2026-05-20 遷移後 prefix 失效,production 圖 404。
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

const slug = process.argv[2]
if (!slug || slug.startsWith('--')) {
  console.error('Usage: node patch-article-content.mjs <slug> [--apply]')
  process.exit(1)
}
const apply = process.argv.includes('--apply')

const ARTICLE_PATH = resolve(`public/images/blog/${slug}/article.md`)

async function queryBySlug(s) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`
  const body = {
    structuredQuery: {
      from: [{ collectionId: COLLECTION }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'slug' },
          op: 'EQUAL',
          value: { stringValue: s },
        },
      },
      limit: 1,
    },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Query failed: ${JSON.stringify(data)}`)
  const hits = data.filter((d) => d.document)
  return hits[0]?.document ?? null
}

async function patchDoc(docName, fields) {
  const updateMask = Object.keys(fields)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&')
  const url = `https://firestore.googleapis.com/v1/${docName}?${updateMask}&key=${API_KEY}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`PATCH failed: ${JSON.stringify(data)}`)
  return data
}

const content = await readFile(ARTICLE_PATH, 'utf8')
console.log(`[${slug}]`)
console.log(`  local content: ${content.length} chars`)

// 偵測舊 prefix
const oldPrefixHits = (content.match(/\/ai-lecturer-bob\//g) || []).length
if (oldPrefixHits > 0) {
  console.warn(`  ⚠️  本機檔還有 ${oldPrefixHits} 個 /ai-lecturer-bob/ prefix — 先修本機檔再 patch`)
  process.exit(1)
}

const doc = await queryBySlug(slug)
if (!doc) {
  console.error('  ⚠️  not found in Firestore')
  process.exit(1)
}
console.log(`  doc name:       ${doc.name}`)
const oldContent = doc.fields?.content?.stringValue ?? ''
const oldPrefixOnRemote = (oldContent.match(/\/ai-lecturer-bob\//g) || []).length
console.log(`  remote content: ${oldContent.length} chars`)
console.log(`  remote bad prefix: ${oldPrefixOnRemote}`)
console.log(`  diff:           ${content.length - oldContent.length} chars`)

if (!apply) {
  console.log('  (dry-run, 加 --apply 才會真的寫)')
  process.exit(0)
}

const fields = {
  content: { stringValue: content },
  updateDate: { stringValue: new Date().toISOString().slice(0, 10) },
}
await patchDoc(doc.name, fields)
console.log('  ✅ patched content + updateDate')

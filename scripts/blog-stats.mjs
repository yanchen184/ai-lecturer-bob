#!/usr/bin/env node
/**
 * blog-stats.mjs — 撈 Firebase Firestore 訪客 / 文章 view 統計
 *
 * Usage:
 *   node scripts/blog-stats.mjs                       # 全站累計
 *   node scripts/blog-stats.mjs --since 7d            # 近 7 天訪客（從 bob_visitors 撈）
 *   node scripts/blog-stats.mjs --slug claude-self-sync-intro  # 單篇詳細
 *
 * 輸出純文字表，方便丟 LINE / 終端直接看。
 */

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

const args = process.argv.slice(2)
const argMap = {}
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) argMap[args[i].slice(2)] = args[i + 1] ?? true
}

function parseDuration(s) {
  if (!s) return null
  const m = String(s).match(/^(\d+)([hd])$/)
  if (!m) return null
  const n = Number(m[1])
  return m[2] === 'd' ? n * 86400_000 : n * 3600_000
}

async function fetchAllDocs(collection, pageSize = 300) {
  const out = []
  let pageToken = ''
  while (true) {
    const url = `${BASE}/${collection}?key=${API_KEY}&pageSize=${pageSize}${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`fetch ${collection} failed: ${res.status}`)
    const data = await res.json()
    out.push(...(data.documents ?? []))
    if (!data.nextPageToken) break
    pageToken = data.nextPageToken
  }
  return out
}

function val(field) {
  if (!field) return null
  return (
    field.stringValue ??
    (field.integerValue !== undefined ? Number(field.integerValue) : null) ??
    field.timestampValue ??
    field.booleanValue ??
    null
  )
}

async function getStats() {
  const res = await fetch(`${BASE}/bob_stats/visitors?key=${API_KEY}`)
  if (!res.ok) return null
  const data = await res.json()
  return {
    totalVisits: Number(data.fields?.totalVisits?.integerValue ?? 0),
    lastVisit: data.fields?.lastVisit?.timestampValue ?? null,
  }
}

async function main() {
  const sinceMs = parseDuration(argMap.since)
  const slugFilter = argMap.slug

  console.log(`\n=== Bob Blog Stats @ ${new Date().toISOString()} ===\n`)

  const stats = await getStats()
  if (stats) {
    console.log(`累計訪客  : ${stats.totalVisits}`)
    console.log(`最後訪客  : ${stats.lastVisit}`)
    console.log()
  }

  // 撈所有文章 stat
  const postStats = await fetchAllDocs('bob_post_stats')
  const rows = postStats
    .map((d) => ({
      slug: d.name.split('/').pop(),
      views: Number(d.fields?.totalViews?.integerValue ?? 0),
      lastViewed: d.fields?.lastViewed?.timestampValue ?? '',
    }))
    .filter((r) => !slugFilter || r.slug === slugFilter)
    .sort((a, b) => b.views - a.views)

  const totalPostViews = rows.reduce((s, r) => s + r.views, 0)
  console.log(`文章累計 view: ${totalPostViews}（${rows.length} 篇）\n`)

  console.log('排名  views  slug'.padEnd(80))
  console.log('-'.repeat(80))
  rows.slice(0, 30).forEach((r, i) => {
    console.log(`${String(i + 1).padStart(3)}.  ${String(r.views).padStart(4)}  ${r.slug}`)
  })
  console.log()

  if (sinceMs) {
    const cutoff = Date.now() - sinceMs
    console.log(`\n--- 近 ${argMap.since} 訪客明細（從 bob_visitors 撈） ---\n`)
    const visitors = await fetchAllDocs('bob_visitors')
    const recent = visitors
      .map((d) => ({
        ts: d.fields?.timestamp?.timestampValue,
        path: val(d.fields?.path) ?? '/',
        ref: val(d.fields?.referrer) ?? 'direct',
        ua: (val(d.fields?.userAgent) ?? '').slice(0, 60),
      }))
      .filter((r) => r.ts && Date.parse(r.ts) >= cutoff)
      .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))

    console.log(`共 ${recent.length} 個 session（1 小時去重）`)
    const byPath = {}
    const byRef = {}
    for (const r of recent) {
      byPath[r.path] = (byPath[r.path] ?? 0) + 1
      const refKey = r.ref === 'direct' ? 'direct' : new URL(r.ref).hostname
      byRef[refKey] = (byRef[refKey] ?? 0) + 1
    }

    console.log('\n按路徑：')
    Object.entries(byPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([p, c]) => console.log(`  ${String(c).padStart(3)}  ${p}`))

    console.log('\n按來源：')
    Object.entries(byRef)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([r, c]) => console.log(`  ${String(c).padStart(3)}  ${r}`))
  }

  console.log()
}

main().catch((e) => {
  console.error('FAIL', e)
  process.exit(1)
})

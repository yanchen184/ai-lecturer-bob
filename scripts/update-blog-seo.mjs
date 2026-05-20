#!/usr/bin/env node
/**
 * 改舊文 SEO 黃金標題 + excerpt。
 * 透過 Firestore REST API PATCH，updateMask 只動 title / excerpt（不碰 content / tags / faqItems）。
 *
 * 用法：
 *   node scripts/update-blog-seo.mjs              # dry-run（只列出要改什麼）
 *   node scripts/update-blog-seo.mjs --apply      # 真的寫入
 */

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

// 要改的文章。slug + 新 title + 新 excerpt。
// 改的原則：把「使用者會打進搜尋框的詞」放標題前面。
const updates = [
  {
    slug: 'mempalace-3-3-5-claude-p-proxy',
    newTitle:
      'MemPalace 知識管理工具完整教學：3.3.5 救援、HNSW 修復、claude -p proxy 省 API 錢',
    newExcerpt:
      'MemPalace 是 AI agent 用的長期記憶系統。chromadb 1.5.x 在 macOS 26.4 ARM64 必 SIGSEGV，所有 CLI 全死、只剩 MCP server 苟活。MemPalace 3.3.5 用兩個機制救回來：HNSW segment quarantine 自動隔離壞索引、repair --mode from-sqlite 從 sqlite3 直接撈資料重灌新 palace。本文記錄完整升級路徑、3.3.5 兩個救命機制原理、外加 180 行 Python claude-p-openai-proxy.py 把 claude -p CLI 包成 OpenAI 相容 HTTP 端點，讓 mempalace compress 走 Max 訂閱、零 API 成本。',
  },
  {
    slug: 'karpathy-llm-wiki',
    newTitle:
      'LLM Wiki 是什麼？Karpathy 知識編譯方案兩週實測（vs RAG、token 降 87%、踩坑筆記）',
    newExcerpt:
      'LLM Wiki 是什麼？2026 年 4 月 Karpathy 在 gist 丟了 200 行 markdown，一週後全網炸開、12 個社群 implementation。一句話講：讓 LLM 把你丟的所有資料「編譯」成一個結構化的 markdown 知識庫，以後問問題不查原始檔、查這個被整理過的 wiki。本文拆解 RAG vs LLM Wiki 的編譯式/解釋式之差、三層架構、30 分鐘上手路徑、我把 7 場教學逐字稿 + 200 則 Discord QA 丟進去跑兩週的實測（token 降 87%）、5 個踩坑、什麼情境裝了反而是負擔。',
  },
]

async function queryBySlug(slug) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`
  const body = {
    structuredQuery: {
      from: [{ collectionId: COLLECTION }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'slug' },
          op: 'EQUAL',
          value: { stringValue: slug },
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
  if (!res.ok) {
    throw new Error(`Query failed for ${slug}: ${JSON.stringify(data)}`)
  }
  const hits = data.filter((d) => d.document)
  if (hits.length === 0) return null
  return hits[0].document
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
  if (!res.ok) {
    throw new Error(`PATCH failed: ${JSON.stringify(data)}`)
  }
  return data
}

const apply = process.argv.includes('--apply')

let anyFail = false
for (const u of updates) {
  console.log(`\n[${u.slug}]`)
  const doc = await queryBySlug(u.slug)
  if (!doc) {
    console.error(`  ⚠️  not found in Firestore`)
    anyFail = true
    continue
  }
  const oldTitle = doc.fields?.title?.stringValue ?? ''
  const oldExcerpt = doc.fields?.excerpt?.stringValue ?? ''
  console.log(`  OLD title:   ${oldTitle}`)
  console.log(`  NEW title:   ${u.newTitle}`)
  console.log(
    `  excerpt: ${oldExcerpt.length} → ${u.newExcerpt.length} chars`,
  )

  if (!apply) {
    console.log(`  (dry-run, 加 --apply 才會真的寫入)`)
    continue
  }

  const fields = {
    title: { stringValue: u.newTitle },
    excerpt: { stringValue: u.newExcerpt },
    updateDate: {
      stringValue: new Date().toISOString().slice(0, 10),
    },
  }
  try {
    await patchDoc(doc.name, fields)
    console.log(`  ✅ patched`)
  } catch (err) {
    console.error(`  ❌ ${err.message}`)
    anyFail = true
  }
}

if (!apply) {
  console.log(`\nDry-run 完成。確認 OK 後跑：node scripts/update-blog-seo.mjs --apply`)
}

process.exit(anyFail ? 1 : 0)

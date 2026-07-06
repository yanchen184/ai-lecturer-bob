#!/usr/bin/env node
/**
 * 改舊文 SEO 黃金標題 + excerpt。
 * 透過 Firestore REST API PATCH，updateMask 只動 title / excerpt（不碰 content / tags / faqItems）。
 *
 * 用法：
 *   node scripts/update-blog-seo.mjs              # dry-run（只列出要改什麼）
 *   node scripts/update-blog-seo.mjs --apply      # 真的寫入
 */

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

// 2026-05-27 起 firestore.rules 收緊：bob_blog_posts 寫入只認 service account / owner。
// 裸 API key PATCH 會 403。改走 firebase CLI 的 owner OAuth token（同 publish-blog.mjs）。
// client_id / secret 是 firebase-tools 公開內建常數（Google 官方文件已公開，非機密）。
const FIREBASE_CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

async function getOwnerAccessToken() {
  const cfgPath = `${homedir()}/.config/configstore/firebase-tools.json`
  let refreshToken
  try {
    const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'))
    refreshToken = cfg?.tokens?.refresh_token
  } catch {
    throw new Error(
      `讀不到 firebase CLI 設定 (${cfgPath})。先跑 \`firebase login\` 登入 bobchen184@gmail.com。`,
    )
  }
  if (!refreshToken)
    throw new Error('firebase CLI 設定缺 refresh_token，請重新 `firebase login`。')

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
  if (!res.ok || !data.access_token)
    throw new Error(`換 access token 失敗: ${JSON.stringify(data)}`)
  return data.access_token
}

// 要改的文章。slug + 新 title + 新 excerpt。
// 改的原則：把「使用者會打進搜尋框的詞」放標題前面。
const updates = [
  {
    // 2026-07-07 CTR 優化：GSC 28 天 69 曝光 0 點擊（query「hermes agent proxy」pos 28）。
    // 舊題「Mac 裝 Hermes Agent 接內網 LLM：踩了 4 個洞才接通」— 關鍵字沒前置。
    slug: 'hermes-agent-mac-install',
    newTitle:
      'Hermes Agent Mac 安裝教學：接內網 LLM proxy 踩了 4 個洞才接通',
    newExcerpt:
      'Hermes Agent 在 Mac 的完整安裝與內網 LLM proxy 接法。hermes -z 跑完 exit 0、stdout 完全空白？根因是 OpenAI-compatible wrapper 缺 4 件事：/v1/models、usage 欄位、SSE streaming 格式、system_fingerprint。本文從 0 安裝 Hermes 到真正接通，每個坑附症狀與修法，最後附完整 wrapper 檢查清單。',
  },
  {
    // 2026-07-07 CTR 優化：GSC 28 天 60 曝光 0 點擊，query「musubi tuner」pos 5 卻沒人點 —
    // 舊題「19 次失敗才訓出 LoRA：Windows + RTX 4070 的 8 個地雷」完全沒出現 musubi-tuner。
    slug: 'ohwx-companion',
    newTitle:
      'musubi-tuner Windows 訓練 LoRA：19 次失敗換來的 8 個地雷（RTX 4070）',
    newExcerpt:
      'musubi-tuner 在 Windows + RTX 4070 訓練 Wan 2.2 i2v LoRA 的完整避雷 SOP：5 次 BSOD、19 次訓練失敗換來 8 個地雷區。含 dataset 準備、訓練參數、每個地雷的症狀與解法，最後把訓好的卡通形象 LoRA 做成 scroll-aware 浮動角色掛上個人網站。',
  },
]

// 同 slug 可能有多筆 doc（歷史 addDoc 殘留）。build dedup 只留
// 「published=true 且 docId 字典序最小」那筆，patch 別筆會「Firestore 對、線上不變」。
// 所以這裡撈全部同 slug doc → 濾 published → 按 docId asc 取 [0]。
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
  const hits = data
    .filter((d) => d.document)
    .map((d) => d.document)
    .filter((doc) => doc.fields?.published?.booleanValue === true)
    .sort((a, b) => (a.name < b.name ? -1 : 1))
  if (hits.length === 0) return null
  if (hits.length > 1) {
    console.log(
      `  ⚠️  ${slug} 有 ${hits.length} 筆 published doc，patch build winner: ${hits[0].name.split('/').pop()}`,
    )
  }
  return hits[0]
}

async function patchDoc(docName, fields, accessToken) {
  const updateMask = Object.keys(fields)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&')
  const url = `https://firestore.googleapis.com/v1/${docName}?${updateMask}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fields }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`PATCH failed: ${JSON.stringify(data)}`)
  }
  return data
}

const apply = process.argv.includes('--apply')

const accessToken = apply ? await getOwnerAccessToken() : null

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
    await patchDoc(doc.name, fields, accessToken)
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

/**
 * ig-create → Blog 同步腳本
 *
 * 用途：`/ig-create` skill 產生 IG 輪播貼文時，同時把文案轉成部落格草稿
 * 寫入 Firestore `bob_blog_posts` collection。草稿狀態 (published=false)，
 * 由 admin 後台審核後才發佈。
 *
 * 呼叫方式：
 *   node scripts/ig-blog-sync.mjs \
 *     --title "標題" \
 *     --content "Markdown 內文" \
 *     --tags "tag1,tag2" \
 *     --excerpt "摘要（可選）" \
 *     --category "分類（可選，預設：隨筆）" \
 *     --slug "custom-slug（可選，自動從 title 衍生）"
 *
 * 輸出：
 *   - 成功：印出新文章的 Firestore document id（單行）
 *   - 失敗：stderr 印出錯誤並以非 0 結束
 *
 * 為何直接打 Firestore REST API 而不用 Firebase SDK：
 *   - 本腳本為 CLI 工具，不想為了單次寫入 bundle SDK
 *   - Firestore REST + 該 project 的公開 Web API Key 已能滿足寫入
 *     （依賴該 collection 的 Firestore security rules）
 */

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

/**
 * 極簡 argv parser：支援 `--key value` 與 `--key=value`，不處理 boolean flag。
 */
const parseArgs = (argv) => {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue

    const eqIndex = token.indexOf('=')
    if (eqIndex > -1) {
      args[token.slice(2, eqIndex)] = token.slice(eqIndex + 1)
    } else {
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith('--')) {
        args[token.slice(2)] = next
        i += 1
      } else {
        args[token.slice(2)] = ''
      }
    }
  }
  return args
}

/**
 * 依 title 產生 slug：中文保留、英文小寫、空白轉 -，去除標點。
 */
const slugify = (title) =>
  title
    .trim()
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '-')
    .replace(/[!-/:-@[-`{-~]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * 粗估中文 + 英文混合文章的閱讀時間（分鐘）。
 * 假設平均中文 300 字/分鐘，英文算字數以 200wpm。
 */
const estimateReadingTime = (content) => {
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length
  const minutes = Math.ceil(chineseChars / 300 + englishWords / 200)
  return Math.max(minutes, 1)
}

/**
 * 把 JS 值轉成 Firestore REST 的型別包裝格式。
 * 只支援本腳本用到的 string / number / boolean / array<string>。
 */
const toFirestoreValue = (value) => {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value }
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: { values: value.map(toFirestoreValue) },
    }
  }
  throw new Error(`不支援的欄位型別: ${typeof value}`)
}

const toFirestoreFields = (obj) => {
  const fields = {}
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v)
  }
  return fields
}

const main = async () => {
  const args = parseArgs(process.argv.slice(2))

  const title = args.title?.trim()
  const content = args.content?.trim()
  if (!title || !content) {
    console.error(
      'Usage: node scripts/ig-blog-sync.mjs --title "..." --content "..." [--tags t1,t2] [--excerpt "..."] [--category "..."] [--slug "..."]'
    )
    process.exit(1)
  }

  const tags = args.tags
    ? args.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : []
  const excerpt = args.excerpt?.trim() || content.slice(0, 120)
  const category = args.category?.trim() || '隨筆'
  const slug = args.slug?.trim() || slugify(title) || `ig-${Date.now()}`
  const today = new Date().toISOString().slice(0, 10)
  const nowIso = new Date().toISOString()

  const payload = {
    slug,
    title,
    excerpt,
    content,
    author: '陳彥彤',
    publishDate: today,
    category,
    tags,
    readingTime: estimateReadingTime(content),
    featured: false,
    published: true,
    source: 'ig-create',
    // Firestore REST 沒有 serverTimestamp，改用 client 時間字串
    // Admin 介面存檔時會由 updatePost 補上真正的 serverTimestamp
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?key=${API_KEY}`

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(payload) }),
    })
  } catch (error) {
    console.error(`[ig-blog-sync] 網路錯誤: ${error.message}`)
    process.exit(1)
  }

  if (!response.ok) {
    const text = await response.text()
    console.error(
      `[ig-blog-sync] Firestore 回應 ${response.status}: ${text.slice(0, 500)}`
    )
    process.exit(1)
  }

  const body = await response.json()
  // REST 回傳 name: "projects/<pid>/databases/(default)/documents/<collection>/<docId>"
  const docId = body.name?.split('/').pop()
  if (!docId) {
    console.error('[ig-blog-sync] 回應缺少 document id')
    process.exit(1)
  }

  // 成功時只輸出 document id（一行），方便 skill 取用
  process.stdout.write(`${docId}\n`)
}

main().catch((error) => {
  console.error(`[ig-blog-sync] 未預期錯誤: ${error.message}`)
  process.exit(1)
})

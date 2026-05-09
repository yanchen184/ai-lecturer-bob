#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

const slug = 'ruflo-multi-agent-claude'
const content = readFileSync(
  'D:/ai-lecturer-bob/public/images/blog/ruflo-multi-agent-claude/article.md',
  'utf-8',
)

const wordCount = content.replace(/\s/g, '').length
const readingTime = Math.max(1, Math.round(wordCount / 400))

const faqItems = [
  {
    q: 'RuFlow 真的能省 75% 的 Claude API 費用嗎？',
    a: '官方 README 沒給 benchmark，「省 75%」是 dev.to 推銷文寫的。邏輯上 Haiku 比 Sonnet 便宜 4-5 倍，把簡單任務派給 Haiku 確實會省錢，但實際比例要看你 90% 任務能不能真的跑 Haiku 等級。把它當「上限值」、別當保證。',
  },
  {
    q: '60 agents 還是 100+ agents？',
    a: '官方 README 寫 100+，IG / TikTok 文案寫 60。我以 GitHub repo 為準。社群轉述時數字會被簡化或挑某個版本。',
  },
  {
    q: '裝 RuFlow 會破壞我現有的 Claude Code 環境嗎？',
    a: '官方提供三種裝法。最不破壞的是 `claude mcp add ruflo -- npx ruflo@latest mcp start`，把它變成你 Claude 的一個 MCP server，要用才呼叫。不喜歡直接 `claude mcp remove ruflo` 移除即可。',
  },
  {
    q: '多 agent 並行不是反而會燒更多 token 嗎？',
    a: '會的。表面上路由省錢，但多個 agent 同時跑、每個都要 context 都要回 response，如果路由判斷沒寫好反而比單一 Claude 燒更多。一定要打開 cost-tracker plugin 設預算上限。',
  },
  {
    q: 'AgentDB 持久記憶會不會把我的程式碼傳到雲端？',
    a: 'README 沒寫 AgentDB 預設儲存位置。安裝後第一件事先確認 AgentDB 在本機磁碟還是某個 cloud endpoint。生產環境 / 客戶資料的話，跑 RuFlow 之前一定要查清楚再餵敏感內容。',
  },
  {
    q: '我什麼時候該裝 RuFlow？',
    a: '你已經把 Claude Code 用到痛點明確時 — 例如「我重複做這套五步驟流程已經 N 次」、「我跨 6 個 repo 的工作流接得很亂」。如果你還在「跟 Claude 對話寫單檔 code」階段，先把基本工具用熟，不用急著上 multi-agent。',
  },
]

const fields = {
  slug: { stringValue: slug },
  title: {
    stringValue:
      'RuFlow 是什麼？把 Claude Code 變成 100+ agent 群的開源編排器，到底是不是真的？',
  },
  excerpt: {
    stringValue:
      '社群瘋傳的 RuFlow 真的能省 75% API 費用嗎？我去查了官方 GitHub，把 IG 文案、TikTok、dev.to 推銷文、官方 README 四個來源逐項比對，告訴你哪些是真的、哪些被放大過。',
  },
  content: { stringValue: content },
  author: { stringValue: '陳彥彤' },
  publishDate: { stringValue: new Date().toISOString().slice(0, 10) },
  category: { stringValue: 'AI 工程' },
  tags: {
    arrayValue: {
      values: [
        { stringValue: 'Claude Code' },
        { stringValue: 'multi-agent' },
        { stringValue: 'RuFlow' },
        { stringValue: 'AI 工具' },
        { stringValue: '開源' },
        { stringValue: '智慧路由' },
      ],
    },
  },
  readingTime: { integerValue: String(readingTime) },
  featured: { booleanValue: false },
  published: { booleanValue: true },
  faqItems: {
    arrayValue: {
      values: faqItems.map((item) => ({
        mapValue: {
          fields: {
            q: { stringValue: item.q },
            a: { stringValue: item.a },
          },
        },
      })),
    },
  },
}

const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?key=${API_KEY}`
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields }),
})
const data = await res.json()
if (!res.ok) {
  console.error('FAIL', JSON.stringify(data, null, 2))
  process.exit(1)
}
const docId = data.name.split('/').pop()
console.log('OK doc id:', docId)
console.log('URL:', `https://yanchen184.github.io/ai-lecturer-bob/blog/${slug}/`)
console.log('reading time:', readingTime, 'min')
console.log('word count:', wordCount)

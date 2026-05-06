#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

const slug = 'claude-code-lesson-2-tame'
const content = readFileSync('/tmp/lesson2-blog.md', 'utf-8')

const wordCount = content.replace(/\s/g, '').length
const readingTime = Math.max(1, Math.round(wordCount / 400))

const faqItems = [
  {
    q: 'CLAUDE.md 跟 Auto memory 的差別是什麼？',
    a: 'CLAUDE.md 是你主動寫的角色與規矩，每次 Claude 啟動都會讀。Auto memory 是 Claude 自動觀察你之後存下來的偏好筆記。前者是設定，後者是記憶——兩個一起用效果最好。',
  },
  {
    q: 'Claude Code 的對話會永遠存著嗎？儲存在哪裡？',
    a: '存在你的電腦本機 ~/.claude/projects/<encoded-path>/<session-id>.jsonl，不是純雲端。可以用 grep 搜舊對話內容。理論上沒上限，建議偶爾整理超過半年沒用的 session。',
  },
  {
    q: 'Agent 跟主對話會吃同一個 context 嗎？',
    a: '不會。Agent 是獨立的子對話，主對話派任務出去之後，agent 自己跑、用自己的 context，最後把結論回傳給主對話。這就是為什麼派 agent 可以保持主對話乾淨。',
  },
  {
    q: '我每天都用 Claude Code，要選哪個 plan？',
    a: '一開始用 $20 Pro，如果兩天就把 token 用完可以升到 $200 Max。Pro 適合偶爾用；Max 適合每天 8 小時開著它寫 code、派 agent，額度大概是 Pro 的 20 倍。',
  },
  {
    q: 'Ultrathink 真的會花更多錢嗎？',
    a: '會。它不限制思考 token，所以一個 ultrathink prompt 的成本可能是普通 prompt 的 5-10 倍。建議只用在真的需要深度思考的場景：架構設計、棘手 debug，不要拿來跑日常任務。',
  },
  {
    q: '我可以同時用 Claude Code 跟 Cursor 嗎？',
    a: '可以，兩個不衝突。Cursor 是 GUI 為主、適合在 IDE 裡寫 code；Claude Code 是 CLI 為主、可以跑 agent / 排程任務。建議 Cursor 寫 code、Claude Code 做工作流。',
  },
]

const fields = {
  slug: { stringValue: slug },
  title: { stringValue: '如何馴服 Claude Code？CLAUDE.md、Auto memory 與 Agent 完整實戰（含踩坑）' },
  excerpt: { stringValue: '第二堂課文字版：用 CLAUDE.md、Auto memory、Agent 三件套，把 Claude Code 從每天從零認識你的新同事，馴服成你的開發夥伴。' },
  content: { stringValue: content },
  author: { stringValue: '陳彥彤' },
  publishDate: { stringValue: new Date().toISOString().slice(0, 10) },
  category: { stringValue: 'AI 工具' },
  tags: {
    arrayValue: {
      values: [
        { stringValue: 'Claude Code' },
        { stringValue: 'CLAUDE.md' },
        { stringValue: 'Agent' },
        { stringValue: 'AI 教學' },
        { stringValue: '工程師工具' },
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

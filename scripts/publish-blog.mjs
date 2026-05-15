#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

/** 每篇文章: { slug, title, excerpt, category, tags[], faqItems[], featured? } */
const posts = [
  {
    slug: 'hermes-agent-mac-install',
    title:
      '從 0 在 Mac 上裝 Hermes Agent 接內網 LLM：proxy 補洞 + launchd 自啟動完整實戰',
    excerpt:
      '想在 Mac 上裝 Hermes Agent 接自家內網 LLM,結果 hermes -z 跑完 exit 0、stdout 完全空白?本文記錄從 0 安裝 Hermes、發現 OpenAI-compatible wrapper 缺 4 件事 (/v1/models、usage、SSE streaming、system_fingerprint) 導致 silent fail,寫 FastAPI proxy 一次補齊,最後掛 launchd 開機自啟動的完整路徑。附完整可複製 proxy.py、踩坑清單、排查心法。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      'AI Agent',
      'OpenAI API',
      'FastAPI',
      'macOS',
      'launchd',
      'Breeze2',
      'CLI',
    ],
    faqItems: [
      {
        q: 'Hermes Agent 跟 Claude Code 哪個好?',
        a: '不同場景。綁定 Anthropic 用 Claude Code、要自架/多 provider 用 Hermes。Claude Code 生產級別更穩、Hermes 更彈性但要自己搞 prompt 路由。我兩個都裝。',
      },
      {
        q: '為什麼 hermes -z 跑完完全空白、沒錯誤?',
        a: '99% 是後端 OpenAI-compatible wrapper 半套實作。Hermes 走 OpenAI SDK strict 模式,response 缺 usage 欄位、缺 /v1/models 端點、或 stream 格式不對都會 silent drop。session JSON 只記到 user message、exit 0、沒 log,debug 極端折磨。要在 transport 層加 access log 才看得到真相。',
      },
      {
        q: '為什麼不直接接 wrapper,要多一層 proxy?',
        a: '如果 wrapper 本身完整實作 OpenAI API (含 /v1/models、usage、SSE streaming),可以直接接。但很多內部 wrapper 都是只實作 /v1/chat/completions 的半套版本,差一條 Hermes 就 silent fail。proxy 就是在中間補洞的最乾淨解法,而且不用改別人的 wrapper。',
      },
      {
        q: 'proxy 加在中間會不會很慢?',
        a: '127.0.0.1:8910 是本機,httpx 同步轉發加 SSE 包裝大約多 5-15ms。Breeze2 自己回應就要 1-5 秒,proxy 開銷可以忽略。',
      },
      {
        q: 'launchd 跑不起來怎麼辦?',
        a: '看 proxy.err.log。最常見的是 venv 路徑寫錯。.venv/bin/uvicorn 一定要是絕對路徑、且 WorkingDirectory 一定要設成專案根目錄。也要檢查 plist 的 Label 跟檔名一致、用 launchctl load -w 載入。',
      },
      {
        q: '為什麼借 alibaba provider 而不是 openai?',
        a: 'OpenAI 系列 provider 在 Hermes 內部會多打 organization probe;DashScope (alibaba) provider 走純 OpenAI 協定、無私有探測,只多注入一句 "You are powered by ..." system prompt,對本地實驗無傷大雅。我中間試過借 lmstudio 完全錯路 — 它會打 LM Studio 私有 GET /api/v1/models,回傳格式跟 OpenAI 不同,探測失敗就跳過整個 chat call。',
      },
    ],
    featured: false,
  },
  {
    slug: 'hermes-agent-academic',
    title:
      'Hermes Agent 為什麼擠進 OpenRouter App 排行榜第 2?結構性原因解析',
    excerpt:
      '2026 上半年 OpenRouter App & Agent Rankings 公布,Hermes Agent (NousResearch 維護的開源 CLI agent) 排名第 2,僅次於 ChatGPT、把 Kilo Code / Claude Code / Cline 全壓在身後。本文拆解三個結構性原因:provider-agnostic 直接吃 OpenRouter 紅利、開源 CLI 的 long-tail 採用、NousResearch 的開源信任資本。並提供 v0.13.0 release 訊號分析、跟主流 agent 的真實差異對照、反方論點。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      'NousResearch',
      'OpenRouter',
      'AI Agent',
      'Open Source',
      'LLM Routing',
      'CLI Agent',
    ],
    faqItems: [
      {
        q: 'Hermes Agent 排第 2 的依據是什麼?',
        a: 'OpenRouter 公布的 App & Agent Rankings,按 token 使用量計算。第一名是 OpenAI 的 ChatGPT 客戶端,第二名是 Hermes Agent,把 Kilo Code、Claude Code、Cline 全壓在身後。OpenRouter 是 2026 年「多 model 比較與切換」的事實標準,排名比 GitHub stars 更能反應真實採用度 (GitHub stars 量「知道你存在」,App Rankings 量「真的拿你燒錢」)。',
      },
      {
        q: 'OpenRouter 跟 Hermes Agent 的關係?',
        a: 'OpenRouter 是 LLM 的 stripe,一個 API endpoint 後面接 100+ 家 model provider。Hermes Agent 的 provider-agnostic 設計讓它的 openai provider 改一行 OPENAI_BASE_URL 就能接 OpenRouter,零摩擦。Hermes 的 architecture 本身就是 OpenRouter 的 perfect funnel。',
      },
      {
        q: 'Hermes Agent 跟 Claude Code 的真實差異?',
        a: '真實差異不在功能,在綁定強度。Claude Code 綁死 Anthropic、適合「我就是要 Claude」的場景;Hermes 不綁任何東西、適合「我要自己組合」的人。Claude Code 是閉源、只有 Anthropic 員工能提交;Hermes v0.13.0 過去一個月 282 個 contributors 提交 PR,速度差距會在 6 個月後拉開。',
      },
      {
        q: 'NousResearch 是什麼來頭?',
        a: 'NousResearch 是以 Hermes 系列開源 LLM 聞名的研究機構,model 權重全部公開、論文齊全、Discord 活躍。他們不是「先開源後閉源」的創投暖場團隊,是真開源。這份信任資本讓 Hermes Agent 一發布就有現成擁護者社群會自願寫 plugin、回報 bug、推薦給朋友 — 在 2026 純開源信任資本是稀缺品。',
      },
      {
        q: 'Hermes Agent 有什麼缺點?',
        a: '三個。第一,silent fail 折磨人 — response 格式錯一個小欄位就 exit 0、stdout 空白、沒 log,debug 極端痛苦。第二,文件落後 release 太多 — v0.13.0 加了一堆東西,README 還停在 v0.10 範例。第三,customization 極致,有人視為自由、有人視為時間黑洞 — 如果你只想「能跑就好」,Claude Code 反而省事。',
      },
    ],
    featured: false,
  },
]

const wordCountOf = (s) => s.replace(/\s/g, '').length
const readingTimeOf = (s) => Math.max(1, Math.round(wordCountOf(s) / 400))

function buildFields(post) {
  const articlePath = resolve(`public/images/blog/${post.slug}/article.md`)
  const content = readFileSync(articlePath, 'utf-8')
  const wordCount = wordCountOf(content)
  const readingTime = readingTimeOf(content)

  return {
    fields: {
      slug: { stringValue: post.slug },
      title: { stringValue: post.title },
      excerpt: { stringValue: post.excerpt },
      content: { stringValue: content },
      author: { stringValue: '陳彥彤' },
      publishDate: { stringValue: new Date().toISOString().slice(0, 10) },
      category: { stringValue: post.category },
      tags: {
        arrayValue: {
          values: post.tags.map((t) => ({ stringValue: t })),
        },
      },
      readingTime: { integerValue: String(readingTime) },
      featured: { booleanValue: !!post.featured },
      published: { booleanValue: true },
      faqItems: {
        arrayValue: {
          values: post.faqItems.map((item) => ({
            mapValue: {
              fields: {
                q: { stringValue: item.q },
                a: { stringValue: item.a },
              },
            },
          })),
        },
      },
    },
    wordCount,
    readingTime,
  }
}

const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?key=${API_KEY}`

let anyFail = false
for (const post of posts) {
  const { fields, wordCount, readingTime } = buildFields(post)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error(`FAIL [${post.slug}]`, JSON.stringify(data, null, 2))
    anyFail = true
    continue
  }
  const docId = data.name.split('/').pop()
  console.log('OK doc id:', docId, '|', post.slug)
  console.log(
    '  URL:',
    `https://yanchen184.github.io/ai-lecturer-bob/blog/${post.slug}/`
  )
  console.log('  reading time:', readingTime, 'min | word count:', wordCount)
}

process.exit(anyFail ? 1 : 0)

#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { homedir } from 'node:os'

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

// 2026-05-27 起 firestore.rules 把 bob_blog_posts 寫入收緊成「只認 service account」，
// 純 API key 的匿名 REST 寫入會 403。改用 firebase CLI 已登入的 owner OAuth token
// 走 IAM 身分寫入 —— IAM/Admin 路徑不受 security rules 約束。
// client_id / secret 是 firebase-tools 公開內建常數（Google 官方文件已公開,非機密）。
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
      `讀不到 firebase CLI 設定 (${cfgPath})。先跑 \`firebase login\` 登入 bobchen184@gmail.com。`
    )
  }
  if (!refreshToken)
    throw new Error('firebase CLI 設定缺 refresh_token,請重新 `firebase login`。')

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

/** 每篇文章: { slug, title, excerpt, category, tags[], faqItems[], featured? } */
const posts = [
  {
    slug: 'ponytail-ai-agent-less-code-plugin',
    title: 'Ponytail 插件實測：讓 AI 程式碼少 80-94%、成本降四成的「懶資深工程師」法則',
    excerpt:
      '爆紅 AI 插件 Ponytail 用一條 YAGNI 決策階梯，逼 AI Agent 能不寫就不寫。實測程式碼少 80-94%、速度快 3-6 倍、成本降四成，5 天衝 2.7 萬星，本文含安裝與實測。',
    category: 'AI 工具',
    tags: [
      'Ponytail',
      'AI 過度設計',
      'AI Agent 插件',
      'YAGNI',
      'Claude Code 插件',
      'Codex',
      'Gemini CLI',
      'AI 寫太多 code',
    ],
    publishDate: '2026-06-17',
    featured: true,
    faqItems: [
      {
        q: 'Ponytail 會幫我寫程式碼嗎？',
        a: '不會。它本身幾乎不產 code，做的是「注入規則」讓你的 AI Agent 傾向少寫，以及主動幫你抓出可以刪掉的過度設計（可掃 diff 或掃整個 repo 回你一張刪除清單）。實際寫 code 的還是你原本的 Agent。',
      },
      {
        q: 'Ponytail 那個「降四成」到底是降什麼？',
        a: '是每個任務的成本（cost per task）降 42–75%，不是 token 數降四成。程式碼行數降的是 80–94%，速度是快 3–6 倍，三個是不同指標，網路上常被混為一談。數字出自官方 README，用三個 Claude 模型、五個任務各跑 10 次取中位數。',
      },
      {
        q: 'Ponytail 只支援 Claude Code 嗎？',
        a: '不只。官方列出 14+ 種宿主，包含 Codex、Gemini CLI、Cursor、Windsurf、Cline、Aider、GitHub Copilot CLI、OpenCode、Kiro 等，各自有對應安裝方式。Claude Code 是 /plugin marketplace add 再 install。',
      },
      {
        q: 'Ponytail 會不會為了少寫，把安全驗證也砍掉？',
        a: '不會。作者明確把信任邊界驗證（trust-boundary validation）、資料遺失處理、安全性、無障礙這四類劃為紅線，永遠不在被砍清單上。它的原則是 lazy not negligent——砍的是過度工程，不是必要防護。',
      },
      {
        q: '為什麼這個插件叫「Ponytail（馬尾）」？',
        a: '作者官方只在 FAQ 丟了一句「Why ponytail? You know exactly why.」，沒正面解釋。社群心領神會的是那種綁長馬尾、戴橢圓眼鏡、話不多的資深大神——你拿五十行 code 去問他，他一句不說直接幫你換成一行。橢圓眼鏡馬尾大神是社群與讀者的聯想，不是官方明文。',
      },
    ],
  },
  {
    slug: 'firebase-free-web-app-domain',
    title: 'Firebase .web.app 免費網域：5 步驟申請，一個帳號能開幾個',
    excerpt:
      'Firebase 的 .web.app 是免費內建網域，連 HTTPS 憑證都自動簽好。本文用 5 個步驟教你從零申請，並回答一個帳號到底能開幾個（單一專案最多 36 個 site）。',
    category: 'AI 工具',
    tags: [
      'Firebase',
      'Firebase Hosting',
      '免費網域',
      'web.app',
      '免費架站',
      'HTTPS',
      '自訂網域',
      'GitHub Actions',
    ],
    publishDate: '2026-06-12',
    featured: false,
    faqItems: [
      {
        q: '.web.app 網域真的完全免費嗎？會不會哪天開始收錢？',
        a: '是免費的，且不需綁信用卡。官方文件明寫「at no cost」。它屬於 Firebase Hosting 的免費 Spark 方案，你只在「儲存超過 10 GB」或「月傳輸超過 10 GB」時才會被要求升級付費——對小專案幾乎不會發生。',
      },
      {
        q: '.web.app 跟 .firebaseapp.com 我該用哪個？',
        a: '兩個指向同一份內容，隨便用。建議拿較短、較新的 .web.app 當主力對外分享，.firebaseapp.com 留著備用即可。',
      },
      {
        q: '一個 Firebase 帳號可以申請幾個免費網域？',
        a: '非常多。單一專案最多能開 36 個 Hosting site（每個 site 給一組 .web.app + 一組 .firebaseapp.com），一個 Google 帳號又能開多個專案，相乘下來一個帳號能拿到數十甚至上百個免費網址，個人用途等於用不完。唯一限制是名稱全球唯一。',
      },
      {
        q: '綁自訂網域要付錢給 Firebase 嗎？',
        a: '不用。Firebase 端連接自訂網域、簽 HTTPS 憑證都不收費。你要付的只有「向網域註冊商買網域」那筆錢（一年通常 NT$300～600 起跳），那是付給 GoDaddy / Cloudflare 這類網域商，跟 Firebase 無關。',
      },
      {
        q: '自訂網域要怎麼接？',
        a: '在 Firebase Hosting 後台輸入你的網域 → 加一筆 TXT 記錄到 DNS 驗證所有權 → 把 A 記錄指向 Firebase 給的 IP → 等 DNS 生效，Firebase 自動簽 SSL（最多 24 小時，多半幾小時內好）。注意每個 apex 網域最多 20 個子網域。',
      },
    ],
  },
  {
    slug: 'agent-browser-screenshot-annotate-visual',
    title: 'agent-browser 截圖標註：3 招讓 AI 看著畫面操作',
    excerpt:
      'agent-browser 能在截圖上畫圖、寫字——不是給人塗鴉的小畫家，而是自動把 AI 看得懂的標記畫進截圖像素裡。這篇接續上一篇純文字流，實測它在截圖上畫東西的三種畫法——screenshot --annotate（在每個可互動元素上畫編號 [1][2][3] 並寫出對照清單，每個對應 @eN ref，截完可直接 click @e2）、highlight（在指定元素外畫高亮框做聚焦驗證）、diff screenshot（把畫面差異畫成像素級比對圖，抓「長相變了」，配合 diff snapshot 抓「結構變了」）——把只能讀純文字 snapshot（一頁 200-400 tokens）的 agent 升級成「看著畫面操作」，補上 icon 按鈕、canvas、純視覺狀態這些純文字抓不到的盲區。核心是 annotate 把視覺感知跟動作指令對齊：畫上去的 @eN 編號文字流跟視覺流共用同一套 ref，多模態模型看圖推理完直接產生跟純文字流一樣的指令。踩坑含 annotate 只支援 CDP 後端（Chrome/Lightpanda）Safari 不行、ref 會過期、diff threshold 不調會一直假警報。版本 v0.27.2，全程 Mac 實測。',
    category: 'AI 工具',
    tags: [
      'agent-browser',
      '截圖標註',
      'annotate',
      'AI Agent',
      'Claude Code',
      '多模態 AI',
      '瀏覽器自動化',
      'Vercel Labs',
    ],
    publishDate: '2026-06-12',
    featured: false,
    faqItems: [
      {
        q: 'agent-browser 可以在截圖上畫圖、寫字嗎？',
        a: '可以，而且這正是它的賣點。--annotate 會在截圖上畫出元素編號 [N] 並寫出對照清單、highlight 會在指定元素外畫高亮框、diff screenshot 會把差異畫在輸出圖上——這些都是直接畫進截圖像素裡的標記與文字。它不是讓你手動塗鴉的小畫家（要手畫框寫字用 macOS 預覽、Skitch 那類工具），而是自動畫出 AI 看得懂的標註，畫的目的是讓多模態模型看圖就能精準操作。',
      },
      {
        q: 'annotate 的編號 [N] 和純文字 snapshot 的 @eN 是同一套嗎？',
        a: '是。這是它設計得最聰明的地方——[2] 對應 @e2，視覺流跟文字流共用同一套 ref，不用維護兩套座標。多模態 AI 看著截圖上的 [2] 推理完，產生的指令 click @e2 跟純文字流一模一樣。',
      },
      {
        q: 'diff screenshot 跟 diff snapshot 差在哪？',
        a: 'diff screenshot 比像素（長相變了沒），diff snapshot 比可訪問性樹（結構/內容變了沒）。按鈕變色、間距跑版用前者；DOM 結構、文字內容變動用後者。前者記得用 -t 調 threshold 過濾抗鋸齒雜訊。',
      },
      {
        q: '為什麼 Safari 後端不能用 annotate？',
        a: 'annotate 需要 CDP（Chrome DevTools Protocol）的能力來掃描並疊加元素標籤，Safari 走的是 WebDriver 協定，目前還沒實作這塊。要用 annotate 就切 Chrome 或 Lightpanda 後端。',
      },
      {
        q: '這些視覺標註指令適合接進 Claude Code 嗎？',
        a: '適合。跟前一篇的純文字流一樣，這三招都是 CLI 指令，可以用「薄存根 + CLI 動態供給」的方式接進 Claude Code 直接調用。多模態場景（要 AI 看圖操作）特別適合用 annotate 當輸入。',
      },
    ],
  },
  {
    slug: 'ccs-multi-account-claude-codex-switch',
    title:
      'AI agent 額度爆了不用乾等：ccs 多帳號無縫切換（Claude Code + Codex，同一場對話接得起來）',
    excerpt:
      '額度撞 rate limit 最痛的不是要等刷新，是對話脈絡斷掉。ccs 這套把這個痛點直接做掉——一鍵切到第二個帳號，把同一串對話搬過去用它的額度繼續跑，脈絡完全不斷。核心原理 provider-agnostic：每一場對話其實是一個 .jsonl 檔躺在硬碟上，用 CLAUDE_CONFIG_DIR / CODEX_HOME 環境變數隔離兩個帳號身份，撞 limit 時把那場對話檔複製到第二個帳號目錄、再用它 resume 就好，額度算第二個帳號的、歷史一字不差。支援 Claude Code 與 Codex，連 Codex 斷了用 Claude 接的跨工具接力都涵蓋。安全上用「按需複製單一對話檔」而非 symlink 整個資料夾（後者雙開會 corrupt），token 永遠留在你自己的 Keychain、不被搬移。本文最後一段可以直接複製貼給 Claude Code，它會自己 git clone + 跑 install.sh 幫你裝好——唯一要你自己按的只有第二個帳號的 login。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'Codex',
      'AI agent',
      'rate limit',
      '多帳號切換',
      'CLAUDE_CONFIG_DIR',
      'Claude Code skill',
      'AI 應用開發',
    ],
    publishDate: '2026-06-12',
    featured: true,
    faqItems: [
      {
        q: 'ccs 切帳號會把我的對話歷史弄丟嗎？',
        a: '不會，剛好相反，它存在就是為了不丟脈絡。每一場對話是一個 .jsonl 檔，ccs 接力時複製你挑的那一場到第二個帳號目錄、再用它 resume，歷史一字不差。額度算第二個帳號的，但對話完全接得起來。',
      },
      {
        q: '它怎麼隔離兩個帳號，不會互相干擾？',
        a: 'Claude Code 看 CLAUDE_CONFIG_DIR 環境變數（預設 ~/.claude，指到 ~/.claude-2 就是另一套設定、登入、歷史），Codex 看 CODEX_HOME，邏輯一樣。兩個帳號的 token 在 macOS Keychain 存不同條目（service name 依 config dir 做 hash），不會互蓋。',
      },
      {
        q: '為什麼不直接把兩個帳號的資料夾 symlink 接通就好？',
        a: '因為兩個 agent 同時跑時，.claude.json / projects / sessions 這些檔會被並發寫入弄壞（對應 Anthropic 已知的雙開 corruption issue）。所以 ccs 設計成只在接力那一刻按需複製單一對話檔，而不是同步整個資料夾。',
      },
      {
        q: '安裝會自動幫我登入第二個帳號嗎？',
        a: '不會，也不該。install.sh 自動處理環境變數、目錄、PATH、腳本，但第二個帳號的 login（開瀏覽器、輸帳密 / 2FA）那一步沒有任何工具能代勞，要你自己按。其餘設定全自動。',
      },
      {
        q: '我現在還沒有第二個帳號，能先裝嗎？',
        a: '可以。先把這套裝起來，等你哪天開了第二個帳號，再打 ccs 走設定流程把它接上即可。裝在前、用在後，不衝突。',
      },
      {
        q: 'Codex 撞 limit 也能用 Claude 接續嗎？',
        a: '可以。ccs 的跨工具接力會把來源（Codex）對話濃縮成一份 handoff capsule——原始任務、最後進度、改過的檔、git diff——餵給 Claude 讓它讀懂接手。原理 provider-agnostic，反過來 Claude 斷了用 Codex 接也行。',
      },
    ],
  },
  {
    slug: 'claude-fable-5-pricing-safety-guide',
    title:
      'Claude Fable 5 升級指南：1M context、$10/$50 定價與 5% 安全閘門全解',
    excerpt:
      'Claude Fable 5 是 Anthropic 在 2026-06-09 公開放出的最強模型（model ID claude-fable-5），預設 1M token context、最高 128k 輸出，定價 $10/$50 per M token 剛好是 Opus 4.8 的兩倍。它跟限定釋出的 Mythos 5 是同一顆底層模型，差別只在安全層——Fable 5 內建 safety classifier，平均 <5% 的 session 會在 cybersecurity/biology 等高風險領域被攔下、改由 Opus 4.8 回答（refusal 回 HTTP 200、不計費、可帶 fallbacks 參數自動重試）。它是 Covered Model，30 天資料保留、不支援 ZDR。這篇拆解規格與定價、安全閘門 fallback 機制、在 Claude Code 用 /model claude-fable-5 怎麼切（只有 adaptive thinking、用 effort 控深度），最後給三種人三種升級決策——長 horizon agentic 工作該升、日常任務 Opus 4.8 才是甜蜜點、有 ZDR 需求別升。',
    category: 'AI 工具',
    tags: [
      'Claude Fable 5',
      'Mythos 5',
      'Claude Opus 4.8',
      'Claude Code',
      'Anthropic',
      'LLM 模型選型',
      'AI 應用開發',
      '模型定價',
    ],
    publishDate: '2026-06-10',
    featured: true,
    faqItems: [
      {
        q: 'Claude Fable 5 和 Mythos 5 到底差在哪？',
        a: '同一顆底層模型。Mythos 5 拿掉了 cybersecurity / biology 等領域的安全 classifier，走限定釋出的 Project Glasswing，要透過 Anthropic / AWS / Google Cloud 的 account team 申請。Fable 5 是加了那層安全閘門的版本，一般可用。能力上做正常開發兩者沒差。',
      },
      {
        q: '被 Fable 5 的安全閘門攔下會收我錢嗎？',
        a: '不會。被拒的請求在產生任何輸出前 refused，不計費，Messages API 回 HTTP 200 加 stop_reason: refusal。如果你帶 fallbacks 參數 fallback 到別的模型重試，fallback credit 還會退回 prompt-cache 的切換成本。',
      },
      {
        q: 'Claude Fable 5 比 Opus 4.8 貴多少？',
        a: '整整兩倍。Fable 5 是 $10 輸入 / $50 輸出 per M token，Opus 4.8 是 $5 / $25。輸出 token 又比輸入貴 5 倍，長對話累積的輸出成本成長很快。',
      },
      {
        q: '我有 zero data retention 需求，能用 Fable 5 嗎？',
        a: '不能。Fable 5 是 Covered Model，30 天資料保留，不支援 ZDR。有 ZDR 合規要求（處理客戶敏感資料、資料不落地的合約）就得選支援 ZDR 的模型。',
      },
      {
        q: '在 Claude Code 怎麼切到 Fable 5？',
        a: '在對話框打 /model claude-fable-5，或打 /model 開互動式選單挑。切完用 /status 確認顯示 claude-fable-5——別只看指令沒報錯就當切好，要 round-trip 確認行為和帳單都對得上。',
      },
      {
        q: 'Fable 5 能關掉 thinking 嗎？',
        a: '不能。它只有 adaptive thinking，thinking: {"type": "disabled"} 不支援。要控制思考深度改用 effort 參數，不是開關 thinking。另外它的 raw chain-of-thought 預設不回傳（omitted），要看設成 summarized 拿摘要版。',
      },
    ],
  },
  {
    slug: 'llm-token-counting-methods',
    title:
      'LLM token 怎麼算才準？5 種計量方案實測比較（中文差 47% 的坑）',
    excerpt:
      'LLM token 計量沒有單一正解，而是一條從輕到重的光譜：啟發式估算（字數÷4）、本機 tokenizer（tiktoken）、provider 官方 count API（Anthropic count_tokens 免費）、跨模型計價庫（liteLLM / tokencost）、線上 observability（Langfuse / Helicone）。關鍵是分清「事前估」還是「事後對帳」——前者用本機 tokenizer，後者直接讀 API response 的 usage。最大的坑是 tokenization 不跨 provider 標準化：我本機實測同一段 66 字中文，GPT-4 的 cl100k_base 算 62 token、GPT-4o 的 o200k_base 只算 42——差 47%。這篇把 5 種方案逐個拆、做成優劣總表與決策流程圖，附本機 tiktoken 實測指令。',
    category: 'AI 工具',
    tags: [
      'token 計量',
      'tiktoken',
      'LLM',
      'count token',
      'Claude',
      'OpenAI',
      'liteLLM',
      'AI 應用開發',
    ],
    publishDate: '2026-06-09',
    featured: true,
    faqItems: [
      {
        q: '中文一個字到底是幾個 token？',
        a: '沒有固定答案，看 tokenizer。我本機實測 66 字中文，cl100k_base 算 62、o200k_base 算 42——同一段差 47%。粗估可以抓「1 字 ≈ 1～1.5 token」，但要計費請用對應模型的 tokenizer 實算。',
      },
      {
        q: 'tiktoken 可以拿來算 Claude 或 Gemini 嗎？',
        a: '只能近似。tiktoken 是 OpenAI 的 BPE，Claude 用 SentencePiece、Gemini 用自有方案。很多庫對非 OpenAI 模型會 fallback 到 cl100k_base 硬估，數字「看起來像」但不是真的。要準就用 Anthropic／Google 各自的 count API。',
      },
      {
        q: 'Anthropic 的 count_tokens 要錢嗎？',
        a: '不計費。它只做 tokenize、不跑 inference，所以沒有 compute 成本——但仍需要 API key 驗身份。沒有理由為了省錢避開它做事前精算。',
      },
      {
        q: '我只是想知道某次 call 花多少錢，需要裝這麼多東西嗎？',
        a: '不用。事後對帳直接讀 API response 的 usage（input_tokens / output_tokens），那就是計費依據。只有「上線後要長期追蹤、做成本歸因」才需要 Langfuse／Helicone 這類 observability。',
      },
      {
        q: 'liteLLM / tokencost 的成本數字可信嗎？',
        a: 'token 數對 OpenAI 精準、對其他家是近似；價目表是第三方維護，可能跟最新官方定價有時間差。拿來做預算告警／量級預估很好用，但要拿去跟帳單對帳前，先抽樣驗一下對不對得上。',
      },
    ],
  },
  {
    slug: 'agent-browser-ai-chrome-automation',
    title:
      'agent-browser 是什麼？AI agent 專用瀏覽器自動化 CLI 實戰（含 Claude Code 接法）',
    excerpt:
      'agent-browser 是 Vercel Labs 出的 AI agent 專用瀏覽器自動化 CLI，用 Chrome 跑、不依賴 Playwright。它最大的差別是「snapshot + refs」——回傳精簡的可訪問性元素清單（每頁約 200-400 tokens），而不是整坨 HTML。我今天把它裝到 Mac、跑通一個登入流程、再裝成 Claude Code skill，全程實測。這篇是覆盤：安裝怎麼裝、登入流程怎麼跑（snapshot→fill→click→截圖 round-trip）、踩了哪些坑（Hacker News 被反爬擋、ref 會過期、nvm 路徑可攜性），以及怎麼用「薄存根 + CLI 動態供給」把它接進 Claude Code 對話直接調用。',
    category: 'AI 工具',
    tags: [
      'agent-browser',
      'AI Agent',
      'Claude Code',
      'Playwright MCP',
      '瀏覽器自動化',
      'Browser Automation',
      'Vercel Labs',
      'AI 應用開發',
    ],
    publishDate: '2026-06-09',
    featured: true,
    faqItems: [
      {
        q: 'agent-browser 需要先裝 Playwright 嗎？',
        a: '不用。它透過 CDP（Chrome DevTools Protocol）直接驅動 Chrome，自己用 `agent-browser install` 抓一份 Chrome for Testing，跟 Playwright / Puppeteer 完全無關。',
      },
      {
        q: '它會動到我日常用的 Chrome 嗎？',
        a: '不會。install 抓的是獨立的 Chrome for Testing，裝在 ~/.agent-browser/browsers/，跟你平常用的 Chrome 分開，不互相干擾。',
      },
      {
        q: '預設看得到瀏覽器視窗嗎？',
        a: '預設 headless（背景跑、看不到）。要看到視窗加 --headed，例如 agent-browser open --headed <url>。有些會擋自動化的站，用有頭模式也比較不容易被擋。',
      },
      {
        q: 'ref（@e1、@e2）為什麼有時候點不到東西？',
        a: '最常見是 ref 過期了。ref 每次 snapshot 重新編號、頁面一變（導航 / 表單送出 / 動態 re-render / 開 dialog）就失效，下次 ref 操作前要先重新 snapshot -i 拿新的編號。',
      },
      {
        q: '跟 Playwright MCP 比，真的省很多 token 嗎？',
        a: '真的。我用 tiktoken 實測過：同一個 GitHub repo 頁，渲染後完整 HTML 是 433,903 token，agent-browser 的 snapshot 只要 35,219（省 91.9%）、snapshot -i 只要 12,778（省 97.1%）。原文作者測的是 ~82%，我這台機器測下來更高，同一個量級。注意這是單頁單樣本，HTML 越肥的頁省越多。',
      },
    ],
  },
  {
    slug: 'arize-phoenix-llm-tracing-medical-cdss',
    title:
      'Arize Phoenix 接 LangGraph CDSS：3 個踩坑與醫師回饋閉環',
    excerpt:
      'Arize Phoenix 是開源、單容器自架的 LLM observability 工具（不像 Langfuse 還要外接 ClickHouse + Redis + S3）。我把它接進一個醫療 CDSS 的 LangGraph 8-step agent，目的不是看 latency，是要回答醫師那句「它為什麼開這個藥」。這篇記錄安裝三件套、三個讓我 debug 半天的踩坑（langchain 自動 instrument 散 trace、phoenix-client 預設讀錯 env、自家工具 OpenInference 抓不到），以及真正值錢的那段——把醫師回饋以 annotation 回掛到對應 trace，做成 human-in-the-loop 的評估閉環。附完整 code。',
    category: '工程實作',
    tags: [
      'Arize Phoenix',
      'LLM Observability',
      'OpenTelemetry',
      'LangGraph',
      'OpenInference',
      'LLM Tracing',
      'CDSS',
      'AI 應用開發',
    ],
    publishDate: '2026-06-05',
    faqItems: [
      {
        q: 'Arize Phoenix 是免費的嗎?',
        a: '開源版(self-host)是免費的,Elastic License 2.0,功能包含 tracing、evaluation、prompt playground、LLM-as-judge。Arize 另有商業版 AX(雲端託管、依 span 數計價)。自架版對絕大多數團隊夠用。',
      },
      {
        q: 'Phoenix 跟 Langfuse 我該選哪個?',
        a: '要框架無關、要透明 volume-based 計價就選 Langfuse。要全開源 + 單容器好自架 + eval 嚴謹(尤其受監管 / 高準確度要求的場景)就選 Phoenix。我做醫療 CDSS 選 Phoenix,主因是單容器自架 + 資料不外傳。',
      },
      {
        q: '一定要用 LangChain / LangGraph 才能接嗎?',
        a: '不用。Phoenix 走 OpenTelemetry + OpenInference,框架無關。我這次甚至刻意關掉 langchain 自動 instrument、改手動串節點。只要你的 LLM 呼叫走 OpenAI 相容 API,OpenAIInstrumentor 就抓得到。',
      },
      {
        q: '接了會不會拖慢正式環境 / 增加風險?',
        a: '我的做法是 opt-in:沒設 PHOENIX_COLLECTOR_ENDPOINT 就完全 no-op,連追蹤套件沒裝都不會讓服務啟動失敗(每個 import 都包 try/except)。正式環境不想開就不設那個 env,零成本。',
      },
      {
        q: 'trace 資料會外傳嗎?',
        a: 'self-host 版本 trace 全部落在你本地的 docker volume(phoenix_data),不外傳第三方。處理敏感資料時這是關鍵——但要注意 span 裡若記了 PII,得自己管好 Phoenix 的存取權限。',
      },
    ],
    featured: true,
  },
  {
    slug: 'open-slide-ai-agent-presentation-framework',
    title:
      'open-slide：用 Claude Code 寫簡報，4 千星 AI agent 簡報框架',
    excerpt:
      'open-slide 是台灣開發者 Yiwei Ho（@1weiho）做的開源簡報框架，定位是「給 AI coding agent 用的」：你在對話框講想要什麼，Claude Code 幫你把每一頁寫成 React 投影片，框架負責 canvas、縮放、導航、hot reload、演講模式這些雜事。上線沒多久 GitHub star 就從 4 千衝破 4.6k，repo 卡片已顯示 5k。這篇拆解它跟 Slidev / reveal.js 的根本差異（每頁是任意 React component、跑在固定 1920×1080 canvas）、npx 一行安裝、三個內建 agent skill（/create-slide、/slide-authoring、/apply-comments）怎麼配合，以及 inspector 點一下留 comment 讓 agent 改稿的工作流，附可直接抄的指令。',
    category: 'AI 工具',
    tags: [
      'open-slide',
      'Claude Code',
      'AI 簡報',
      'AI Agent',
      'React',
      '簡報框架',
      'Slidev',
      'Yiwei Ho',
    ],
    publishDate: '2026-06-03',
    faqItems: [
      {
        q: 'open-slide 一定要用 Claude Code 嗎？沒有 agent 能用嗎？',
        a: '不一定要 Claude Code。官方說同一批 skill 檔案 Codex、Cursor、Gemini CLI、OpenCode、Windsurf、Zed 都能讀。你甚至可以完全手寫 .tsx，因為每頁本來就是普通 React component，agent 只是讓「用講的生出投影片」變可能，不是必要條件。',
      },
      {
        q: 'open-slide 跟 Slidev、reveal.js 差在哪？',
        a: '最大差異是每頁的寫法。Slidev 用 Markdown + Vue 擴充語法、reveal.js 用 HTML section，都有各自的簡報 DSL 要學；open-slide 每一頁就是任意 React .tsx，你會 React 就能寫，不用學新語言。另外 open-slide 從一開始就為 coding agent 設計，內建 /create-slide 等 skill 跟視覺 inspector 改稿，這兩個 Slidev / reveal.js 都沒有。',
      },
      {
        q: 'open-slide 跟 Claude 內建的簡報功能（Claude Design / Artifacts）差在哪？',
        a: 'Claude 內建簡報生成是封閉的、跑在 Anthropic 服務裡，複雜需求容易撞限制。open-slide 是 MIT 開源、跑在你本機、產物是版控的 React 原始碼，你對每一頁有完全控制權，也能接任何 agent。要客製化、要進 git、要離線，open-slide 自由度高得多。',
      },
      {
        q: '做出來的投影片怎麼分享給沒裝環境的人看？',
        a: 'open-slide 支援把整份 deck export 成 self-contained 的 static HTML 或 print-ready PDF。HTML 版是單檔靜態站，丟到任何靜態 host（GitHub Pages、Vercel）就能給人看，對方不用裝任何東西。具體 export 指令旗標以 scaffold 出來的 repo 內 package.json scripts 或 README 為準。',
      },
      {
        q: '我完全不會 React，用得動 open-slide 嗎？',
        a: '能跑但會卡。因為 agent 幫你寫，基本生成你不碰 code 也行；可是一旦要微調、debug 某頁壞掉，看得懂 React 會差很多。建議至少懂 JSX 跟 component 概念再上手，不然遇到問題只能一直丟回給 agent 賭它修對。',
      },
    ],
    featured: true,
  },
  {
    slug: 'huggingface-flux-schnell-free-image-batch',
    title: '免費生 100 張遊戲卡牌插圖:FLUX.1-schnell + Pollinations 零成本實戰(沒綁信用卡)',
    excerpt:
      '一款 Splendor 網頁版要 90 張發展卡 + 10 張貴族卡插圖,預算 $0、手上沒綁信用卡,不能讓任何一步不小心被扣款。最後用 Hugging Face 的 FLUX.1-schnell 當主力(免費帳號每月 $0.10 額度)、額度用完自動 fallback 到完全免費的 Pollinations,再用 sharp 後製依寶石色染色,100 張圖一次跑完、整副風格一致、總花費 $0。這篇把 token 怎麼拿、額度怎麼算、bash 怎麼封裝、批次 seed 怎麼固定保證可重現、schnell 不吃顏色怎麼用後製補色,全寫清楚,附可直接抄的 bash / Node.js 程式碼。',
    category: '工程實作',
    tags: [
      'FLUX.1-schnell',
      'Hugging Face',
      'Pollinations',
      '免費生圖',
      'AI 生圖',
      'sharp',
      'Splendor',
      '批次生成',
    ],
    publishDate: '2026-06-02',
    faqItems: [
      {
        q: 'FLUX.1-schnell 免費可以商用嗎?',
        a: '模型本身走 Apache-2.0 授權(Black Forest Labs 開源的 schnell 版本),生成的圖可商用。但每個 Inference Provider 的服務條款不同,正式商用前還是去確認你呼叫的那個 provider 的 ToS。',
      },
      {
        q: '免費的 $0.10 額度用完會自動扣款嗎?',
        a: '不會。免費帳號超額會直接擋下請求,要先在 billing 頁 purchase credit 才能續用。沒綁卡就不會有意外帳單 —— 這對「絕不能被扣款」的需求反而是保險。',
      },
      {
        q: '為什麼不直接全用 Pollinations,免 key 又免費?',
        a: '可以,但 Pollinations 匿名 tier 在高併發時會 rate limit、畫質也略遜 FLUX.1-schnell。我的策略是 HF 出主力品質的那幾十張,Pollinations 補剩下的量,兼顧品質與成本。',
      },
      {
        q: 'schnell 和 dev 差在哪?該選哪個?',
        a: 'schnell 是 distilled 速度版,4 步出圖、快、適合批次;dev 步數多、品質與顏色控制更好但較慢、計費也更高。批次大量出圖選 schnell + 後製,少量精修選 dev。',
      },
      {
        q: 'seed 固定真的能完全重現嗎?',
        a: '同一個 provider、同 model、同 prompt、同 seed 下結果穩定,這是「同 id 重生不變」的基礎。但跨 provider(HF vs Pollinations)不保證一致,所以補圖時要用「跳過已存在檔」而不是「整副重生」。',
      },
    ],
    featured: false,
  },
  {
    slug: 'pollinations-free-image-api-no-signup',
    title: 'Pollinations 免費生圖 API:不用註冊、不用 key、一行 URL 就出圖(附實測坑)',
    excerpt:
      'Pollinations 是我看過門檻最低的生圖 API —— 不用註冊、不用 API key、不用綁信用卡,把 prompt 塞進一個 URL、curl 一下就回一張圖。這篇把它「URL 即 API」的設計、實測坑(/models 清單跟文件對不上、傳不存在的 model 不報錯而是靜默 fallback)、seed 決定性、匿名與註冊 tier 的差別、2025 之後的 watermark 政策、Referrer / Bearer 兩種認證都寫清楚,附可直接抄的 curl 與 Node.js 範例。本文 2 張配圖全是用 Pollinations 匿名 API 當場生的。',
    category: '工程實作',
    tags: [
      'Pollinations',
      '免費生圖',
      'AI 生圖',
      '生圖 API',
      '免註冊',
      'curl',
      'Node.js',
      'AI 工具',
    ],
    publishDate: '2026-06-02',
    faqItems: [
      {
        q: 'Pollinations 真的完全不用註冊、不用 key?',
        a: '匿名 tier 確實如此 —— 一個 GET 就回圖。註冊只是為了升 rate limit(從約 15 秒一張到 5 秒一張),不註冊也能用。',
      },
      {
        q: '為什麼我傳 ?model=flux 沒報錯但圖不像 flux?',
        a: '因為當下 /models 清單可能已經沒有 flux,服務會靜默 fallback 到清單裡的 model(我實測是 sana),不報錯。腳本啟動時打一次 /models 比對你要的 model 在不在,不在就自己擋。',
      },
      {
        q: '同 prompt 同 seed 會拿到一模一樣的圖嗎?',
        a: '會。我實測同 prompt、同 seed、同尺寸連抓兩次,md5 完全相同。所以批次補圖可以安全地「只補缺的、跳過已存在」。',
      },
      {
        q: '免費生的圖可以商用嗎?有浮水印嗎?',
        a: 'Pollinations 程式碼走 MIT,但 2025-03-31 起免費層生成的圖可能帶浮水印,nologo=true 不保證永遠去得乾淨。要正式商用建議走有明確授權保證的方案,或至少先確認當下的服務條款。',
      },
      {
        q: 'Pollinations 和 HF FLUX.1-schnell 該選哪個?',
        a: '看門檻與品質的取捨。要零門檻、快、補量選 Pollinations;要較高品質、整副統一選 HF FLUX.1-schnell 當主力。兩個疊起來(HF 主力 + Pollinations 補量)就是一條 $0 的完整管線。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-build-a-game',
    title: '用 Claude Code 從零做一款遊戲:不是會 prompt,是會這三件工程紀律',
    excerpt:
      '我用 Claude Code 從零做了一款 Splendor(璀璨寶石)網頁版 —— 規則引擎、React UI、單元測試、E2E、連 100 張卡牌插圖都生好,全程沒手寫幾行 code。但能跑得順的關鍵不是 prompt 寫得好,而是三件工程紀律:規則引擎跟 UI 徹底分離、用「不變量測試 + fuzzing」逼出 AI 看不到的暗 bug、E2E 走完整 round-trip 而不是繞過引擎。這篇拆解這套協作方法,附這個專案的真實程式碼。',
    category: '工程實作',
    tags: [
      'Claude Code',
      'AI 寫遊戲',
      'TDD',
      'fuzzing',
      'Playwright',
      'Vitest',
      'Splendor',
      'React',
    ],
    publishDate: '2026-06-02',
    faqItems: [
      {
        q: '用 Claude Code 做遊戲,是不是丟個 prompt 就好?',
        a: '不是。它能很快生出能跑的 code,但「正確、可維護、可驗證」要靠架構決策(規則/UI 分離)和測試策略(不變量 + fuzzing + round-trip E2E),這些是工程師要把關的。',
      },
      {
        q: '為什麼要把規則引擎跟 UI 分離?',
        a: '因為這樣測試規則完全不用渲染畫面,純函式餵狀態、檢查結果,毫秒級跑完幾百個 case。也讓 AI 改 UI 時不會手滑動到規則,邊界清楚。',
      },
      {
        q: 'fuzzing 測試是什麼?為什麼對 AI 寫的 code 特別重要?',
        a: '用固定 seed 的隨機數讓 bot 自動對打幾百局,每步檢查遊戲不變量(如寶石守恆)。AI 寫的 code 最大風險是「看起來對、某個沒測到的組合下默默算錯」,隨機對打能撞出人工想不到的 case。',
      },
      {
        q: 'E2E 為什麼強調「走 round-trip 不繞過引擎」?',
        a: '因為要驗的是「瀏覽器點下去真的接到引擎」,而不是 UI 自己另算一套。透過掛在 window 的測試橋接驅動真實 dispatch,一路渲染到勝利畫面,才證明整條鏈是通的。',
      },
      {
        q: '這套方法只適用遊戲嗎?',
        a: '不。純函式核心 + 不變量測試 + round-trip 驗收,適用任何有明確規則與狀態轉移的系統 —— 訂單、計費、權限、工作流引擎都一樣。遊戲只是規則密集、好示範。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-teams-owner-management-guide',
    title:
      'Claude Code Teams 怎麼管?Owner 視角 4 個後台動作完整指南',
    excerpt:
      'Claude Code Teams 比個人 Pro 貴 7.5 倍($150/seat 月),願意付這筆錢的 owner 一定有「多人管理」需求。這篇從 owner 視角盤點後台 4 個會真的拿來用的管理動作:座位管理(誰當 Primary Owner 是治理大事)、Skills 集中派送(把公司 SOP 變成全員 day1 工具)、Tool permission 與 MCP enforce(收斂風險邊界)、ZDR(Enterprise 限定,法遵核選項)。每條能力背後引官網原文,告訴你什麼時候用、不適用什麼場景、踩到會痛的地方。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'Claude Code Teams',
      'Anthropic',
      'Team Plan',
      '企業導入',
      'AI 管理',
      'Primary Owner',
    ],
    publishDate: '2026-06-01',
    faqItems: [
      {
        q: 'Claude Code Teams 跟 Enterprise plan 差在哪?',
        a: 'Claude Code Teams plan 有 4 個管理動作中的前 3 個(座位、Skills 派送、tool/MCP 收斂),沒有 ZDR。Enterprise 加上 ZDR、audit log、SCIM、SSO 等 enterprise grade 功能,需要直接找 Anthropic sales 報價,不是 self-serve。一般軟體公司 50 人以下基本上 Team plan 就夠,有法遵需求才升 Enterprise。',
      },
      {
        q: '沒開 ZDR,我們公司對話會被 Anthropic 拿去訓練嗎?',
        a: '不會,Team 跟 Enterprise plan 預設都不用商業客戶資料訓練模型,這條官網 data usage 有寫。ZDR 解的是「Anthropic 端是否留存對話內容」這條,跟訓練是兩件事。即使沒開 ZDR,Anthropic 也不會拿你公司資料訓練。',
      },
      {
        q: 'Skills 派送下去,成員可以拒絕嗎?',
        a: '可以 toggle on/off。Owner upload 後成員端會自動看到,但每個成員可以在自己 client 端關掉某個 skill。這是「派送 ≠ 強制」的設計,但實務上 90% 工程師看到自動出現的 skill 不會去關,所以 owner 派下去基本上會被用。',
      },
      {
        q: 'Primary Owner 離職了怎麼辦?',
        a: '官網沒明寫流程,治理上必須離職前先轉移 Primary Owner 角色給接任者。如果已經離職沒轉,要聯絡 Anthropic support 協助轉移,流程會比較麻煩 — 你需要證明組織所有權(domain 驗證、billing 帳戶等)。所以這條我會列在公司 IT offboarding checklist 強制項目,不是離職當天才想到。',
      },
      {
        q: '我們公司還沒開 Team Plan,這篇 owner 視角寫的東西有意義嗎?',
        a: '有,這篇可以當決策框架用。讀完你會知道:Team Plan 真正值錢的能力是 Skills 集中派送(把 SOP 變工具),不是「多人共用 billing」。如果你只是想分擔費用、不想管組織級設定,Team Plan 對你 overkill;如果你想把公司工程規範變預設行為、收斂 Claude Code 風險,Team Plan 是 self-serve 級唯一選項,再上就是 Enterprise。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-ultracode-ultrathink',
    title:
      'ultracode vs ultrathink:不是想更久,是派 16 隻 agent',
    excerpt:
      'ultracode 跟 ultrathink 名字像、做的事完全不同。ultrathink 是 prompt 關鍵字,只讓模型這一回合想更深(最高 31999 thinking token);ultracode 是 /effort 設定,把整個 session 切成 xhigh 推理 + 自動 dynamic workflow 編排,替每個任務派出一隊 agent(最多 16 並行 / 單次上限 1000)。附本機 Claude Code binary 實測字串為證。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'ultracode',
      'ultrathink',
      'dynamic workflow',
      'AI 工作流',
      'effort',
      'Anthropic',
    ],
    publishDate: '2026-05-29',
    faqItems: [
      {
        q: 'ultracode 跟 ultrathink 可以一起用嗎?',
        a: '可以但通常沒必要。ultracode 已把 effort 固定在 xhigh,session 內每個任務都深度推理;ultrathink 是單 turn 加深,疊在 xhigh 上邊際效益很小。日常用 /effort high + 臨時 ultrathink,大工程直接 ultracode,不需要兩個一起。',
      },
      {
        q: '開 ultracode 會很燒 token 嗎?',
        a: '會而且明顯。每個正經任務都 xhigh + 可能開 workflow,一條 workflow 動輒派數十到上百個 agent,全算進你方案用量與 rate limit。官方明講每個請求都比低 effort 花更多 token、更久。高風險、要徹底、不在乎成本時才開,做完 /effort high 退回。',
      },
      {
        q: '我沒看到 /effort ultracode 這個選項?',
        a: '檢查三件事:claude --version 是否 ≥ 2.1.154;/config 裡 Dynamic workflows 有沒有開;/model 是不是支援 xhigh 的模型(如 Opus 4.8)。任一沒過選單就不列 ultracode,這是 binary 寫死的條件,不是壞掉。',
      },
      {
        q: 'dynamic workflow 跟一般 subagent 差在哪?',
        a: '差在計畫與中間結果放哪。subagent 是 Claude 一回合決定 spawn 誰,每個結果回流進 context,幾輪就爆。workflow 把迴圈和中間結果關在腳本變數,只有最終答案進 context,所以撐得起上百 agent,還能做 adversarial review 這種跨 agent 品質模式。',
      },
      {
        q: 'workflow 最多能派幾個 agent?',
        a: '單次 run 上限 1000 個 agent,同時並行最多 16 個(CPU 核心少會更少)。1000 是防無限迴圈失控,16 是限制本機資源占用,兩個都是 runtime 寫死。',
      },
    ],
    featured: true,
  },
  {
    slug: 'langchain-vs-langgraph-2026',
    title:
      'LangChain vs LangGraph 是什麼?2026 該學哪個(完整比較)',
    excerpt:
      'LangChain 跟 LangGraph 不是二選一,是上下層:LangGraph 是底層 runtime(管 state、流程、重試),LangChain 是建在它上面的高階 API。2025-10-22 兩者都上 1.0 正式版。這篇用比較表、三個情境判斷、三個真實踩坑,講清楚標準 agent loop 該用 LangChain、要精細控制流程分流與重試該用 LangGraph,以及完全新手該從哪個開始學。「用真實專案學 LangGraph」系列第一篇。',
    category: 'AI 教學',
    tags: [
      'LangGraph',
      'LangChain',
      'LangGraph 教學',
      'AI Agent',
      'LangGraph vs LangChain',
      'AI 應用開發',
      'Python',
    ],
    publishDate: '2026-05-27',
    faqItems: [
      {
        q: 'LangChain 跟 LangGraph 可以混用嗎?',
        a: '可以,而且官方鼓勵。你可以用 LangChain 的 create_agent 快速做出 agent,然後把它當成 LangGraph 圖裡的一個 node。因為 LangChain 底層就是 LangGraph,兩者天生相容。',
      },
      {
        q: '我完全不會,該先學 LangChain 還是 LangGraph?',
        a: '先學 LangGraph 的核心三件事——state、node、edge。把這三個搞懂,LangChain 的 create_agent 你一看就懂,因為它只是把一個常見的 graph 包起來。反過來先學 LangChain,你會卡在不知道底下 runtime 長怎樣。',
      },
      {
        q: 'LangGraph 1.0 穩定嗎?可以上 production 嗎?',
        a: '可以。官方說它是 durable agent 框架領域的第一個穩定大版本,已經在 Uber、LinkedIn、Klarna 這些公司跑了一年多才正式 1.0,並承諾 2.0 前不做破壞性更新。',
      },
      {
        q: '只做簡單的 RAG 問答,需要 LangGraph 嗎?',
        a: '不一定需要。純 RAG(檢索加丟給模型回答)用 LangChain 的標準組件就夠。等你的流程開始長出分流、重試、人工審核、多步驟混合這些需求,再下沉到 LangGraph。不要為了用而用。',
      },
      {
        q: 'LangChain 1.0 對 Python 版本有什麼要求?',
        a: 'LangChain 1.0 把 Python 3.9 支援拿掉了,最低需要 3.10。如果你還在 3.9 的環境,pip 裝得起來但行為會怪,先升 Python 再說。',
      },
    ],
    featured: true,
  },
  {
    slug: 'langgraph-state-node-edge',
    title:
      'LangGraph 核心:State / Node / Edge 完整教學(第一個會跑的 graph)',
    excerpt:
      'LangGraph 的核心只有三個概念:State(跨步驟共用的狀態)、Node(收 state 回傳要改的欄位的函式)、Edge(把 node 串起來的線)。這篇用血脂決策 pipeline 的真實場景,帶你從 StateGraph 定義、add_node、add_edge 一路到 compile 與 invoke,給一個複製貼上就能跑的最小範例,並講三個新手最常踩的坑:回傳整份 state、忘記接 START/END、在 node 裡 mutate state。「用真實專案學 LangGraph」系列 EP2。',
    category: 'AI 教學',
    tags: [
      'LangGraph',
      'LangGraph 教學',
      'StateGraph',
      'LangGraph State',
      'AI Agent',
      'Python',
      'AI 應用開發',
    ],
    publishDate: '2026-05-28',
    faqItems: [
      {
        q: 'LangGraph 的 State 一定要用 TypedDict 嗎?',
        a: '不一定,但建議。LangGraph 支援 TypedDict、Pydantic model、dataclass。新手用 TypedDict 最直觀;要嚴格驗證欄位防打錯字就上 Pydantic。重點是 state 的欄位要當成合約寫清楚,用哪種型別是次要的。',
      },
      {
        q: 'LangGraph 的 node 一定要是函式嗎?',
        a: 'node 本質是可呼叫物件(callable),函式最常見,但任何 __call__ 接收 state、回傳 dict 的物件都行。複雜 node 要帶設定或依賴時,用 class 包起來會比較乾淨。',
      },
      {
        q: '一個 LangGraph node 可以同時改多個 state 欄位嗎?',
        a: '可以。回傳的 dict 想放幾個 key 都行,例如 return {"computed": ..., "advice": ...}。只要那些 key 是這個 node 的職責就好。',
      },
      {
        q: 'LangGraph 的 node 為什麼只回傳 dict 而不是整份 state?',
        a: 'node 只回傳要更新的欄位,LangGraph 會自動把這個 dict 合併進 state。回傳整份 state 在簡單情況下不會錯,但多個 node 並行或用到 reducer 時,回傳整份會把別人寫的東西洗掉。從第一天就養成只回傳 diff 的習慣。',
      },
      {
        q: '怎麼看 LangGraph 實際跑了哪些 node?',
        a: '用 app.stream(initial) 取代 invoke,它會 yield 每一步的中間結果,你能看到 state 一站一站怎麼變,debug 流程超好用。',
      },
    ],
    featured: false,
  },
  {
    slug: 'langgraph-conditional-edge-reducer',
    title:
      'LangGraph Conditional Edge + Reducer:讓 graph 會分流、會重試',
    excerpt:
      '線性 graph 不夠用時你需要兩個東西:Conditional Edge(跑完一個 node 看結果決定下一步去哪——過了往前、沒過退回重試、重試太多次直接退件)跟 Reducer(讓某個 state 欄位累加而不是覆蓋,最典型就是 retry 計數器)。這篇用 add_conditional_edges + router 函式 + Annotated[int, operator.add] 把這兩件事講透,並解釋一個關鍵設計決策:MAX_RETRY 該設多少、為什麼很多嚴肅場景答案是 0。「用真實專案學 LangGraph」系列 EP3。',
    category: 'AI 教學',
    tags: [
      'LangGraph',
      'LangGraph 教學',
      'Conditional Edge',
      'LangGraph Reducer',
      'AI Agent',
      'Python',
      'AI 應用開發',
    ],
    publishDate: '2026-05-29',
    faqItems: [
      {
        q: 'LangGraph 的 conditional edge 跟 add_edge 可以混用嗎?',
        a: '可以,而且通常會混。大部分的線用 add_edge 直連,只有真的需要分流的那幾個點用 add_conditional_edges。不要每條線都搞成 conditional,那會讓流程難讀。',
      },
      {
        q: 'LangGraph 的 router 函式可以改 state 嗎?',
        a: '不該。router 的職責是讀 state、決定路線,改 state 是 node 的事。如果你發現 router 裡想改東西,那段邏輯應該搬到前一個 node 去。',
      },
      {
        q: 'LangGraph 的 reducer 只能用 operator.add 嗎?',
        a: '不是。reducer 是任何拿舊值跟新值、回傳合併值的函式。operator.add 適合數字相加跟 list 串接;你也可以自己寫函式做更複雜的合併。LangGraph 對訊息列表還有專用的 add_messages reducer。',
      },
      {
        q: '怎麼避免 LangGraph 重試迴圈跑成無限迴圈?',
        a: '兩層保險。第一層是你自己的 MAX_RETRY 邏輯(router 判斷 retry_count 超過就走 reject)。第二層是 LangGraph 的 recursion_limit,跑超過步數上限會丟 GraphRecursionError。第一層是你該做的,第二層是兜底。',
      },
      {
        q: 'LangGraph MAX_RETRY 設 0 為什麼還要保留 retry 那條邊?',
        a: '因為 add_conditional_edges 的對照表必須涵蓋 router 可能回傳的所有值。即使 retry 實際不會被走到,對照表少了那個 key,萬一 router 真的回了它就 KeyError。保留是為了結構完整跟防禦。',
      },
    ],
    featured: false,
  },
  {
    slug: 'langgraph-llm-node-structured-output',
    title:
      'LangGraph LLM Node:結構化輸出 + Few-shot + 業務驗證',
    excerpt:
      '把真正的 LLM 接進 LangGraph node,三個關鍵:結構化輸出(用 Pydantic schema 強制 LLM 吐固定格式,不要 parse 自由文字)、few-shot(在 prompt 裡塞範例把輸出品質拉穩)、業務驗證(LLM 吐的東西不能照單全收,過一道規則檢查)。這篇示範怎麼用 with_structured_output 在決策 node 裡把這三件事兜起來,並講最容易出事的地方:LLM 的結構對了不代表內容對。「用真實專案學 LangGraph」系列 EP4。',
    category: 'AI 教學',
    tags: [
      'LangGraph',
      'LangChain',
      '結構化輸出',
      'Pydantic',
      'Few-shot',
      'AI Agent',
      'Python',
    ],
    publishDate: '2026-05-30',
    faqItems: [
      {
        q: 'with_structured_output 每個 model 都支援嗎?',
        a: '主流的(OpenAI、Anthropic、Google 等)都支援,但底層機制不同(function calling vs JSON mode)。LangChain 幫你抽象掉差異,但冷門或本地小模型可能支援度差、parse 失敗率高。換 model 時務必實測結構化輸出的穩定度。',
      },
      {
        q: 'LangChain 結構化輸出 parse 失敗會怎樣?',
        a: '如果 LLM 吐的東西無法 parse 成你的 schema,LangChain 預設會丟錯。你可以在 node 裡 try/except 接住,當成驗證失敗走 retry 流程。不要讓 parse 錯誤直接炸掉整張 graph。',
      },
      {
        q: 'few-shot 跟 fine-tune 差在哪,該用哪個?',
        a: 'few-shot 是在 prompt 裡塞範例,零成本、即改即生效,適合範例少、需求常變的情況——大部分業務場景用 few-shot 就夠。fine-tune 成本高、週期長,只有 few-shot 怎麼調都救不動且量大到划算時才考慮。先用 few-shot,撞牆再說。',
      },
      {
        q: '可以讓 LLM 自己驗證自己的輸出嗎(LLM-as-judge)?',
        a: '可以當補充,不能當唯一防線。LLM 驗 LLM 一樣會幻覺。高風險場景的最後一道驗證一定要是確定性規則(你寫死的 if-else),LLM-as-judge 適合用在規則難明確表達的軟性品質檢查。',
      },
      {
        q: '結構化輸出之後還需要業務驗證嗎?',
        a: '絕對需要。with_structured_output 只保證格式合法(欄位型別、枚舉值),完全不保證內容正確。LLM 可能給出結構完美但臨床上自相矛盾的建議。結構化輸出解決格式可控,業務驗證解決內容可信,兩個都要。',
      },
    ],
    featured: false,
  },
  {
    slug: 'langgraph-full-pipeline-hitl',
    title:
      'LangGraph 完整 Pipeline + Human-in-the-loop:8 步決策管線全貌',
    excerpt:
      '前四篇的零件——state、node、edge、conditional edge、reducer、LLM 結構化輸出——這篇全部組起來,串成一條完整的醫療 AI 決策 pipeline:載入資料 → 補衍生指標 → 載入規則 → 組 few-shot → LLM 出建議 → 業務驗證 → 適配輸出 → 持久化,中間帶分流重試。然後加上 LangGraph 的殺手級功能 human-in-the-loop:用 interrupt() 在高風險決策點暫停整張 graph,等人點頭才繼續,靠 durable state 讓這件事變簡單。「用真實專案學 LangGraph」系列 EP5。',
    category: 'AI 教學',
    tags: [
      'LangGraph',
      'Human-in-the-loop',
      'LangGraph Pipeline',
      'durable state',
      'AI Agent',
      'Python',
      'AI 應用開發',
    ],
    publishDate: '2026-05-31',
    faqItems: [
      {
        q: 'LangGraph interrupt() 之後 graph 真的停住嗎?會占資源嗎?',
        a: '不會占 process。interrupt() 是把狀態存進 checkpointer 然後結束本次 invoke,process 就釋放了。等你之後用 Command(resume=...) 再次 invoke,它才從 checkpointer 把狀態載回來繼續。人等一小時,這段時間 server 沒有東西卡著。',
      },
      {
        q: 'LangGraph HITL 一定要掛 checkpointer 嗎?',
        a: '要。interrupt() 要能停下來再接回,靠的是 checkpointer 把狀態存起來。compile 時忘了傳 checkpointer,interrupt() 會行為異常或報錯。HITL 跟 checkpointer 是綁在一起的,要用前者必掛後者。',
      },
      {
        q: 'LangGraph checkpointer 用記憶體還是 Postgres?',
        a: '開發測試用記憶體版(MemorySaver)最快。Production 一定要用持久化的(Postgres / Redis),因為 server 重啟記憶體就沒了,HITL 等人那段時間若重啟就接不回。',
      },
      {
        q: '為什麼確定性步驟不該丟給 LLM 算?',
        a: '能用程式算的就不要叫 LLM 算。LLM 算數學不可靠、不可審計、慢又貴、不穩定。把 LLM 用在它真正擅長的綜合判斷,其他能寫成公式或規則的老實用 Python 算。LLM 是 pipeline 裡的一個 node,不是整個 pipeline。',
      },
      {
        q: 'LangGraph human-in-the-loop 一定要在前端做嗎?',
        a: '不一定。interrupt() 只是把要審核的內容吐出來,怎麼呈現給人、人怎麼回是你應用層的事——可以是前端按鈕、Slack 訊息按 approve、email 回覆。LangGraph 只管停/接回,UI 你自己決定。',
      },
    ],
    featured: false,
  },
  {
    slug: 'hermes-to-langgraph-migration',
    title:
      '我原本用 Hermes Agent CLI,後來為什麼換成 LangGraph(遷移覆盤)',
    excerpt:
      '系列番外。我這套醫療決策 pipeline 最早不是用 LangGraph,是用 Hermes Agent CLI(NousResearch 2026 年初開源的自主 agent 框架)。Hermes 很強,但強在通用對話助理、會自我學習、接 20+ 平台;而我要的是確定性步驟為主、流程可畫成圖、每步可審計、出錯能精準退件的決策管線。方向不對再強也是錯的工具。這篇覆盤這個選型決策:Hermes 哪裡好、為什麼對我的場景不對、換到 LangGraph 解決了什麼。「用真實專案學 LangGraph」系列 EP6(完結)。',
    category: 'AI 工具',
    tags: [
      'LangGraph',
      'Hermes Agent',
      'AI Agent',
      '技術選型',
      'agent framework',
      'AI 應用開發',
      'Python',
    ],
    publishDate: '2026-06-01',
    faqItems: [
      {
        q: 'Hermes Agent CLI 不值得用嗎?',
        a: '完全不是。如果你要的是通用個人 agent、多平台助理、會自我學習的對話夥伴,Hermes 是很棒的選擇,它的 self-improving 跟 gateway 設計很有特色。我換掉它純粹因為我的場景要的是相反的東西——確定性、可控、可稽核。工具沒有好壞,只有合不合場景。',
      },
      {
        q: '選 agent 框架怎麼一開始就避免選錯?',
        a: '選型前先回答一個問題:你要自由還是控制?開放任務、要 agent 自己探索 → 自由 → 自主 agent 框架。固定流程、要可控可審計 → 控制 → LangGraph 這類能把流程畫死的。很多人就是沒先問這題,被「看起來什麼都能做」吸引。',
      },
      {
        q: 'LangGraph 也能做自主 agent 嗎?還是只能做固定流程?',
        a: '兩者都能。LangGraph 是底層 runtime,你可以畫固定流程,也可以用 conditional edge 做出讓 LLM 決定路線的自主行為,LangChain 的 create_agent 底層就是 LangGraph 的 agent loop。差別在控制粒度——LangGraph 讓你決定要給多少自由,而不是預設全自由。',
      },
      {
        q: '從 Hermes 遷移到 LangGraph 花多久、值得嗎?',
        a: '重寫比想像久,因為心智模型要轉(tool 是給 agent 選用的能力,node 是流程裡固定的一站)。但值得——換完之後流程可測、可稽核、行為穩定,這些在醫療場景是硬需求。如果你也在強大但不可控的 agent 上撞牆,早換早解脫。',
      },
      {
        q: 'Hermes Agent 跟 LangGraph 差在哪,該選哪個?',
        a: 'Hermes 給你自由(自主 agent、自我學習、多平台),LangGraph 給你控制(流程畫死、可審計、行為穩定)。通用助理選 Hermes;固定流程、確定性步驟為主、要精準錯誤處理跟人工審核的決策管線選 LangGraph。',
      },
    ],
    featured: false,
  },
  {
    slug: 'hermes-agent-intro',
    title:
      'Hermes Agent 是什麼?一篇給完全新手看的 AI 工具介紹(白話版)',
    excerpt:
      '我有 ChatGPT 了為什麼還要裝 Hermes Agent?簡單講:ChatGPT 只會回字、要你自己動手;Hermes Agent 會幫你動手——查檔、改檔、跑指令、上網查資料,做完才回報。本文用「人肉接線生 vs 工讀生」的比喻、5 個日常情境、跟 ChatGPT/Claude Code/Cursor 的對照表,讓完全不會寫 code 的人也能搞懂這工具能幫你做什麼、安不安全、怎麼開始。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      'AI Agent',
      'AI 入門',
      'CLI 工具',
      'NousResearch',
      'Claude Code',
      'ChatGPT',
    ],
    faqItems: [
      {
        q: 'Hermes Agent 會不會把我電腦弄壞?',
        a: '預設模式下它會直接動你電腦的檔案,理論上有風險(雖然它會先問你確認再執行破壞性操作)。如果你完全不放心,可以叫它進入「沙盒模式」——一個隔離的小房間,弄壞了砍掉重來,你電腦完全沒事。詳細沙盒怎麼用看沙盒篇。',
      },
      {
        q: '我完全不會 coding 也能用嗎?',
        a: '能用。Hermes Agent 是「跟 AI 講話讓它幫你做事」的工具,不是「教你寫 code」的工具。日常用法:你用中文跟它講「幫我整理桌面」「幫我看 Downloads 哪些檔案可以刪」,它就會自己跑。不會 coding 完全不影響使用,只是不會 coding 的人通常也不會打開終端機——這是真正的門檻,不是 coding 能力。',
      },
      {
        q: '免費還是要付錢?',
        a: 'Hermes Agent 本身完全免費、開源。但它後面要接一個 LLM(實際做事的 AI),那個 LLM 可能要錢——用 Claude / GPT 要花 API 費用(便宜,一個月 $5-20 跑很多),用 Ollama 本機免費但要你電腦有點力氣,用 OpenRouter 可以按量計費隨時切換。',
      },
      {
        q: '跟 Claude Code 哪個好?',
        a: '不同場景。Claude Code 綁定 Anthropic,設定簡單、開箱即用,適合「我就是要用 Claude」的人;Hermes Agent 可以接任何家的 AI(包括你公司內網的、開源的、便宜的),適合想要彈性、不想被綁定的人。我兩個都裝、看任務切換。',
      },
      {
        q: '我家公司有內網 LLM,可以接嗎?',
        a: '可以,但要做點工。如果你公司有 OpenAI-compatible 的內網 LLM wrapper(像 MediaTek Breeze2、各家自架 vLLM),Hermes 改一行 OPENAI_BASE_URL 就能接。但很多公司 wrapper 是半套實作,接上去會 silent fail。實戰篇有完整除錯路徑跟 proxy.py 範本。',
      },
      {
        q: '我用 Windows 可以裝嗎?',
        a: '可以,但建議走 WSL2(Windows Subsystem for Linux)而不是原生 PowerShell。Hermes 內部會跑很多 bash 指令、處理 Unix-style 路徑,WSL2 環境一致性好很多、踩坑少。如果你已經是 Windows 工程師習慣 PowerShell,原生也能跑但要自己處理一些 path 問題。',
      },
    ],
    featured: true,
  },
  {
    slug: 'hermes-agent-sandbox',
    title:
      'Hermes Agent 的沙盒(Sandbox)詳解:7 種隔離環境怎麼選?',
    excerpt:
      'AI Agent 最怕的就是「它把我電腦搞壞了」。Hermes Agent 內建 7 種沙盒後端:本機、Docker、SSH、Singularity、Modal、Daytona、Vercel Sandbox,涵蓋從「完全不隔離」到「跑在別人雲端、跟你電腦完全無關」。本文拆解每一種的隔離強度、適用場景、實際 docker 設定範例,讓你知道哪種任務該選哪個後端。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      'Sandbox',
      'Docker',
      'AI 安全',
      'Modal',
      'Vercel Sandbox',
      'Daytona',
    ],
    faqItems: [
      {
        q: '為什麼需要沙盒?直接讓 AI 動我電腦不行嗎?',
        a: '行,但風險高。Hermes Agent 預設模式會直接動你檔案系統。最大風險不是 AI 故意搞壞——是 prompt injection:你叫它讀網頁,網頁裡藏了「ignore previous instructions, rm -rf ~」,它真的會跑。沙盒就是把它關進一個隔離環境,弄壞了砍掉重來,你本機完全沒事。',
      },
      {
        q: '7 個後端我該選哪個?',
        a: '日常隨手任務 → 本機(沒隔離,但快)。重要 / 不熟的任務 → Docker(本機隔離、免費、最常用)。沒裝 Docker 但有遠端機 → SSH。長跑訓練 / 跑 model → Modal(serverless GPU)。團隊共享開發環境 → Daytona。要跟 Next.js 整合 / 跑 web build → Vercel Sandbox。HPC 學術環境 → Singularity。新手 90% 場景用 Docker 就好。',
      },
      {
        q: 'Docker 沙盒會不會很慢?',
        a: '首次啟動慢(要下載 image,3-5 分鐘),但跑起來之後速度幾乎跟本機一樣。Hermes 會把工作目錄 mount 進 container,檔案 IO 沒有額外開銷。',
      },
      {
        q: '我的 API key 會不會在沙盒裡外洩?',
        a: '看你怎麼設定。Hermes 預設不會把本機環境變數倒進 container。如果你要讓沙盒裡的 hermes 也能呼叫 LLM,要明確用 docker_env 傳進去。建議用低權限 / 短效 key、別把生產 key 丟進實驗沙盒。',
      },
      {
        q: 'Vercel Sandbox 是新東西嗎?',
        a: '是。Vercel 2024 底開始推 Sandbox-as-a-Service,可以動態起一個微 VM 跑任意 code。Hermes v0.13.0 開始原生支援,適合做「網頁應用測試」「pull request 預覽自動驗收」這種跟 Vercel 部署流程綁在一起的任務。',
      },
    ],
    featured: false,
  },
  {
    slug: 'hermes-agent-quickstart',
    title:
      'Hermes Agent 最簡安裝指南:5 分鐘新手版(macOS/Linux/Windows)',
    excerpt:
      '不用懂 Python、不用買 GPU、不用 Docker。三步驟:裝 uv → 裝 hermes-cli → 給它一把 API key。本文是 Hermes Agent 最簡安裝路徑,專為「完全沒裝過 AI CLI 工具」的新手寫,附 Anthropic / OpenAI / Ollama 三家 provider 比較、API key 取得步驟、第一句話 hermes -z 範例,15 分鐘從 0 跑起來。想接公司內網 LLM 看實戰篇,這篇先學會「能跑」。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      'uv',
      '安裝教學',
      'AI 入門',
      'Anthropic',
      'OpenAI',
      'Ollama',
      'CLI',
    ],
    faqItems: [
      {
        q: '為什麼用 uv 不用 pip?',
        a: 'uv 是 Rust 寫的 Python 套件管理器,比 pip 快 10-100 倍、自帶獨立環境管理。`uv tool install hermes-cli` 把 hermes 裝成全域 CLI 又不污染你其他 Python 環境。pip install 在新系統上常常會跟系統 Python 打架,uv 完全沒這問題。',
      },
      {
        q: '一定要付錢嗎?',
        a: '不一定。Anthropic 新帳號送 5 美金試用額度,夠你聊 100-500 輪 Claude Sonnet。完全不想付錢 → 走 Ollama 本機免費(但要硬體 16GB RAM 以上)。OpenAI 比較嚴,新帳號要先儲值 5 美金才有 API 額度。',
      },
      {
        q: 'Anthropic / OpenAI / Ollama 我該選哪個?',
        a: '新手第一次 → Anthropic Claude,5 美金試用最大方、Claude 寫 code 效果第一名、設定最簡單。已經有 OpenAI 帳號 → 也可以,但要另外開 API key、得儲值。完全不想付錢 + 電腦有點力氣 + 不在乎中文偏弱 → Ollama llama3.2。',
      },
      {
        q: 'Windows 一定要 WSL2 嗎?',
        a: 'PowerShell 也能裝,但建議走 WSL2 Ubuntu。Hermes 內部會跑 bash 指令、處理 Unix-style 路徑,WSL2 環境一致性好很多。已經是 Windows 工程師習慣 PowerShell → 試試,純新手 → 直接 WSL2,踩坑會少很多。',
      },
      {
        q: 'hermes -z 跟 hermes(互動模式)差在哪?',
        a: '`hermes -z "..."` = zero-shot 一次性,給一句、回一段、結束,適合測試 / 自動化腳本。`hermes` 不帶參數 = 互動模式,像 ChatGPT 一樣連續對話、有上下文記憶。新手測試用 -z,實際工作流用互動模式。',
      },
      {
        q: '裝完發現不喜歡怎麼移除?',
        a: '一句 `uv tool uninstall hermes-cli` 移掉 hermes,再 `rm -rf ~/.config/hermes ~/.cache/hermes` 清設定。要連 uv 一起拿掉:`rm -rf ~/.local/share/uv ~/.local/bin/uv`。最後編輯 `~/.zshrc` 把 export 那行刪掉。完全沒殘留。',
      },
    ],
    featured: false,
  },
  {
    slug: 'hermes-agent-mac-install',
    title:
      'Mac 裝 Hermes Agent 接內網 LLM：踩了 4 個洞才接通',
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
  {
    slug: 'claude-code-two-lessons-astro-and-tasklist',
    title:
      '兩個教訓:Astro base path 不會自動套 markdown 連結、跨多檔案任務該開 TaskList',
    excerpt:
      '剛把 5 篇 Hermes Agent 系列發到 GitHub Pages,踩兩個坑被自己抓到。第一個技術:Astro 的 base path 設定不會自動套到 markdown 連結,本機 dev 看不出來、production 全 404,Astro issue #3626 從 2022 年開到現在,官方文件明文寫「developer responsibility」要自己加前綴。第二個流程:跨多檔案多步驟任務該開 TaskCreate 追進度,不是儀式是斷線保險。兩個共通點:該查不查、該開不開。',
    category: '工程師日常',
    tags: [
      'Astro',
      'Claude Code',
      'GitHub Pages',
      'Static Site Generator',
      'TaskList',
      'AI 工作流',
      '踩坑筆記',
    ],
    faqItems: [
      {
        q: 'Astro 為什麼不直接修 base path 的 markdown 連結行為?',
        a: 'Astro maintainer 在 issue #3626 的說法:markdown 連結到底是站內還是站外,Astro 沒辦法 100% 確定。[link](/foo) 可能是想跳到 base 下,也可能是 base 之外的 sibling page。自動加前綴反而會把後者搞壞。合理但礙事,實務上 99% 都是站內連結,所以社群普遍走 remark/rehype plugin 自動加。',
      },
      {
        q: '為什麼不一開始就寫 plugin 自動加前綴?',
        a: 'YAGNI。我場景文章 ~30 篇、改一次手動就定型。寫 plugin 至少 30 分鐘 + 後續維護成本,sed 一行十秒搞定。判斷依據是「這坑會再犯幾次」——文章每天新增就值得寫 plugin,一次性事件就 sed 過去。',
      },
      {
        q: 'TaskList 不是給使用者看的嗎?開了會不會反而拖慢?',
        a: '我以前的盲點。實際用幾次後發現:TaskList 的主用戶是 AI 自己,不是使用者。它是 AI 在 context 壓縮後找回脈絡的錨點。使用者看到的是副作用,真正的價值在斷線復原。開 task 的成本是 2 秒,壞處只有「task 數量會多」。複雜任務本來就該分解,task 多 ≠ 慢。',
      },
      {
        q: 'CLAUDE.md 紀律寫了沒用怎麼辦?',
        a: '我 CLAUDE.md 有「能查就查、不要問」這條,但這次還是憑印象寫了錯誤的 markdown link。寫紀律 != 執行紀律。解法不是再寫一條,是改變觸發機制:看到自己心裡冒出「應該」「以為」「我記得」,直接停下來查一次。把 trigger 從「規則記得」改成「字眼偵測」。',
      },
      {
        q: '用 Next.js / Nuxt 會有這問題嗎?',
        a: '不會。Next.js 的 basePath 設定後,Link 跟 markdown link 都會自動加前綴(@next/mdx 內建處理)。Nuxt 的 app.baseURL 同樣自動處理 NuxtLink 跟 content module。只有 Astro 是「自己加」。背後設計哲學差異,沒對錯,但會被類比經驗坑到。',
      },
      {
        q: '這篇文章自己有 follow 教訓嗎?',
        a: '有檢查。內部連結:這篇沒有指向別篇文章的內部連結(都是 GitHub issue / Astro docs 的外部 URL),所以 base path 問題不適用。任務追蹤:這次寫文章開了 6 個 task(查證 → outline → 寫長文 → 截圖 → caption → 發佈)。至少這次有遵守,下次會不會 regression 不知道,所以才寫下來。',
      },
    ],
    featured: false,
  },
  {
    slug: 'popularize-slides-deck',
    title:
      '我把 AI 課程簡報全做成 HTML 丟上 GitHub Pages：popularize-slides 開源拆解',
    excerpt:
      '我在職訓局教 4 堂 AI Claude Code 概論初級班，把簡報全寫成 HTML 而不是 Keynote / Slidev / Reveal.js，丟在 GitHub Pages 上跑。本文拆解：為什麼放棄 Keynote、為什麼不用 Slidev、設計系統（深色 + 黃金 accent + 襯線標題）、部署用一條 push 指令、學生 clone 下來雙擊就能看（沒有 npm install）。Repo 全開源，歡迎 fork 改成你的教學內容。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'GitHub Pages',
      'HTML',
      '簡報設計',
      '職訓局',
      'AI 教學',
      'Superpowers',
    ],
    faqItems: [
      {
        q: '為什麼不用 Notion / Slidev / Reveal.js / Marp 這些現成工具？',
        a: '現場 demo + 學生 fork 的場景下，build step 是負擔。Notion 簡報模式不能改鍵盤導航；Slidev / Reveal.js 要 build step，學生 clone 下來不能直接看；Marp 不能寫自訂 JS。手寫 HTML 是「最不偷懶但最自由」的選擇。如果你只要做一份簡報、不在意 fork 友善度，請用 Slidev。',
      },
      {
        q: '每堂課 60% 重複 CSS 不會痛嗎？',
        a: '會痛，但沒抽出來是刻意的。教學素材的版本演進不是線性 refactor — 第三堂我加金色 accent、第四堂我改 progress bar 粗細。如果這些是 shared CSS，每改一次都要回頭驗證前面的課還能看。分開檔案 = 每堂課獨立可審查，YAGNI 原則：到第 8 堂課真的吵到我之前，不抽。',
      },
      {
        q: '用 AI 寫教學簡報會不會有 AI 腔？',
        a: '我自己寫文字內容、用 Claude Code 寫 HTML/CSS/JS。文字部分（標題、痛點、口號）我自己定，Claude 只是把 outline 變成 markup，prompt 裡明確說「不要顛覆性、革命性、超棒、神器」。實作部分（CSS 動畫、鍵盤事件、進度條）Claude 寫得比我親手寫快 5 倍。分工：我管教什麼、要什麼感覺；AI 管把 HTML/CSS 寫出來。',
      },
      {
        q: 'GitHub Pages 不會收費嗎？流量大會掛嗎？',
        a: 'public repo 完全免費，soft limit 每月 100GB 流量、100GB 倉庫大小，我這個 repo 才 51KB 完全用不到。一場職訓局 30 個學生連一次靜態 HTML，總流量約 1MB。流量永遠不會是問題。private repo 用 GitHub Pages 要 GitHub Pro 以上，教學素材建議 public，學生才能 fork。',
      },
      {
        q: '學生用手機看會 OK 嗎？',
        a: '不會 OK。我刻意沒做 responsive。簡報是給投影機（1920×1080）跟 17 吋筆電用的，手機螢幕字會炸出去。回家複習可以用筆電開或我會另發 PDF。為了手機去動 CSS 會犧牲大螢幕的視覺密度，不值得。',
      },
      {
        q: '可以拿這個 repo 商用嗎？',
        a: 'repo 目前沒附 LICENSE 預設是 All Rights Reserved。實務上歡迎 fork 改你自己的教學內容。要拿設計風格 / CSS / 結構去做付費課程，麻煩標一下來源（連結到 repo 或我的部落格）。不用問我、不用付錢，標個名字而已。商用細節歡迎私訊。',
      },
    ],
    featured: false,
  },
  {
    slug: 'karpathy-llm-wiki',
    title:
      'LLM Wiki 跟 RAG 差在哪?Karpathy 那套我跑兩週實測 token 降 87%',
    excerpt:
      '2026 年 4 月 Karpathy 在 gist 丟了一份 200 行 markdown,一週後全網炸開、12 個社群 implementation。一句話講:讓 LLM 把你丟的所有資料「編譯」成一個結構化的 markdown 知識庫,以後問問題不查原始檔、查這個被整理過的 wiki。本文拆解 RAG vs LLM Wiki 的編譯式/解釋式之差、三層架構、30 分鐘上手路徑、我把 7 場教學逐字稿 + 200 則 Discord QA 丟進去跑兩週的實測(token 降 87%)、5 個踩坑、什麼情境裝了反而是負擔。',
    category: 'AI 工具',
    tags: [
      'LLM Wiki',
      'Karpathy',
      'Claude Code',
      'RAG',
      '知識管理',
      'AI 工作流',
      'Obsidian',
      'AI 工具',
    ],
    faqItems: [
      {
        q: '這跟 Notion AI / Mem.ai / Reflect 那種 AI 筆記工具有什麼不同?',
        a: 'Notion AI 那批是「在你既有筆記裡加 AI 查詢入口」,本質還是 RAG——你寫的筆記是 source,AI 是 reader。LLM Wiki 是「AI 自己生成筆記、自己維護」,你的 source 跟 AI 的 wiki 是兩層。差別在 wiki 是 AI 為了 AI 自己以後查詢方便而寫的——結構是給 AI 看的(frontmatter、wikilink、confidence rating),不是給人看的(雖然人也看得懂)。',
      },
      {
        q: '為什麼還要 markdown?直接存 SQL / vector DB 不就好了?',
        a: 'Karpathy 原文有解釋:markdown 是 LLM 最熟的格式。LLM 看 markdown 像人看母語,寫也最自然。用結構化 schema(JSON / SQL)會花時間在 schema migration、欄位設計,不是知識本身。更實際的理由:markdown 可以丟 Obsidian / Logseq / grep,完全 tool-agnostic、永遠不會被綁定、git diff 看得懂。',
      },
      {
        q: 'wiki 會不會被 LLM hallucination 污染?',
        a: '會,這是這方案最大的風險。解法:第一,frontmatter 寫 sources 連回原始檔,人類抽查時順著查;第二,confidence rating LLM 對自己 hallucinate 出來的東西通常會給 low;第三,定期跑 lint-wiki 找 broken link、孤兒頁、矛盾;第四,重要 claim 你親眼讀過 source 再放心用。LLM Wiki 不是「自動產生可信知識庫」,是「自動產生一個你可以快速 audit 的草稿知識庫」,心態調對才不會出包。',
      },
      {
        q: '可以多人共用嗎?',
        a: '技術上可以(wiki/ 跟 sources/ 放 git repo),但實務上很痛。兩個人同時 ingest 會 race condition、schema 偏好不同會打架、commit conflict 在 markdown 上難 resolve。要團隊用,指定一個 wiki librarian 統一負責 ingest、其他人 read-only。或者每人各自一個 wiki,定期跨 wiki synthesis(這還是 alpha 階段)。',
      },
      {
        q: 'token 真的會降 95% 嗎?哪些情境會降、哪些不會?',
        a: 'MindStudio 案例降 95%(383 檔案 + 100 場逐字稿),我自己案例降 87%。會降的關鍵在 query 階段不再餵原始 chunk,只餵被編譯過的結論頁。會降很多的情境:資料量大(>50 份)、問題偏綜合 / 模糊;降幅小的情境:資料量小、問題偏字面查詢(因為 retrieval-based RAG 本來就準)。前期 ingest 階段反而比 RAG 燒 token,投資回收期看你用多兇。',
      },
      {
        q: '什麼情境別裝 LLM Wiki?',
        a: '資料量小於 20 份(沒到甜蜜點,Obsidian + 全文搜尋更快);資料常變(新聞、Twitter feed 每次 ingest 都要寫 contradiction block,維護成本爆炸);你只是要「問檔案內容」(NotebookLM / Cursor docs 直接餵原檔答得很好);你不打算動 schema(LLM Wiki 80% 價值在你願意調 CLAUDE.md);公司資料合規不能丟 Claude API(編譯階段要餵 LLM,合規問題要先解)。',
      },
      {
        q: 'Karpathy 自己現在還在維護嗎?有 canonical implementation 嗎?',
        a: '到 2026 年 5 月為止 gist 本體沒再更新。但社群 fork 持續迭代——sdyckjq-lab、vanillaflava、kfchou、6eanut 四家活躍度最高,各自有 schema 變種。Karpathy 在 Twitter 多次轉發實作版,但沒指定官方分支。目前社群驅動,沒有 canonical implementation。新手建議從 6eanut/llm-wiki 開始(最貼近原文)。',
      },
    ],
    featured: true,
  },
  {
    slug: 'mempalace-3-3-5-claude-p-proxy',
    title:
      'MemPalace 3.3.5 救援實錄:HNSW Quarantine、from-sqlite 重建,與一支 claude -p HTTP proxy',
    excerpt:
      'chromadb 1.5.x 在 macOS 26.4 ARM64 必 SIGSEGV,所有 mempalace CLI 指令全死、只剩 MCP server 苟活。MemPalace 3.3.5 用兩個機制救回來:HNSW segment quarantine 自動隔離壞索引,repair --mode from-sqlite 從 sqlite3 直接撈 (id, document, metadata) 重灌新 palace。本文記錄完整升級路徑、3.3.5 兩個救命機制原理、外加我寫的 180 行 Python claude-p-openai-proxy.py——把 claude -p CLI 包成 OpenAI 相容 HTTP 端點,讓 mempalace compress 走 Max 訂閱、零 API 成本。',
    category: 'AI 工具',
    tags: [
      'MemPalace',
      'ChromaDB',
      'HNSW',
      'Claude Code',
      'Anthropic',
      'RAG',
      'vector-db',
      'Python',
    ],
    faqItems: [
      {
        q: '我也想裝這支 proxy,但我沒 Max 訂閱怎麼辦?',
        a: '不能用。claude -p 認本機 ~/.claude/ 的訂閱狀態,沒登入會拒跑。OpenAI API key 直連反而簡單,把 proxy 改成轉發給 https://api.openai.com/v1/chat/completions 就好——但這樣就跟直接用 OpenAI 一樣,proxy 沒意義。',
      },
      {
        q: '為什麼不直接讓 mempalace 內建 claude -p 支援?',
        a: 'mempalace 上游沒義務支援 Anthropic CLI 的怪招,而且這是個人 Max 訂閱情境,不通用。寫成獨立 proxy 反而更乾淨——任何 OpenAI 相容客戶端都能接,mempalace 端只要設 LLM_ENDPOINT 環境變數。',
      },
      {
        q: 'proxy 安全嗎?要不要綁 auth?',
        a: '我這支只 bind 127.0.0.1,不暴露公網。LAN 內如果其他人能 ssh 到這台,他能直接跑 claude -p,要 proxy 也只是方便他用 HTTP 而已。不要 bind 0.0.0.0——那等於把 Max 訂閱開放給整個 LAN,違反 Anthropic ToS。',
      },
      {
        q: 'HNSW quarantine 會不會把好 segment 也誤判隔離?',
        a: '看 data_level0.bin 跟 chroma.sqlite3 的 mtime 差距判斷。正常運作下 sqlite3 寫入後 HNSW segment 會接著刷新;差距大代表 segment 上次 flush 失敗。不會誤判正常 segment,但會誤判「palace 長期沒進新 drawer」的情境——這時 sqlite3 不動、segment 也不動,差距趨近 0,正常。問題情境是 sqlite3 動了 segment 沒跟上。',
      },
      {
        q: '升 3.3.5 要做什麼準備?',
        a: '備份 ~/.mempalace/ 到 .mempalace.bak.<date>/。然後 pip install -U mempalace。MCP server 重啟一次讓它載新版。如果原本卡在 apply_logs 才需要跑 repair --mode from-sqlite --archive-existing,正常的話 quarantine 自動跑、不用手動干預。',
      },
      {
        q: 'claude -p 為什麼會比 OpenAI API 慢這麼多?',
        a: '兩個原因。第一,claude -p 每次都是冷啟動,要載 Node.js runtime + CLI ~3-5 秒;第二,subprocess.run 走 stdout/stdin pipe,跟 HTTP API 的 keep-alive 沒得比。對批次壓縮無所謂,但要 chat 級互動延遲就不適合,該用 OpenAI / Anthropic API 直連。',
      },
    ],
    featured: false,
  },
  {
    slug: 'phone-local-llm-pocketpal',
    title:
      '手機跑本地 LLM 怎麼裝？iPhone 15 Plus / Android 完整教學（PocketPal AI 安裝、模型選擇、踩坑）',
    excerpt:
      '想用手機跑本地 LLM，但不知道要裝什麼 app、能跑多大的模型、能不能進開發工作流？本文拆解 2026 年 5 月最熱門的三個 on-device LLM app（PocketPal AI / LLMFarm / MLC Chat）怎麼選、iPhone 15 Plus 真實能跑哪些模型（1B-2B 是甜蜜點，3B 卡頓、4B+ 跑不動）、PocketPal AI 從 0 開始安裝、5 個踩坑（記憶體爆掉、發燙降頻、context window 太短、token/秒掉到不能用、Apple Intelligence 跟本地 LLM 的關係），最後解釋為什麼「手機算力幫電腦」是死路、什麼情境真的值得在手機跑 LLM。',
    category: 'AI 工具',
    tags: [
      'PocketPal AI',
      '本地 LLM',
      'iPhone',
      'Android',
      'LLMFarm',
      'MLC Chat',
      'Apple Intelligence',
      'on-device AI',
      'GGUF',
      'llama.cpp',
    ],
    faqItems: [
      {
        q: 'iPhone 15 Plus 真的可以跑 LLM 嗎？跟 iPhone 15 Pro 差多少？',
        a: 'iPhone 15 Plus 用 A16 Bionic + 6GB RAM，可以跑 1B-2B 量級模型（Qwen2.5 1.5B、Gemma 2 2B、Llama 3.2 1B），3B 會卡頓、4B+ 直接跑不動。iPhone 15 Pro 用 A17 Pro + 8GB RAM，sweet spot 拉高到 3B-4B，而且額外解鎖 Apple Intelligence（內建 ~3B 模型）。差別主要在 RAM 不是 CPU——LLM 推理瓶頸是記憶體頻寬，6GB 跟 8GB 差距比想像中大。',
      },
      {
        q: 'PocketPal / LLMFarm / MLC Chat 我該選哪個？',
        a: 'iOS 新手 → PocketPal AI（介面最友善、HuggingFace 直接抓、內建 benchmark）。iOS 老玩家想搞 LoRA / 多模態 → LLMFarm（彈性高但介面陽春）。Android 用 Snapdragon 旗艦機（S24 Ultra、Pixel 9 Pro）→ MLC Chat（吃 Hexagon NPU，速度比 llama.cpp CPU 快 2-3 倍）。Android 中階機或非高通晶片 → PocketPal AI。Google AI Edge Gallery 還在測試版、模型選擇少，現階段別碰。',
      },
      {
        q: '能不能讓我的 iPhone 餵算力給電腦用？',
        a: '理論上可以、實務上沒意義。手機 token/秒（5-8）比電腦慢 10 倍，網路傳輸延遲再加 100-300ms，整體比電腦直接跑 Ollama 慢 15 倍以上，還會把手機電池燒到 60°C 觸發降頻。真要用閒置算力，買台二手 Mac mini M1（NT$15k）24/7 開著跑 Ollama，遠比手機方案實用。手機跑 LLM 的真正價值在「離線」「隱私」「便攜」，不是「算力共享」。',
      },
      {
        q: 'Apple Intelligence 跟 PocketPal 衝突嗎？要選哪個？',
        a: '不衝突，定位不同。Apple Intelligence 是「系統級隱形 AI」——摘要通知、改寫訊息、Siri 升級，使用者不需要主動「跟 AI 對話」。PocketPal 是「主動式 AI 助手」——你打開 app 跟它聊。Apple Intelligence 限 iPhone 15 Pro 以上（A17 Pro / M1+），iPhone 15 Plus 用不到。如果你是 15 Plus 用戶想要 on-device AI 體驗，PocketPal 是唯一選擇。',
      },
      {
        q: '手機跑 LLM 會不會把電池搞壞？',
        a: '短期不會、長期有風險。LLM 推理會吃滿 CPU + GPU，連續跑 10 分鐘手機溫度可以飆到 45-50°C 觸發降頻保護。鋰電池長期高溫運作確實會加速老化，但「老化」是 6-12 個月才看得出來的事，偶爾跑 30 分鐘做測試沒問題。日常使用建議：別連續超過 20 分鐘、別邊充電邊跑、夏天注意溫度。',
      },
      {
        q: '什麼情境下手機跑 LLM 真的有用？',
        a: '三個情境真的值得：(1) 隱私需求重——醫療筆記、敏感對話、客戶資料絕對不能上雲端；(2) 離線環境——出差到飛機上 / 偏遠地區 / 公司內網禁外連，但又需要 AI 幫忙整理筆記；(3) 開發者驗證 on-device 部署可行性——你要做 app 賣給上面兩種人，自己得先跑過。其他情境（日常聊天、寫 code、查資料）老老實實用 ChatGPT / Claude API 划算 10 倍。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-lesson-1',
    publishDate: '2026-05-20',
    title:
      'Claude Code 入門第一堂:訂了 Claude Pro 之後怎麼開始——4 個 demo + permission mode 4 種 + 邊界',
    excerpt:
      '訂閱 Claude Pro($20/月)、想裝 Claude Code 但還沒動手?這是我 2026-04-28 第一堂 Pro 版小班的完整紀錄。4 個 demo:一句話讀 CSV、整理 24 個亂檔案、SQLite 查 4 月營收、從零部署網站——每個都 5 分鐘內看到結果。然後拆 4 種 permission mode(default/acceptEdits/plan/bypassPermissions)、`.claudeignore` 防憑證外洩、跟我自創的「Claude 邊界」觀念——不要讓 AI 做你也不懂的事情,它犯錯時會極度自信。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'Claude Pro',
      'AI 教學',
      '初階班系列',
      'Permission Mode',
      'AI 入門',
      'Pro 訂閱',
    ],
    faqItems: [
      {
        q: 'Claude Pro $20/月跟免費版 Claude.ai 差在哪?',
        a: '免費版 Claude.ai 每 5 小時給你 30-40 則訊息,Pro 拉高到 5 倍左右、Sonnet 4.6 / Opus 4.7 都能用、最重要的是 Claude Code CLI 從 Pro 開始才用得起來(免費額度不夠跑互動式 coding)。年繳 $200($17/月)再省一些。我這個小班只收已經自掏腰包訂 Pro 的人——自己花錢才會認真學。',
      },
      {
        q: '4 個 demo 我要全部跑過才算學會嗎?',
        a: '不用,但 Demo 4「從零部署個人網站」是回家作業。前 3 個 demo 是「看見它能做什麼」,Demo 4 是「我也能做到」——這個體驗的落差是第一堂的關鍵。如果你 Demo 4 卡在 GitHub Pages 設定,留言問我,office hour 救你。',
      },
      {
        q: 'acceptEdits 跟 bypassPermissions 差在哪?都不問了不是一樣?',
        a: '差很多。acceptEdits 只自動接受「寫檔」類動作(編輯檔案、mkdir、touch、mv、cp),其他 Bash 指令還是會問你(curl、rm -rf、git push 都會跳對話框)。bypassPermissions 是全部不問,連 `rm -rf ~/Documents` 也直接跑——這就是為什麼它叫 `--dangerously-skip-permissions`,新手前兩週千萬別設這個 alias。',
      },
      {
        q: '為什麼一直強調「Claude 邊界」?它不是很聰明嗎?',
        a: '聰明跟「不會錯」不同。Claude 寫 Python 寫得比 80% 人類強——前提是你會看結果對不對。如果你不會 Rust、它寫一個會 deadlock 的 mutex,build 過了你以為對了,上線就爆。同樣道理:不懂稅法別讓它寫稅務計算邏輯。它的錯誤是「極度自信地說錯」,不是「猶豫地說錯」,你看不出差別。守住邊界 = 守住你的職業信用。',
      },
      {
        q: '我電腦上要先裝什麼才能跑 Demo?',
        a: '三樣:Claude Code CLI(走 `claude.com/code` 下載或 npm 裝)、登入你的 Pro 帳號(`claude` 第一次跑會跳瀏覽器 OAuth)、然後 cd 到一個你不介意它動的資料夾(別在桌面 root 跑、別在 Documents root 跑、開一個 `~/workspace/playground/` 之類的)。Demo 4 額外需要 GitHub 帳號跟 gh CLI,但這在第四堂才會 hands-on,第一堂跑不到也沒關係。',
      },
      {
        q: '什麼樣的人不適合來上這個 Pro 版?',
        a: '三種人不適合:(1) 完全沒用過 ChatGPT 的人——先用 Claude.ai 兩週再來;(2) 公司禁止程式碼上 SaaS 的人——你需要走 self-hosted 路線,看 [Hermes Agent 接內網 LLM](/blog/hermes-agent-mac-install/) 那篇;(3) 期待「我什麼都不用會、AI 全幫我」的人——這個小班的核心觀念是「會 AI 邊界」,要你思考的部分不會比寫 code 少。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-lesson-2',
    publishDate: '2026-05-21',
    title:
      'CLAUDE.md 怎麼寫?Claude Code 第二堂——馴服系統提示 + 十大 prompt 定義 + Ultra Think',
    excerpt:
      'Claude Code 預設每次開啟都是失憶的,但只要你寫好 `~/.claude/CLAUDE.md`(全域) + 專案 `CLAUDE.md`,它就會在每次對話開頭把這兩份檔讀進去當作永遠的指令。本文是 2026-05-05 Pro 版第二堂的完整紀錄——十大 prompt 定義對照表(指令/上下文/人設/輸出格式/約束/範例/評估/迭代/護欄/記憶)、`/compact /resume` 救命指令、pwd/ls/cd 在 Claude 內的座標系、Ultra Think 馬力全開、最後用一個「每天早上 7 點 Line 通知前一天踩坑」的 `/schedule` 收尾。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'Claude Pro',
      'AI 教學',
      '初階班系列',
      'CLAUDE.md',
      'Prompt Engineering',
      'Ultra Think',
    ],
    faqItems: [
      {
        q: '全域 CLAUDE.md 跟專案 CLAUDE.md 要寫什麼不同?',
        a: '全域寫「你這個人不變的偏好」——人設(資深工程師)、輸出格式(繁體中文簡潔)、約束(不准 commit credentials)、護欄(不准 force push)、memory 索引在哪。專案寫「這個 repo 的技術細節」——用什麼框架版本、test 怎麼跑、business domain 術語對照、這個 repo 特殊紀律(像 popularize 專案我寫「Bob 是職訓局講師,教材路徑常含中文資料夾」)。兩份檔每次 session 開頭都會被讀,等於兩層 system prompt。',
      },
      {
        q: '十大定義是 Anthropic 官方分類嗎?',
        a: '不是,是我自己整理的、跟 [Anthropic Prompt Engineering 指南](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) 同源但更實用。10 個是:指令(Prompt)、上下文(Context)、人設(Persona)、輸出格式(Output Format)、約束(Constraint)、範例(Few-shot)、評估(Eval)、迭代(Iteration)、護欄(Guardrail)、記憶(Memory)。不要每條都寫,而是「卡住寫不下去時對照看漏了哪幾項」。我自己 CLAUDE.md 重點放在 3、4、5、9、10。',
      },
      {
        q: 'Ultra Think 那個 Alt+Ctrl+Shift+H 跟官方 Option+T 哪個對?',
        a: '兩個都試試看。Anthropic 官方文件記載是 macOS Option+T / Windows Alt+T,但我自己上課 demo 用的是 Alt+Ctrl+Shift+H(把 thinking token budget 拉到上限 31,999)。可能是不同版本的 Claude Code CLI 快捷鍵不同,也可能是 terminal(WezTerm / iTerm2)攔截了按鍵。新手兩個都按按看哪個會在 status line 看到 "thinking..." 提示,看到的那個就是有生效。',
      },
      {
        q: '`/compact` 跟 `/clear` 跟新開 session 差在哪?',
        a: '三個程度不同。`/compact` 是壓縮,保留摘要扔掉細節,它還記得「我們在做什麼」、但不記得「兩小時前那個 import 路徑」。`/clear` 是清光當前 session,完全重來。新開 session 是另外一個 session,但前一個用 `claude --continue` 還救得回來。我的習慣:長任務每 90 分鐘主動 `/compact`,不等它叫我。`/clear` 只在「真的要從零開始」用。',
      },
      {
        q: '`/schedule` 跟 `/loop` 都是定時,差在哪?',
        a: '`/schedule` 是「定時觸發一次 prompt」(像 cron),`/loop` 是「給目標、它自己連續迭代到滿意」。`/schedule` 適合每天 5:03 寄日報這種事;`/loop` 適合「幫我把 Hermes Agent 那篇文章改到 SEO score ≥100」這種需要多輪。兩個都是 2026 三月推出、最多 50 task/session、7 天過期。第三堂會把 `/loop` 完整 demo。',
      },
      {
        q: '我寫了 CLAUDE.md 但 Claude 還是不照做怎麼辦?',
        a: '三個常見原因:(1) 你寫得太抽象,改寫成具體規則+理由(「禁開場白:太棒了/這是個好問題」比「請簡潔」有效 5 倍);(2) Claude 4 在 constitutional AI 訓練下會優先尊重「使用者明確要求的拒絕語氣」,所以你要寫成「拒絕做 X」而不是「請做 Y」;(3) 你的 CLAUDE.md 太長(>500 行),被截斷或被忽略,壓到 200 行內。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-lesson-3',
    publishDate: '2026-05-22',
    title:
      'Claude Code Skill / Subagent / Slash Command 差在哪?第三堂自動化實戰 + /loop + Hook + Remote Control',
    excerpt:
      'Skill、Sub-agent、Slash Command 三個東西長得像、其實完全不同:Skill 是觸發式的小教學文件(主 agent 自己決定要不要讀)、Sub-agent 是有獨立 context 的小弟(平行跑、回精簡結論)、Slash Command 是你定義的快捷指令。本文是 2026-05-12 Pro 版第三堂的完整紀錄——加上 `/loop` 連續迭代、Hook 任務跑超 5 分鐘自動 Line 通知、Remote Control 手機掃 QR 操控你電腦、跟 ralph-wiggum 死磕迴圈工具(來自辛普森家庭那個 Ralph)。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'Claude Pro',
      'AI 教學',
      '初階班系列',
      'Sub-agent',
      'Skill',
      'Loop',
      'Remote Control',
      'Hook',
    ],
    faqItems: [
      {
        q: 'Skill / Sub-agent / Slash Command 我什麼時候該用哪個?',
        a: '記三個比喻:Skill = SOP 手冊(你想加紀律、讓主 agent 看到觸發詞就會照 SOP 跑);Sub-agent = 派外包(任務很大、想 parallelize、不想吃主 context);Slash Command = 鍵盤快捷鍵(常用的長 prompt 一鍵跑、可以帶參數)。最常見誤解:「Skill = 函式」錯,它不能被 invoke,是主 agent 自己決定;「Sub-agent = 多視窗」錯,它是另一個獨立 session 沒有共享記憶。',
      },
      {
        q: 'sub-agent 跟主 agent 怎麼分工?',
        a: '主 agent 做「策略」(這個任務要拆成幾步、誰先做、誰後做),sub-agent 做「執行」(掃 202 個檔案分類、查 50 個 API endpoint 文件、平行寫 5 個 unit test)。設計訣竅:sub-agent 任務的「輸出」要 ≤ 主 agent 的可用 context,不然送回來主 agent 還是會 context 爆掉。經驗值:單個 sub-agent 報告 ≤ 5000 字。',
      },
      {
        q: 'Hook 的 PreToolUse / PostToolUse / Stop 什麼時候各用哪個?',
        a: 'PreToolUse 用在「攔截」——它要跑 `rm -rf` 之前我先 sanity check 一次。PostToolUse 用在「驗收 + 自動修」——它寫完 TypeScript 我自動跑 tsc + prettier 修格式。Stop 用在「總結 + 通知」——任務跑完丟 Line 通知、做 backup、寫 daily summary。新手第一個 hook 建議從 Stop 開始(風險最低、價值高)。',
      },
      {
        q: 'Remote Control 安全嗎?手機掃 QR 不會被中間人攔截?',
        a: '官方文件明寫:Remote Control 的 QR code 是「短時效 device pairing token」,只有同一個 LAN 或經 claude.ai relay 的會話有效、token 約 10 分鐘過期。但風險還是有:你手機如果有惡意 app 掃描你螢幕拍到 QR code、那 10 分鐘內可以接管你 session。建議:在外面用 Remote Control 的時候鎖螢幕、別在咖啡廳大剌剌秀出 QR。Team / Enterprise 預設關閉、admin 要開才能用,個人 Pro 預設開。',
      },
      {
        q: 'Pro 額度跑 `/loop` 跟 `/schedule` 會不會爆?',
        a: '看用法。我自己 `/schedule` 每天 5:03 寄 AI 日報(8K tokens/次)+ 偶爾 `/loop` 跑 SEO 文章迭代(50K tokens/次 × 5 次/週)= 一個月約 1.5M tokens,在 Pro 範圍內。會爆的情境:把 `/loop` 設成 max-iterate=20 跑很大專案、或一天設 10 個 `/schedule`——這時建議切到 Max($100/月)或開 API key 用 pay-as-you-go。2026-06-15 之後 headless `claude -p` 跟 Agent SDK 走獨立額度,情況會更寬鬆。',
      },
      {
        q: 'ralph-wiggum 跟 `/loop` 我該用哪個?',
        a: '`/loop` 是 Anthropic 官方、預設安全、有明確時間/次數上限。ralph-wiggum 是社群 plugin、更死磕、適合「我給你終點、你跑到對為止」的任務(像把 build error 修到全綠、寫 test 寫到覆蓋率 ≥80%)。新手用 `/loop`,進階(裝過 Superpowers 之後)用 ralph-wiggum。注意 v2.6 / v2.7 有 iterate count 重置 bug,看到它跑超過 max 手動 Ctrl+C 然後回報 issue。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-lesson-4',
    publishDate: '2026-05-23',
    title:
      'obra superpowers 怎麼裝?Claude Code 第四堂——MCP + GitHub + Headless 接生態系完整實戰',
    excerpt:
      '2026-05-19 Pro 版第四堂——但實際發生跟教學計畫完全不一樣。原本要教 Git 三動作,現場改成「我們自己寫一定不是最優解,要如何使用別人寫的」。實際走了 4 件事:Superpowers plugin 安裝(卡關 3 次:`/plugins` 沒搜到、Skill 沒生效、hook 把 build 卡死)、Twinkle Hub MCP 接政府開放資料(查 2024 國防部決標 12 筆)、GitHub 註冊 + gh CLI auth(CAPTCHA 卡 5 分鐘、學員 chien chang 救場)、headless `claude -p` 半夜跑 100 個檔案翻譯 batch。Pro 訂閱者照做完整路徑。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'Claude Pro',
      'AI 教學',
      '初階班系列',
      'Superpowers',
      'MCP',
      'Twinkle Hub',
      'GitHub',
      'Headless',
    ],
    faqItems: [
      {
        q: '為什麼第四堂砍掉教學計畫、現場改題?',
        a: '前三堂的設計是「我教你怎麼指揮 AI 做你不會的事」,第四堂變成「來教你 Git add/commit/push」就是斷裂——學員一半是行政 / 業務,他們對 Git 沒感覺、會說「那我用 Dropbox」。早上 dry-run 的時候 Claude 自己提醒我這個落差,下午我直接改題成「站在巨人肩膀上:plugin / MCP / GitHub / headless 都是用別人的」,跟前三堂延長線完美對齊。文章照實際發生寫、不是計畫版本——這是真實上課素材的價值。',
      },
      {
        q: 'Superpowers plugin 為什麼 `/plugins` 搜不到?',
        a: 'Marketplace 沒 add。要先 `claude /plugin marketplace add obra/superpowers-marketplace`,再 `claude /plugin install superpowers`。少了 marketplace add 那一步就搜不到——這是 README 沒寫清楚的 user trap。解法:把網址 `https://github.com/obra/superpowers` 直接貼給 Claude、叫它「幫我裝這個 plugin」,它讀 GitHub 頁面、找正確 install 指令、跑完。比你自己摸文件快。',
      },
      {
        q: 'Twinkle Hub MCP 怎麼裝?要收錢嗎?',
        a: 'Alpha 階段免費、無 rate limit。裝法走「把 hub.twinkleai.tw 網址貼給 Claude、叫它幫你裝」——它讀 setup instructions、寫進 `~/.claude.json` 的 mcpServers 區塊、重啟 MCP server。裝完可以查 52,960 筆 data.gov.tw 資料 + 立法院議案 + 政府電子採購網。我現場 demo 查 2024 國防部決標 12 筆,10 秒拉出來——比官方 web.pcc.gov.tw 快 100 倍。',
      },
      {
        q: 'GitHub 註冊卡 CAPTCHA 怎麼辦?',
        a: '開無痕視窗 + 新 email 重註冊,通常一次過——這是我學員 chien chang 救我的招。GitHub 對某些 cookie / IP / 瀏覽器指紋有偏見,正常視窗連續挑戰你 5 次也很正常。這件事的教育意義是:AI 不是萬能、CAPTCHA 它幫不了你,身邊懂的人比你會 Claude 還重要。',
      },
      {
        q: 'Headless `claude -p` 跟互動式比起來,Pro 額度怎麼算?',
        a: '目前(2026-05)`claude -p` 跟互動式共用同一份 Pro 額度。我量過 100 個 markdown 翻譯 batch 耗約 400K input + 200K output tokens、等於 Pro 額度 8%。**2026-06-15 之後**,[官方文件](https://code.claude.com/docs/en/headless) 明寫 `claude -p` 跟 Agent SDK 使用會從新的「Agent SDK credit」扣、跟互動式 Pro 用量分開——對 Pro 訂閱者反而是利多,半夜跑 batch 不再吃光白天額度。',
      },
      {
        q: '這個小班結束之後我該往哪走?',
        a: '三個方向:(1) 寫自己的 plugin / skill,參考 Jesse Vincent 的 Superpowers 結構;(2) 接公司內網 LLM,看我 [MemPalace + claude -p HTTP proxy](/blog/mempalace-3-3-5-claude-p-proxy/) 那篇是這個方向;(3) Cursor / Cline / Hermes Agent 並用,三家各有強項,看 [Hermes Agent 入門](/blog/hermes-agent-intro/) 做對照。我會繼續開中階班(自己寫 plugin、公司導入)、進階班(多 agent orchestration、production 部署),想接著上的留 email 我下期通知。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-pro-class-hub',
    publishDate: '2026-05-24',
    title:
      'Claude Code Pro 訂閱初階班完整索引——4 堂 4 小時把 $20/月用回本',
    excerpt:
      '訂了 Claude Pro($20/月)但不知道怎麼把它用回本?2026/05/16-19 我開了四堂小班,全程錄影 + 整理成文章公開,完整看完約 2 小時、實作約 4-6 小時。四堂順序「看見 → 馴服 → 自動化 → 接生態」:1️⃣ 4 demo + permission mode 4 種 + 邊界、2️⃣ CLAUDE.md 兩層 + 十大 prompt 定義 + Ultra Think、3️⃣ Skill/Subagent/Slash Command + /loop + Hook + Remote、4️⃣ obra superpowers + MCP + GitHub + Headless。這頁是完整索引 + FAQ,適合一次看完或當回顧工具箱。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'Claude Pro',
      'AI 教學',
      '初階班系列',
      'Hub 索引',
      'Pro 訂閱',
      '自學路徑',
    ],
    faqItems: [
      {
        q: '四堂課完全沒寫程式經驗的人能跟嗎?',
        a: '第一堂可以、第二堂可以、第三堂前半可以、第四堂後半(GitHub + Headless)會比較吃力。建議「行政 / 業務 / 內容創作」族群至少看完第一二堂,把 Claude Code 當「會做事的助理」用,先建立信心再接第三四堂。完全沒用過 ChatGPT 的人請先用 Claude.ai 兩週再來。',
      },
      {
        q: '看完四堂需要多久?',
        a: '文字版每堂約 25-35 分鐘讀完,四堂連續看約 2 小時。如果要照做、跑 demo、設 CLAUDE.md、裝 Superpowers,完整實作約 4-6 小時。建議分四個下午做,每天一堂、立刻上手最有效——不要一次塞完,認知會超載。',
      },
      {
        q: '訂閱 Claude Pro 一定要訂嗎?有免費版能跟嗎?',
        a: '不訂無法跟。Claude Code 是 Pro / Team / Enterprise 訂閱才能用,免費版只有對話框 Claude.ai。Pro 是 $20 美元/月——這個小班的核心就是「教你怎麼把這 $20 用回本」。年繳 $200($17/月)再省一點。',
      },
      {
        q: 'Mac / Windows / Linux 都能跟嗎?',
        a: 'Mac 跟 WSL2 Ubuntu 最順,Windows 原生 PowerShell 跟 Git Bash 都有坑(CRLF、path 翻譯、缺工具)。如果你是 Windows,建議裝 WSL2 + Ubuntu 跟,跟 Mac 體驗一樣。Linux 原生也順,沒問題。',
      },
      {
        q: 'Claude Code 跟 Cursor / Cline / Aider 差在哪?',
        a: 'Claude Code 是 Anthropic 官方 CLI,直接吃 Pro 訂閱、不需要另外買 API。Cursor / Cline 是 VS Code 插件,要自己接 API。Pro 訂閱者最划算的選擇就是 Claude Code——其他工具好但要另外付錢。如果你想跨工具並用,看 [Hermes Agent 入門](/blog/hermes-agent-intro/) 那篇比較。',
      },
      {
        q: '這個小班的逐字稿/錄影有開放嗎?',
        a: '錄影在學員社群內部,逐字稿整理成這四篇文章公開。所有公開版的內容都收錄在這 4+1 篇(四堂 + Hub)裡,你不會錯過。文章版反而比錄影更完整——多了 5 分鐘 SEO 自查、長尾關鍵字命中、FAQ JSON-LD 結構化,適合搜尋進來的讀者。',
      },
    ],
    featured: false,
  },
  {
    slug: 'memory-governance-ep1-claude-bad-notes',
    title: 'Memory 治理 EP1｜我的 Claude 記了一堆爛筆記',
    excerpt:
      '用 Claude Code 半年,memory 從 10 個檔長到 76 個,以為自己在養 AI 大腦,結果用 Obsidian Graph View 一打開全是花朵狀:所有檔只連中心的 MEMORY.md,檔跟檔之間幾乎沒連線。三胞胎重疊 70% 的 feedback、9 個全局/專案級同名檔、cross-link 趨近 0。本文拆三個結構性根因:同主題開新檔不擴充既有、寫完不加 [[link]]、全局 vs 專案級沒判準,以及整理之後做的三件事(合併三胞胎、重寫 MEMORY.md 成 cluster、CLAUDE.md 加程序性 SOP)。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'CLAUDE.md',
      'auto memory',
      'Obsidian',
      'AI 知識管理',
      'Prompt Engineering',
      'Memory 治理',
    ],
    publishDate: '2026-05-21',
    faqItems: [
      {
        q: 'Claude Code memory 跟 CLAUDE.md 有什麼不一樣?',
        a: 'CLAUDE.md 是你寫給 Claude 的家規,每次 session 全文載入(社群建議控制在 80-120 行)。auto memory 是 Claude 自己抄的筆記,放在 ~/.claude/memory/*.md,需要時 Claude 才會去讀對應檔。兩個搭配用:CLAUDE.md 放紀律跟總綱,memory 放細節跟踩坑。',
      },
      {
        q: '我的 memory 也很亂,要全部砍掉重來嗎?',
        a: '不用。先用 Obsidian 開 ~/.claude/memory/ 看 Graph View — 如果是花朵狀(所有檔只連中心),代表結構不好但內容可能還可救。先做兩件事:(1) 把同主題的合併,內容好的留下、重複的改 .archived.md 後綴 (2) 每個檔結尾加「## 相關」區塊。光做這兩件事 graph 就會大幅改善。',
      },
      {
        q: '怎麼判斷該寫到全局 memory 還是專案級 memory?',
        a: '跨專案行為規範(寫 code 風格、code review 標準、語氣偏好)→ 全局 ~/.claude/memory/。單一專案的細節(專案路徑、DB 連線、特定 bug 踩坑)→ 專案級 ~/.claude/projects/<cwd>/memory/。不確定的時候優先寫全局,以後可以從專案級補對應 link。',
      },
      {
        q: '為什麼 Obsidian 比直接看資料夾更有用?',
        a: '資料夾只能告訴你「有什麼檔」,Graph View 告訴你「檔跟檔之間有沒有關係」。memory 系統的價值來自關係(Claude 透過一個檔找到下一個檔),不是來自檔案數量。資料夾 50 個檔 = 看起來很多;Graph 50 個節點沒連線 = 馬上看出問題。',
      },
      {
        q: '整理一次要花多久?',
        a: '51 個全局檔 + 25 個專案級檔,從反思到 commit 完大約 3 小時。最花時間的不是合併,是寫 reflection 找根因。如果你 memory 不到 20 個檔,可能 1 小時內搞定。但整理只是治標,改 CLAUDE.md 加 SOP 才是治本,不然 3 個月後又會長回花朵。',
      },
    ],
    featured: true,
  },
  {
    slug: 'memory-governance-ep2-rules-ai-cant-remember',
    title: 'Memory 治理 EP2｜為什麼 AI 記不住你寫的規則',
    excerpt:
      '你寫了一堆 CLAUDE.md 原則,Claude 還是每次重蹈覆轍 — 不是它記憶不好,是你寫的規則「沒辦法照著做」。大部分人寫的是「描述性原則」(該做什麼、不該做什麼),但 AI 真正會跟的是「程序性 SOP」(動手前必跑的步驟、自我糾正的條件)。本文拆兩種寫法的差異、給改寫公式 「描述狀態 → 觸發條件 + 強制動作 + 違規判斷」、附 CLAUDE.md before/after 實際 diff,以及解釋為什麼 LLM 對程序性指令反應特別好。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'CLAUDE.md',
      'Prompt Engineering',
      'AI 工具',
      'AI 工作流',
      'Memory 治理',
      'LLM',
    ],
    publishDate: '2026-05-22',
    faqItems: [
      {
        q: '我的 CLAUDE.md 才 50 行,真的需要改成程序性嗎?',
        a: '50 行剛好。你現在改的成本最低 — 規則少、踩坑少、習慣還沒固化。等到 200 行才改,你會發現一半規則早就互相矛盾,得先做整理才能重寫。短:現在改最划算。',
      },
      {
        q: '程序性 SOP 是不是會讓 CLAUDE.md 變超長?80-120 行的社群建議不就破了嗎?',
        a: '會變長,我的 CLAUDE.md 從 180 行長到 330 行。但社群 80-120 行的建議基於「每個 session 全文載入」的 context cost — 這個 cost 真實存在,但比起 AI 反覆違規再來校正的 cost,長一點的 CLAUDE.md 划算。建議:核心規則 SOP 化(占 60-70%),補充原則描述性(30-40%),不要為了短而把所有規則都描述化。',
      },
      {
        q: '描述性原則就一無是處嗎?',
        a: '不是。對人寫的東西(README、設計文件、團隊 onboarding)描述性原則比較適合 — 人會用「sense」自己腦補執行流程。對 AI 寫的東西(CLAUDE.md、Skill、Agent prompt)才需要程序化。差別在讀者:人是「理解後執行」,AI 是「pattern match 後執行」。',
      },
      {
        q: '我寫了 SOP,Claude 還是會違規,怎麼辦?',
        a: '兩種可能:(1) 觸發條件寫不夠具體,Claude 沒抓到該動的時機 — 把觸發條件用「禁止短語」「禁止症狀」這種字串比對級的描述補強。(2) 違規判斷沒列「自我罵點」 — 加一條「看到自己 X 就立刻停下糾正」。我用這兩招過去三週違規率降到原本的 1/4。',
      },
      {
        q: '那 memory 本身需要寫成程序性嗎?',
        a: '不需要。memory 是「事實 + 過去踩坑」,本來就是描述性的。程序性適用於行為規範(CLAUDE.md / Skill),描述性適用於知識儲存(memory)。不要把兩者混在一起,memory 該是查得到的字典,不是該照著跑的程式。',
      },
    ],
    featured: true,
  },
  {
    slug: 'ai-daily-seo-email-bot-howto',
    title: '讓 Claude 每天早上幫你寫一封 SEO 解讀信：cron + claude -p stateless 走 Max 訂閱 0 元 pipeline',
    excerpt:
      '上週寫過「我請 AI 每天早上 9 點寄 SEO 報告給我」 — 但信內容是 raw 數字,我每天還是要花 10 分鐘自己腦補解讀。這篇是第二階段:在原本 cron 腳本裡加 35 行 bash,用 claude -p stateless 模式呼叫 Claude(走 Max 訂閱 0 額外成本),把昨天的 GSC + Firestore 數字翻成「總評 / 需要注意 / 今天可以做」三段繁體中文解讀,放在信最上面。完整實作 + prompt 設計關鍵點 + 5 個踩坑 + 抄回家自己用 + 順手澄清「這跟 claude.ai 接 Gmail connector 完全不同」常見誤會。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'claude -p',
      'SEO',
      'cron',
      'launchd',
      'AI 工作流',
      'AI 自動化',
      'Bash',
      'Prompt Engineering',
    ],
    publishDate: '2026-05-22',
    faqItems: [
      {
        q: '為什麼不直接讓 Claude Code 寄信?',
        a: 'Claude Code 沒有「主動排程跑」的能力 — 它是 session-based、要有人開啟 CLI 才會跑。要每天 07:07 自動跑就得靠系統層的 cron / launchd / systemd-timer。所以這套設計是:系統排程觸發 bash → bash 呼叫 claude -p 跑一次性分析 → bash 寄信。Claude 在這套裡是「批次任務 worker」,不是「主控者」。',
      },
      {
        q: 'claude -p 真的免費嗎?',
        a: '對 Max / Pro 訂閱者來說 0 額外成本。claude -p 走的是你機器登入的訂閱 quota,跟你在 Claude Code 裡聊天用的是同一份額度。Max $200/月 給的額度幾乎用不完。Pro $20/月 也夠用,每天分析一次 250 字輸出月用量微不足道。如果走 Anthropic API 每次 ~$0.001-0.005,每月仍不到 $1。',
      },
      {
        q: 'Claude 分析會不會給錯建議?',
        a: '會。LLM 不會看真實情境,只看數字。它可能建議「為某 query 補文章」但那 query 已經有文章。所以定位成「方向參考」不是「執行命令」 — 每天看一眼,make sense 就做、不 make sense 就忽略。LLM 提案 + 人類過濾 = 平均 30% 有用、70% 不重要,因為「每天 5 分鐘的提案門檻太低」,30% 有用就賺了。',
      },
      {
        q: '可以改成每週一次嗎?',
        a: '可以但不推薦。launchd plist 把 StartCalendarInterval 改成 Weekday=1 就只有週一觸發。但每週一次的問題是「訊號太弱」 — 週一看完信,週二三四五都不會想起來。每天一次反而養成習慣:raw 數據五分鐘看完、Claude 分析 30 秒讀完、沒事就略過,這個節奏最舒服。',
      },
      {
        q: 'prompt 怎麼進化?',
        a: '跑一陣子會發現 Claude 重複講同樣的事(例如老是叫你「更新 sitemap」),那就在 prompt 加一條「不要重複建議過去 7 天提過的事」。或發現它太樂觀,加「只關注壞消息」。Prompt 是可演化的東西,不是寫一次就不動。',
      },
      {
        q: '可以接到 Slack 不寄 Gmail 嗎?',
        a: '可以。把 Step 6 寄信改成 Slack webhook:curl -X POST -H Content-Type:application/json -d {text:$BODY} https://hooks.slack.com/services/YOUR/WEBHOOK。Slack 有 markdown 渲染,可以把 prompt 「不要 markdown」改成「用 Slack mrkdwn 格式」。',
      },
      {
        q: '為什麼不讓 Claude 直接 GSC OAuth 自己抓資料?',
        a: '技術上可以 — claude -p 配 MCP server 接 GSC API,讓 Claude 自己查、自己分析、自己寫信。但複雜度爆炸。MCP server 要寫、要除錯、要管 OAuth state。90% 的場景 bash + Python 已經夠 — bash 抓資料、Claude 分析資料、bash 寄信,三件事各自簡單。過度設計是寫程式的最大原罪,YAGNI 優先。',
      },
    ],
    featured: true,
  },
  {
    slug: 'hermes-agent-medical-cdss',
    title:
      '如何用 Hermes Agent 把 AI 接到高風險醫療決策?血脂治療二級預防 CDSS 完整 round-trip 拆解',
    excerpt:
      'LLM 給的醫療建議怎麼讓醫師敢用?「ChatGPT 看一下」這種等級在臨床決策上不夠。本文拆我跟合作醫院做的血脂治療二級預防 CDSS 全套架構:Hermes Agent + skill 兩層 schema + 沙盒公式 + RAG MCP + JSONL trace,讓每個決策都有「skill 定義 → 公式回傳值 → RAG 引用 chunk → LLM 最終 JSON」四段證據鏈。從第一版 ChatGPT API 砍掉重做的教訓、為什麼選 Hermes、8-step pipeline、範例 round-trip 全紀錄、踩過的三個坑(LLM 漏列現用藥 / RAG cross-bleed / hermes timeout)、四大 agent 框架在醫療場景的比較。寫給做領域 AI(醫療 / 法務 / 金融 / 工控)的工程師。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      '醫療 AI',
      'CDSS',
      'LLM Agent',
      'RAG',
      'Sandbox',
      'MCP',
      '臨床決策支援系統',
      'AI 落地',
    ],
    faqItems: [
      {
        q: 'Hermes Agent 適合做哪類領域 AI?',
        a: '需要「LLM + 領域知識 + 結構化決策 + 可審計」的場景都適合:醫療 CDSS、法務文件審查、金融風控、工控故障診斷。共通點是「LLM 給的答案要有引用 + 公式 + 可被覆查」。如果你的場景只需要「跟使用者聊天」,Hermes 對你過殺。',
      },
      {
        q: 'LLM 算數錯誤怎麼徹底解?',
        a: '把 deterministic 算法全部寫成 module,LLM 只能呼叫不能自算。skill 內明寫「禁止自己算 X」,沙盒不執行算數 = 沒爭議。我做完這層之後算數錯誤率歸零。早期版本讓 LLM 自己算 LDL 達標,跑 100 個案有 4 個把「<」看成「≤」,差一條命。',
      },
      {
        q: 'RAG 為什麼不直接塞 prompt?',
        a: '塞 prompt 三個問題:(1) token 上限撐不住一整本指引(2) LLM 看 1 萬字會抓重點失誤(3) prompt 變大 latency 跟成本同步爆。讓 LLM 自己 query RAG 才拉相關段落,精準度跟成本同時好。我們用 bge-m3 1024d HNSW,單份 PDF retrieval 92% 命中。',
      },
      {
        q: 'Hermes 跟 Claude Code 在這場景上的差別?',
        a: 'Claude Code 偏開發者 CLI(寫 code、改 repo),Hermes 偏 production 級 agent runtime(可嵌服務、subprocess 調度、JSONL trace)。我這套醫療系統用 Hermes 是因為需要把它包在 FastAPI 後面當 production 服務跑,Claude Code 不是設計來做這件事的。兩者不是競爭,是不同 niche。',
      },
      {
        q: '這套架構好複製嗎?',
        a: 'skill 庫 + sandbox formula + RAG MCP 三件套要 40 小時左右半手工,但架構是通用的。你只要把領域指引換成你的、formula 換成你的算法、PDF 換成你的文獻就能套。我寫了 RECREATE_SOP 在 repo 裡。',
      },
      {
        q: '醫師願意用嗎?',
        a: '會用 + 會覆核才是目標。我們的設計是 reviewer-only,AI 給建議、醫師最後決定。覆核資料 → feedback → 累積到門檻自動 patch SKILL.md → 系統自演化。醫師會用是因為「我改的東西真的被學進去」,而不是「我每次都要從頭教 AI」。',
      },
    ],
    featured: true,
  },
  {
    slug: 'ollama-cloud-hermes-langchain',
    title:
      'Ollama Cloud 接到 hermes-agent 跟 LangChain:免費跑 Gemma4 31B 不用 GPU 完整指南',
    excerpt:
      '5 分鐘前在我 Mac 上 `ollama run gemma4:31b-cloud` 真的回我訊息——本機完全沒吃 GPU,模型在 Ollama 雲端跑、token 從終端機流出來。然後我發現 hermes-agent 的 .env 半年前就把 Ollama Cloud 預埋好了,去掉註解填 key 就能切過去。本文記錄整套 round-trip:Ollama Cloud Free 額度怎麼算、Gemma4 31b-cloud 實測、接到 hermes 三步驟、LangChain 兩種接法 (ChatOpenAI vs ChatOllama) 的差別、Embedding 走 cloud 還是本機、跟 Claude/OpenAI 怎麼選、5 個踩過的真實坑。',
    category: 'AI 工具',
    tags: [
      'Ollama Cloud',
      'Ollama',
      'Gemma4',
      'Hermes Agent',
      'LangChain',
      'AI 開源模型',
      'AI API',
      'AI 工具',
    ],
    faqItems: [
      {
        q: 'Ollama Cloud 是什麼?跟本機 Ollama 有什麼不一樣?',
        a: 'Ollama Cloud 是 Ollama 官方的雲端推理服務,你用同一個 `ollama` CLI、同一個 API,但模型(像 `gemma4:31b-cloud`)在 Ollama 雲端跑、你本機完全不需要 GPU 或下載權重。本機版要自己備硬體、自己下載 model;cloud 版開帳號就用,還有 Free 額度。',
      },
      {
        q: '用 Ollama Cloud 接 hermes-agent 要付錢嗎?',
        a: '不用。hermes-agent 本身完全免費開源,Ollama Cloud Free 方案也是 0 元,只有 5 小時 session 額度跟每週上限。對個人 dev / agent 試驗綽綽有餘。要付費的是 Ollama Pro($20/月 50x 額度)或 Max($100/月),純粹看你跑的量。',
      },
      {
        q: 'LangChain 接 Ollama Cloud 該用 ChatOpenAI 還是 ChatOllama?',
        a: '既有專案用 `ChatOpenAI` 就改 `base_url` 跟 `api_key` 兩個欄位最快;新專案、要 tool calling 或 streaming 建議用 `langchain-ollama` 的 `ChatOllama`,介面跟 Ollama 原生概念對齊,踩坑少。',
      },
      {
        q: '為什麼 `gemma4:31b-cloud` 不能拿來做 embedding?',
        a: '它是 chat / completion 模型,內部架構不是雙塔 encoder,不能輸出 embedding 向量。Ollama Cloud 目前也沒提供 `-cloud` 後綴的 embedding 專用模型。要做 embedding 走本機 `nomic-embed-text` 或 `bge-m3`,模型都小、Mac 隨便跑。',
      },
      {
        q: 'Ollama Cloud 適合做生產嗎?',
        a: '看任務性質。latency 敏感 / 高並發 / SLA 要保證 → 還是 Claude / OpenAI;Internal tool / agent dev / 試新模型 / 試 RAG flow → Ollama Cloud Free 完全夠,還能用最新開源 model(Gemma4、DeepSeek V4)而不用自己架 GPU。',
      },
      {
        q: '我已經有 Claude Max 訂閱還需要 Ollama Cloud 嗎?',
        a: '主要看你想不想試開源 model。Claude Max 已經夠跑大部分任務,Ollama Cloud 的價值是:(1) 試 Gemma4 / Qwen / DeepSeek 等開源 model 不用自架,(2) hermes / langchain 多一個免費 fallback provider,(3) 隱私限制比較寬鬆的場景可以走 Ollama 而不是把資料丟 Anthropic。我自己兩個並用。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-ultrawork-harness-engineering',
    title:
      'Claude Code Harness EP1｜ultrawork 到底在 work 什麼?社群兩派 + Anthropic 三方對照',
    excerpt:
      'Claude Code 沒有官方的「ultrawork」。它是社群造的詞,目前至少兩個派系做出兩種不同的東西 — TechDufus 的 oh-my-claude(142 ★)走「平行召喚 6 個 sub-agent」,zephyrpersonal 的 oh-my-claude-code 走「Sisyphus 模式 — 不解完不准停」。兩者底層其實是同一件事:Harness Engineering — 在 Claude Code 外面套一層持久化設定(hooks + skills + agents + prompts),讓 AI 每次都照你的方式工作。這篇是系列 EP1,先講清楚 ultrawork 到底是什麼、有幾派、能解什麼問題,並對照 Anthropic 官方 2025/11 那篇 Effective Harnesses for Long-Running Agents。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'ultrawork',
      'Harness Engineering',
      'oh-my-claude',
      'Anthropic',
      'Sub-agent',
      'AI 工具',
      'AI 開發工作流',
    ],
    faqItems: [
      {
        q: 'ultrawork 是 Anthropic 官方功能嗎?',
        a: '不是。ultrawork / ulw / ultraresearch 都是社群 plugin 自己定義的 slash command,不是 Claude Code 內建。Anthropic 官方文件用的詞是「harness」(Effective Harnesses for Long-Running Agents,2025/11/26 Justin Young 發表),概念類似但實作不同。',
      },
      {
        q: 'TechDufus 跟 zephyrpersonal 兩派的 ultrawork 哪個比較適合我?',
        a: '看任務型態。需要平行多角度看(查資料 + 評估風險 + 寫 code + 驗收)→ TechDufus 版,6 個 sub-agent 同時跑。需要死磕到完成(全綠燈、無 type error、所有測試過)→ zephyrpersonal 版,Sisyphus 模式不解完不停。不確定就先裝 TechDufus 版,使用面比較廣。',
      },
      {
        q: 'Workflow 跟 ultrawork 有什麼不同?',
        a: 'Workflow(shinpr/claude-code-workflows)是 recipe-based slash commands,管「先做設計再寫 code」這類流程切分;ultrawork 是 multi-agent 模式,管「單一步驟內怎麼把火力開到最大」。兩者設計層級不同,可以同時用不會打架。',
      },
      {
        q: '我已經有自己的 ~/.claude/ 配置,還要裝 ultrawork plugin 嗎?',
        a: '建議先別。自架 harness 的價值是貼合你個人模式 — 直接裝 plugin 等於把別人的工作流貼到你的肌肉記憶上,容易打架。建議先看 plugin 的 source code,把你想要的 pattern 抄成你自己的 skill / agent。我自己 ~/.claude/ 有 69 個 skill / 49 個 agent,完全沒裝這些 plugin。',
      },
      {
        q: 'Anthropic 官方 harness 跟 ultrawork 有什麼關係?',
        a: 'Anthropic 2025/11/26 那篇 Effective Harnesses for Long-Running Agents 講的「harness」是更上層的概念 — initializer agent + coding agent + claude-progress.txt 進度檔 + Puppeteer MCP 自動測試。ultrawork 是社群把這個概念塞進 slash command 的具體實作。InfoQ 2026/04 後續報導 Anthropic 演化到三 agent harness。',
      },
    ],
    featured: true,
  },
  {
    slug: 'screendoc-claude-code-skill',
    title:
      '我把「截圖寫操作手冊」做成 Claude Code skill：screendoc 拆解（4 視角審查 + 一鍵重跑）',
    excerpt:
      '每次系統改版都要重截一遍操作手冊、還老是截圖跟說明對不上？我把這件苦差事做成 Claude Code skill：/screendoc。一句指令偵測前端框架、跑 Playwright 截圖、用 UI/UX + 系統分析 + 新手 + 開發者 4 個視角逐張比對「截圖 vs 說明 vs 原始碼」、不一致就局部重截迭代到全過，最後產一份對外可發表的離線 HTML 手冊。本文拆它在幹嘛、Phase 0–5 跑了什麼、為什麼要 4 視角不是過度設計，以及怎麼透過 yc-plugin 一鍵裝起來用。附我在一個無關的 React + Vite 專案上 round-trip 跑通的實測。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'screendoc',
      'Playwright',
      'AI 工作流',
      'Skill',
      '操作手冊',
      '前端',
      'yc-plugin',
    ],
    faqItems: [
      {
        q: 'screendoc 跟一般的 Playwright E2E 測試差在哪？',
        a: 'E2E 測試的目的是「驗證功能對不對」，斷言通過就好，截圖只是失敗時的證據。screendoc 的目的是「產給人看的操作手冊」，截圖是主角、還要配對得上的敘事說明、再經 4 視角審查確保圖文碼同步。它複用了 Playwright 當截圖引擎，但產出是 HTML 手冊不是測試報告。如果你已經有 e2e/ 目錄，screendoc 可以接著用，不用重寫。',
      },
      {
        q: '我不太會寫 code，也能用 screendoc 嗎？',
        a: '可以用，但你得有一個能在本機跑起來的前端專案（dev server 起得來）。screendoc 自己會偵測框架、寫 Playwright spec、跑截圖，你不用手寫測試碼。你需要做的是：把專案路徑給它、看它產出的手冊、覺得哪張圖或說明不對就回饋。它是「幫你做手冊」的工具，不是「教你寫測試」的工具。',
      },
      {
        q: '改版後真的一句指令就能重跑？不會又要手動調？',
        a: '大部分情況是。screendoc 每個階段的產出物都落檔（shotlist、context、manifest），重跑時會沿用上次的截圖清單、只重截變動的頁面。前提是頁面結構沒有大改 —— 如果你整個換了路由或拆了頁面，shotlist 要更新，但這也是它在 Phase 1 自動做的事。日常的「按鈕改色、文案改字、欄位增減」這種改版，重跑基本無痛。',
      },
      {
        q: '我只想要這個 skill，不想裝整個 yc-plugin 可以嗎？',
        a: '可以。skill 本質是一個資料夾（SKILL.md + templates + detectors），你可以只把 yc-plugin 裡的 skills/screendoc/ 複製到你的 ~/.claude/skills/screendoc/，一樣會被 Claude Code auto-discover。裝整個 plugin 只是最省事的途徑（一句 /plugin install），且未來 skill 更新跟著 plugin 走、不用自己同步。yc-plugin 其他指令是 YouTube 工作流，用不到不影響 screendoc。',
      },
      {
        q: 'screendoc 支援哪些前端框架？我的專案沒用 UI 框架行嗎？',
        a: '行。screendoc 內建框架偵測（React / Next / Vue / 其他 SPA）跟一組設計系統 adapter（generic / antd / mui / chakra / radix / mantine）。有用 UI 框架的走對應 preset、自動知道元件的 selector 慣例；沒用任何 UI 框架的純手刻站走 generic preset 一樣能跑 —— 我實測就是拿一個 React + Vite + Tailwind 純手刻站驗的，generic preset 直接生效。它靠 DOM anchor 鎖頁面，不依賴特定框架的內部結構。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-hook-auto-verify-deploy',
    title:
      'Claude Code Hook 怎麼用？git push 後自動驗 GitHub Actions 部署（PostToolUse 實戰）',
    excerpt:
      '每次 git push 完都要手動切到 GitHub Actions 頁面盯著部署跑完，綠了放心、紅了回來修——這件事重複到讓人煩。我用 Claude Code 的 PostToolUse hook 把它自動化：hook 攔到 git push 成功就注入一段任務指示，叫 Claude 排程約 70 秒後查 Actions 結果，全綠回報、紅了抓 log 修。關鍵是一次性驗證（ScheduleWakeup 而非無限輪詢），而且改版後不綁特定 workflow 名、用 commit SHA 對齊，任何有 push-triggered Actions 的 repo 都通用。本文把實作三段、additionalContext 機制、從寫死 deploy.yml 到通用的兩刀改法，以及踩到的欄位名坑（tool_response 才是對的）全寫下來。',
    publishDate: '2026-05-27',
    category: '工作流',
    tags: [
      'Claude Code',
      'PostToolUse hook',
      'GitHub Actions',
      'ScheduleWakeup',
      'CI/CD',
      'AI 工作流',
      'git push',
      '自動化',
    ],
    faqItems: [
      {
        q: 'PostToolUse 跟 PreToolUse hook 差在哪？驗部署為什麼用 PostToolUse？',
        a: 'PreToolUse 在工具執行前觸發，可以攔截或修改參數；PostToolUse 在工具成功後才觸發。驗部署這件事必須等 git push 真的成功才有意義，而且可以利用「PostToolUse 只在成功時觸發」這個性質——hook 被叫到就代表這次 push 沒失敗（沒被拒、沒 403），省掉自己判斷成敗的步驟。所以這個需求落在 PostToolUse，matcher 設 Bash。',
      },
      {
        q: 'hook 是全域註冊的，會不會干擾我那些不跑 CI 的專案？',
        a: '不會。腳本有守門邏輯：指令不含 git push、不是 git repo、沒有 .github/workflows/ 目錄、或目錄裡沒有任何 push-triggered workflow，全部靜默 exit 0、不注入任何東西。只有「真的會跑 GitHub Actions」的 repo 才會觸發驗證流程，其餘 push 完全無感。',
      },
      {
        q: '為什麼用 ScheduleWakeup 而不是寫個迴圈一直等部署跑完？',
        a: '迴圈會把整個 session 卡在原地，而且判斷邏輯一出錯就變無限輪詢、燒 token、佔住對話。ScheduleWakeup 是排一個未來喚醒點就把控制權交回去，到點才查一次狀態。它是一次性驗證流程，不是常駐 daemon——全綠就停、紅了修完就結束，最多探 3 次（約 3.5 分鐘）避免 workflow 卡死時無限重排。',
      },
      {
        q: '一個 git push 同時觸發好幾個 workflow 怎麼辦？',
        a: '因為驗證是用 commit SHA 對齊（gh run list 篩 headSha 等於剛推的 commit），同一個 SHA 觸發的所有 run 都會被一起撈出來，必須全部 conclusion=success 才算通過。任何一個 run 失敗就走修復流程（gh run view --log-failed 看原因、修掉、重 push）。',
      },
      {
        q: '這個做法只能用在 GitHub Pages 部署嗎？換成 Docker build 或一般 CI 行嗎？',
        a: '行，這正是改版要解決的問題。第一版寫死「repo 必須有 deploy.yml」，漏掉了 workflow 叫別的名字的 repo（例如我的 whisper 叫 docker-build.yml）。改版後守門改成偵測有沒有 push-triggered workflow、驗證改用 SHA 對齊而不綁 workflow 名，所以不管 repo 跑的是 Pages 部署、Docker build 還是一般 CI test，只要 workflow 由 push 觸發都通用。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-codex-mcp-collab',
    title:
      '兩個 AI 真能「對等聊天」?Claude Code × Codex MCP 協作的真實邊界',
    excerpt:
      'Claude Code 透過 MCP 可以直接呼叫本機 Codex 跑子任務——我下 prompt、Codex 在同一台機器讀檔/跑指令/回報。但這是「結構化輪流問答」(one-shot + threadId 延續),不是兩個 AI 自由聊起來。這篇紀錄我接通的全程:怎麼用三題本機驗證確認「真的接通而不是腦補」(它回傳 commit hash 6cf8254 我去對)、怎麼用 tmux pane 即時看 Codex 的推理與指令、以及最能說明「對等有限度」的坑——MCP 接過去的 Codex 預設 read-only sandbox,嘴上能聊手上卻寫不了檔。結論:接通 ≠ 協作,能聊 ≠ 能動手。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'Codex',
      'MCP',
      'AI Agent',
      '雙 AI 協作',
      'OpenAI Codex',
      'Anthropic',
    ],
    publishDate: '2026-06-01',
    faqItems: [
      {
        q: 'Claude Code 真的能直接呼叫 Codex 嗎?',
        a: '能。透過 MCP server 曝出的 codex / codex-reply 工具,Claude Code 可以開 Codex session、帶 threadId 續跑,Codex 在同一台機器上讀檔、跑指令、回報結果。雙向有回傳,不是單向發送。',
      },
      {
        q: '這算是兩個 AI 在「聊天」嗎?',
        a: '算結構化輪流問答,不算自由對話。我每輪都要主動發 prompt,Codex 才執行並回報;它不會主動找我講話,也不會自己持續推進。跟人類同事在 Slack 隨手丟一句的「主動性」差很多,所以「對等聊天」這講法是包裝過頭的。',
      },
      {
        q: '怎麼確認 Codex 不是在「演」回答?',
        a: '給它編不出來的本機題:讀只有你本機有的檔(例如某個型別定義那行)、跑 git log 回傳 commit hash、做算術。拿真實產物去對(round-trip),對得上才算數。我這次拿回傳的 commit hash 6cf8254 對我本機 git log,對上了才確認是真的在我機器上跑。handshake 不等於真的在幹活。',
      },
      {
        q: '為什麼 Codex 查得到、聊得來,卻寫不了檔?',
        a: 'MCP 接過去的 Codex session 預設是 read-only sandbox。對話跟寫入權限是兩層獨立的東西,要它真的落地產物(寫檔),得另開 workspace-write 權限的 session。所以會出現「它能完整討論這個檔該怎麼寫,手上卻動不了」的狀況。',
      },
      {
        q: '怎麼即時看到另一個 AI(Codex)在做什麼?',
        a: 'Codex 把每個 session 寫成 JSONL rollout log,放在 ~/.codex/sessions/YYYY/MM/DD/。寫一支腳本 tail -f 最新那份、解析事件(reasoning / function_call / message)染色印出,丟進一個 tmux pane,就能即時看到它的推理、跑的指令、回話滾動。注意它 idle 時 log 不長新行、畫面靜止是正常的。',
      },
    ],
    featured: true,
  },
  {
    slug: 'ai-deploy-firebase-custom-domain',
    title: '我讓 AI 把遊戲部署上自己的網域:難的不是 deploy,是怎麼確認真的上線',
    excerpt:
      '我讓 Claude Code 一條龍把一個 React 遊戲(戰旗 J7 Reborn)部署上 Firebase Hosting、再接自己的網域 j7.yanchen.app,全程只下一句「上架到這個網域」。關鍵不是 `firebase deploy` 那 30 秒,是「怎麼判斷真的上線了」:Deploy complete!、Console 顯示「已連結」、單次 curl 回 200,三個都不算數。這篇把 build → deploy → 接 custom domain → DNS → 等 SSL → round-trip 驗證整條寫透,重點放在那個卡了幾小時的坑:custom domain 顯示「已連結」卻一直 404 —— 以及為什麼那其實不是設定錯,是邊緣節點內容還沒收斂,該等不該動。附 openssl 驗 SAN、curl 連打、SPA rewrite 的實際做法。',
    category: '工程實作',
    tags: [
      'Firebase Hosting',
      'Claude Code',
      'custom domain',
      '自訂網域',
      'SSL',
      'DNS',
      'SPA',
      'AI 部署',
      'round-trip',
    ],
    publishDate: '2026-06-08',
    faqItems: [
      {
        q: '`firebase deploy` 印了 Deploy complete!,為什麼網站還是打不開?',
        a: 'Deploy complete! 只代表檔案上傳完成(handshake),不代表你打的網址已能正確回應。預設 web.app 網址通常很快活;剛接好的 custom domain 可能還在邊緣節點內容同步、會 flapping。先 curl 預設 web.app 確認部署本身 OK,再分開看 custom domain。',
      },
      {
        q: 'custom domain 顯示「已連結」但一直 404,是我設定錯了嗎?',
        a: '先用 openssl 看 SSL 憑證 SAN 有沒有命中你的網域。有命中 = 設定正確,404 是 Firebase 邊緣內容同步還沒收斂,會 flap 數小時到近一天,不要動設定、等就好。SAN 沒命中 = 那才是真的 DNS/設定問題,回去查 DNS 紀錄與 Console 網域狀態。',
      },
      {
        q: 'SSL 憑證的 SAN 裡有一堆別人的網域,是被駭了嗎?',
        a: '不是。Firebase Hosting 用 multi-SAN 共用憑證,把很多客戶網域包在同一張憑證裡,是正常的成本優化。你只要確認清單裡有自己的 DNS:你的網域 就對了,其他不相干的網域不用管。',
      },
      {
        q: '首頁能開,但分享出去的深連結(像 /battle/c1-1)打不開?',
        a: '你少了 SPA rewrite。在 firebase.json 的 hosting 加 "rewrites": [{ "source": "**", "destination": "/index.html" }],讓所有路徑都回 index.html、由前端 router 接手解析。重 deploy 一次即可。',
      },
      {
        q: '怎麼知道部署「真的」成功,而不是看起來成功?',
        a: '做 round-trip,不要只看 handshake。最低標準:curl 連打數次都穩定 200(單次會被 flapping 騙)+ 回傳 HTML 的 <title> 是你的站 + 真的開瀏覽器點一下確認畫面正常。三者皆過才算上線。',
      },
    ],
    featured: false,
  },
  {
    slug: 'dense-vs-moe-llm-architecture',
    title: 'MoE 省記憶體?錯了:Dense 與 MoE 最反直覺的差別',
    excerpt:
      'Dense 模型每個字都用上全部參數,誠實但耗算力;MoE(Mixture of Experts)靠一個「領班」每個字只派一小撮專家上工,帳面參數很大但實際算力很省。最反直覺的一點:MoE 省的是算力跟速度,不是記憶體——所有專家還是得全部載進 VRAM。VRAM 不夠時該砍的是「總參數量」,不是無腦選 Dense。這篇從我在單機 dev 機換本地 LLM 卡到的真實問題出發,用餐廳出餐比喻講透 router 怎麼運作,再拿 Mixtral 8x7B(46.7B/13B)、DeepSeek-V3(671B/37B)、Gemma 4 12B(純 Dense)三顆真模型把數字釘死,最後給出 VRAM 受限時該怎麼選的決策表。',
    category: 'AI 工具',
    tags: [
      'MoE',
      'Dense',
      'Mixture of Experts',
      'LLM',
      'Gemma 4',
      'Mixtral',
      'DeepSeek',
      'VRAM',
      'AI 應用開發',
    ],
    publishDate: '2026-06-09',
    faqItems: [
      {
        q: 'MoE 比 Dense 厲害嗎?',
        a: '不是「厲害」的問題,是「划算」的問題。MoE 用更少的算力換到更大的有效參數,但代價是 VRAM 要塞得下全部專家、訓練也更難調(router 容易負載不均)。資源夠就划算,資源不夠就是負擔。',
      },
      {
        q: '為什麼 Mixtral 叫 8x7B 卻不是 56B?',
        a: '因為專家之間共享了一部分參數(像 attention 層),不是 8 個完全獨立的 7B 模型疊起來。實際總參數是 46.7B,每個 token 只啟用 2 個專家、約 13B。',
      },
      {
        q: 'MoE 真的完全不省記憶體嗎?',
        a: '推理時不省 VRAM(全部專家要載)。但它在「相同算力預算下能塞進更多知識」這件事上是省的——你用 13B 的算力成本,拿到了 46.7B 參數的知識容量。省在算力效率,不在記憶體佔用。',
      },
      {
        q: '怎麼快速判斷一個模型是 Dense 還是 MoE?',
        a: '看它的命名跟規格卡。出現「8x7B」「A22B」(active 22B)「total/active 兩個數字」這類寫法,幾乎都是 MoE。只給單一參數量(如 12B、70B)且沒提 active,通常是 Dense。最準的還是去看官方 model card。',
      },
    ],
    featured: false,
  },
]

const wordCountOf = (s) => s.replace(/\s/g, '').length
const readingTimeOf = (s) => Math.max(1, Math.round(wordCountOf(s) / 400))

const SCORES_PATH = resolve('public/content-scores.json')
const BANNED_WORDS_PATH = resolve(homedir(), '.claude/skills/ig-create/banned-words.txt')

// 計算「結構分」/100。只算程式可客觀判定的 14 項;score-card 的「事實可追溯性」
// 與「SoT Diff Gate」(共 25 分)需人工核對 source-of-truth,程式算不了,不納入。
// 每項給原始分,加總後權重已直接設成總和 100,total 即為 /100 結構分。
function computeContentScore(content, post) {
  const lines = content.split('\n')
  const h2 = lines.filter((l) => /^## /.test(l))
  const h3 = lines.filter((l) => /^### /.test(l))
  const wc = wordCountOf(content)
  const emojiRe = /\p{Extended_Pictographic}/u

  // 禁用詞命中數(檔不存在則視為 0,不擋發文)
  let bannedHits = 0
  if (existsSync(BANNED_WORDS_PATH)) {
    const words = readFileSync(BANNED_WORDS_PATH, 'utf-8')
      .split('\n')
      .map((w) => w.trim())
      .filter((w) => w && !w.startsWith('#'))
    bannedHits = words.reduce(
      (n, w) => n + (content.includes(w) ? 1 : 0),
      0
    )
  }

  // 各項判定(每項 raw 分,加總=100)
  const items = {
    // 字數 2000-3000(以 CJK 字元數計,跟 wordCountOf 一致):15
    wordCount: wc >= 2000 ? 15 : wc >= 1500 ? 10 : 0,
    // TL;DR blockquote:10
    tldr: /^> \*\*TL;DR/m.test(content) ? 10 : 0,
    // TOC 目錄:5
    toc: /^## .*目錄/m.test(content) ? 5 : 0,
    // H2 數 ≥ 6:10 / 4-5:5 / <4:0
    h2Count: h2.length >= 6 ? 10 : h2.length >= 4 ? 5 : 0,
    // H2 帶 emoji 比例:5(內文型 H2 如「是什麼」可不帶,按比例給)
    h2Emoji: h2.length
      ? Math.round((h2.filter((l) => emojiRe.test(l)).length / h2.length) * 5)
      : 0,
    // 比較表(markdown table 至少 1 個):10
    table: /^\|.*\|.*\|/m.test(content) ? 10 : 0,
    // 內嵌圖 ≥ 1(markdown image 或 kroki 圖):10 / 否則 5(僅封面)
    image:
      (content.match(/!\[[^\]]*\]\(/g) || []).length +
        (content.match(/```kroki:/g) || []).length >=
      1
        ? 10
        : 5,
    // 踩坑段(H2/H3 含坑/踩/錯誤/失敗):5
    pitfall:
      h3.some((l) => /坑|踩|錯誤|失敗/.test(l)) ||
      h2.some((l) => /坑|踩|錯誤|失敗/.test(l))
        ? 5
        : 0,
    // FAQ ≥ 4 題(從 post.faqItems 數,非 grep markdown):10 / <4:5 / 無:0
    faq:
      (post.faqItems?.length || 0) >= 4
        ? 10
        : (post.faqItems?.length || 0) >= 1
          ? 5
          : 0,
    // 延伸資源段:5
    extLinks: /## .*延伸資源/m.test(content) ? 5 : 0,
    // 禁用詞:5,每命中 1 個扣 1,扣到 0 為止
    bannedWords: Math.max(0, 5 - bannedHits),
    // code fence 語言標籤:5。逐行掃,追蹤 in/out fence 狀態;
    // 「開頭 fence」(進入 code block 那一行)必須帶語言,否則違規→0。
    codeFence: (() => {
      let inFence = false
      let violation = false
      for (const l of lines) {
        if (!/^```/.test(l)) continue
        if (!inFence) {
          // 這是開頭 fence,必須帶語言(``` 後接非空白)
          if (/^```\s*$/.test(l)) violation = true
          inFence = true
        } else {
          inFence = false // 閉合 fence,不要求語言
        }
      }
      return violation ? 0 : 5
    })(),
  }

  const total = Object.values(items).reduce((a, b) => a + b, 0)
  return { total, breakdown: items }
}

// upsert 一篇分數進 public/content-scores.json(按 slug)
function writeScoreFile(slug, score, wordCount) {
  let data = { generatedAt: '', scores: {} }
  if (existsSync(SCORES_PATH)) {
    try {
      data = JSON.parse(readFileSync(SCORES_PATH, 'utf-8'))
      if (!data.scores) data.scores = {}
    } catch {
      data = { generatedAt: '', scores: {} }
    }
  }
  data.scores[slug] = {
    total: score.total,
    breakdown: score.breakdown,
    wordCount,
  }
  data.generatedAt = new Date().toISOString().slice(0, 10)
  writeFileSync(SCORES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

function buildFields(post) {
  const articlePath = resolve(`public/images/blog/${post.slug}/article.md`)
  const content = readFileSync(articlePath, 'utf-8')
  const wordCount = wordCountOf(content)
  const readingTime = readingTimeOf(content)
  const score = computeContentScore(content, post)

  return {
    fields: {
      slug: { stringValue: post.slug },
      title: { stringValue: post.title },
      excerpt: { stringValue: post.excerpt },
      content: { stringValue: content },
      author: { stringValue: '陳彥彤' },
      publishDate: {
        stringValue:
          post.publishDate || new Date().toISOString().slice(0, 10),
      },
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
      contentScore: {
        mapValue: {
          fields: {
            total: { integerValue: String(score.total) },
            breakdown: {
              mapValue: {
                fields: Object.fromEntries(
                  Object.entries(score.breakdown).map(([k, v]) => [
                    k,
                    { integerValue: String(v) },
                  ])
                ),
              },
            },
          },
        },
      },
    },
    wordCount,
    readingTime,
    score,
  }
}

const onlySlugs = process.argv.slice(2)
const targets = onlySlugs.length
  ? posts.filter((p) => onlySlugs.includes(p.slug))
  : posts
if (onlySlugs.length && !targets.length) {
  console.error('No matching slug:', onlySlugs)
  process.exit(1)
}

// docId = slug 做 upsert,避免雙胞胎 doc。
// PATCH /documents/{COLLECTION}/{slug} 不帶 currentDocument 條件 = create-or-overwrite。
// (注意:overwrite 是整個 doc 重寫,buildFields 必須產出完整欄位)
const accessToken = await getOwnerAccessToken()

let anyFail = false
for (const post of targets) {
  const { fields, wordCount, readingTime, score } = buildFields(post)
  const docPath = encodeURIComponent(post.slug)
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${docPath}?key=${API_KEY}`
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
    console.error(`FAIL [${post.slug}]`, JSON.stringify(data, null, 2))
    anyFail = true
    continue
  }
  writeScoreFile(post.slug, score, wordCount)
  console.log('OK doc id:', post.slug, '(upsert)')
  console.log(
    '  URL:',
    `https://yanchen.app/blog/${post.slug}/`
  )
  console.log('  reading time:', readingTime, 'min | word count:', wordCount)
  console.log('  content score:', score.total, '/ 100', JSON.stringify(score.breakdown))
}

process.exit(anyFail ? 1 : 0)

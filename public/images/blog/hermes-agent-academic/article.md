> **TL;DR**
> - 本文解決：Hermes Agent 是誰、為什麼能在 OpenRouter 應用榜衝到僅次於 ChatGPT 的第 2 名
> - 推薦給：在意 AI Agent 生態的工程師、思考為什麼開源 CLI 在 2026 還能跟雲端閉源 app 拼流量的觀察者
> - 讀完你會知道：Hermes Agent 是什麼、OpenRouter 為什麼變成模型市佔的事實量尺、open-source provider-agnostic 在 LLM 路由經濟下的結構優勢

2026 上半年，OpenRouter 公布最新 [App & Agent Rankings](https://openrouter.ai/rankings)。第一名是 OpenAI 自家的 ChatGPT 客戶端（廢話，他們本來就是最大用戶）。第二名讓我看了一愣：**Hermes Agent**——一個 NousResearch 維護的開源 CLI agent，連付費 GUI 都沒有。

它把 Kilo Code、Claude Code、Cline 全壓在身後。

<img src="/ai-lecturer-bob/images/blog/hermes-agent-academic/openrouter-apps-ranking.png" alt="OpenRouter App & Agent Rankings 截圖,顯示 Hermes Agent 在 Most Popular 區塊排名 #2,僅次於 OpenAI;同時佔據 Top Productivity 與 Top Creative 雙榜首" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

這篇是觀察筆記，不是教學。如果你想知道「**為什麼一個沒有 sales、沒有 GUI、沒有訂閱方案的開源 CLI，能在 2026 的 agent 生態擠進 OpenRouter 前段班**」，這篇給你結構性答案。想動手裝起來的請看姊妹文：[從 0 在 Mac 上裝 Hermes Agent 接內網 LLM](/ai-lecturer-bob/blog/hermes-agent-mac-install/)。

## 📌 目錄

1. [Hermes Agent 是誰、做什麼](#hermes-agent-是誰做什麼)
2. [OpenRouter 為什麼是 2026 的市佔量尺](#openrouter-為什麼是-2026-的市佔量尺)
3. [Hermes 排第 2 的三個結構性原因](#hermes-排第-2-的三個結構性原因)
4. [跟 Claude Code / Kilo / Cline 的真實差異](#跟-claude-code--kilo--cline-的真實差異)
5. [v0.13.0「The Tenacity Release」的訊號](#v0130the-tenacity-release的訊號)
6. [這對工程師意味著什麼](#這對工程師意味著什麼)
7. [反方論點：Hermes 也不是萬靈丹](#反方論點hermes-也不是萬靈丹)
8. [延伸資源](#延伸資源)

## 🧠 Hermes Agent 是誰、做什麼

[Hermes Agent](https://github.com/NousResearch/hermes-agent) 是 **NousResearch**（以 Hermes 系列開源 LLM 聞名的研究機構）在 2025 末 / 2026 初推出的 CLI agent，現在 6k stars、24k forks、1.5k contributors。

<img src="/ai-lecturer-bob/images/blog/hermes-agent-academic/hermes-github-repo.png" alt="NousResearch/hermes-agent GitHub repo 主頁,6k stars、24k forks、1.5k contributors、Python 為主" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

它的設計哲學一句話：**provider-agnostic agent loop**。意思是：

- agent 本體（tool 呼叫、planning、session、多 agent delegation）跟 model 解耦
- 你愛接哪家就接哪家：OpenAI、Anthropic、Google、Alibaba、xAI、Groq、Together、LM Studio、Ollama
- 同一個 `~/.hermes/config.yaml` 改一行 `provider:` 就切

換言之：**Hermes 把「agent loop」當基礎建設，把「model」當可插拔零件**。Claude Code 把這兩件事綁死，Hermes 把它們解耦。

## 📊 OpenRouter 為什麼是 2026 的市佔量尺

OpenRouter 是什麼？簡單講：**LLM 的 stripe**。一個 API endpoint 後面接 100+ 家 model provider，按使用量結算、自動路由、提供 fallback。

它在 2025 中崛起、2026 上半年實質壟斷「**多 model 比較與切換**」這個 niche。Anthropic、Google、xAI 出新版本時，**先看 OpenRouter 排名變化**，因為這比官方 Twitter 更能反應真實採用度。

<img src="/ai-lecturer-bob/images/blog/hermes-agent-academic/openrouter-model-rankings.png" alt="OpenRouter AI Model Rankings,顯示 Hy3 preview、Claude Opus 4.7、Claude Sonnet 4.6 等模型排名與市佔走勢" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

兩個榜要分清楚：

- **App Rankings**：誰打 OpenRouter 最兇（多少 token），衡量「agent / app 用戶基數」
- **Model Rankings**：誰被打最多次（透過 OpenRouter 出貨），衡量「model 在開放市場的採用度」

Hermes 上的是 **App Rankings**——它的用戶把 OpenRouter token 燒到全球第 2 多，這代表 Hermes 的活躍度（按使用強度算）真的硬。

## 🎯 Hermes 排第 2 的三個結構性原因

### 1. Provider-agnostic 直接吃 OpenRouter 紅利

OpenRouter 自己就是 OpenAI-compatible API。**Hermes 的 `openai` provider 改一行 `OPENAI_BASE_URL` 就能接 OpenRouter**，零摩擦。

對比：

- Claude Code 強制連 Anthropic API，**不能**透過 OpenRouter
- Cursor 用自己的 router，OpenRouter 賺不到 Cursor 的錢
- Hermes 不只能接，使用者**幾乎都會接**——因為 OpenRouter 是它唯一能玩多 model 的路徑

換言之，**Hermes 的 architecture 本身就是 OpenRouter 的 perfect funnel**。

### 2. 開源 + CLI 的 long-tail 採用

GUI agent 對普通用戶友善，但對 **工程師 / 自動化 / CI / agent-on-agent 場景**完全不友善。Hermes 是 CLI、開源、可 fork、可 self-host，這個 niche 在 2026 爆炸性成長：

- **CI / GitHub Actions 跑 agent task**：你要 GUI 幹嘛？
- **Agent-of-agents**：上層 agent 要呼叫下層 agent，CLI 是唯一通路
- **內網 LLM 場景**：法務 / 醫療 / 國防都不能用雲端 GUI

這群人加起來不會比 ChatGPT 的 C 端用戶多，但**每個人燒的 token 量是 C 端用戶的 100 倍**。一個工程師跑 24/7 的 agent loop，等於 1000 個偶爾問問題的 C 端使用者。

### 3. NousResearch 的開源信任資本

NousResearch 不是創投暖場的「先開源後閉源」團隊，他們是**真開源**：Hermes 系列模型權重全部公開、論文齊全、Discord 活躍。這份信任資本讓 Hermes Agent 一發布就有現成的「擁護者社群」——這些人會自願寫 plugin、回報 bug、推薦給朋友。

對比 Anthropic 從未開源任何 model；Google 開源 Gemma 但 Gemini 閉源。**在 2026，純開源信任資本是稀缺品**。

## 🔍 跟 Claude Code / Kilo / Cline 的真實差異

| 維度 | Hermes Agent | Claude Code | Kilo Code | Cline |
|------|:---:|:---:|:---:|:---:|
| 開源 | ✓ | ✗ | ✓ | ✓ |
| Provider 數 | 9+ | 1 | 多 | 多 |
| OpenRouter 原生 | ✓ | ✗ | ✓ | ✓ |
| CLI / REPL | ✓ | ✓ | △ (VSCode 為主) | △ (VSCode 為主) |
| Multi-agent delegation | ✓ | △ | ✗ | ✗ |
| MCP 支援 | ✓ | ✓ | ✓ | ✓ |
| 預設 model | 任選 | Claude Sonnet | Claude | Claude |

**真實差異不在功能**，幾乎所有 agent 現在功能都類似。差異在**綁定強度**：

- Claude Code 綁死 Anthropic → 適合「我就是要 Claude」的場景
- Kilo / Cline 綁死 VSCode → 適合「IDE-first 開發者」
- Hermes 不綁任何東西 → 適合「我要自己組合」的人

OpenRouter 統計反應的是「**我要自己組合**」這個族群的市佔。**這個族群正在變大**。

## 🚀 v0.13.0「The Tenacity Release」的訊號

<img src="/ai-lecturer-bob/images/blog/hermes-agent-academic/hermes-v013-release.png" alt="Hermes Agent v0.13.0 (2026.5.7) — The Tenacity Release 的 GitHub release 頁面,128.5k 行新增、282 個 contributors、滿滿一頁 Highlights" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

v0.13.0 (2026.5.7) 是個密度極高的 release——**128.5k 行新增、282 contributors**。隨便挑幾條 Highlights：

- Multi-agent delegation：agent fork 另一個 agent 去並行做事
- Provider auto-switch：給多家 API key 後自動 failover
- Skills v2：知識卡片 reuse
- Plankton 語意檢查 / Hermes Voice TTS / Affordance editing
- ASCII drawing tool / Auto-decompose plans / Memory budget

更深的訊號是 commit 節奏：**過去一個月 282 個 contributors 提交 PR**。這已經不是「某個團隊在做」，這是「**全球工程師在共建**」。

對比 Claude Code：閉源、只有 Anthropic 員工能提交、release notes 短得多。**速度差距會在 6 個月後拉開**。

## 💡 這對工程師意味著什麼

三個實務 takeaway：

### 1. CLI agent 不會被 GUI 取代

過去十年的趨勢是「CLI → GUI」，2026 反過來：**agent 場景中 GUI 是次優介面**。原因是 agent loop 本質上是 pipe-able、scriptable、可組合的，GUI 的點擊操作反而是阻力。

### 2. Provider lock-in 是 2026 最大技術債

如果你的整個 stack 綁死一家 LLM（用 Claude SDK / Vertex AI / OpenAI SDK 寫死），**等於賭它三年內不漲價、不限額、不關 API**。這個賭注三年前看起來安全，現在看起來像 2019 年押注 AWS region 不會掛。

Hermes 的 architecture 直接示範了**怎麼把 provider 變插槽**。值得抄。

### 3. OpenRouter 統計是有資訊量的信號

別只看 GitHub stars。GitHub stars 衡量「**知道你存在的人有多少**」，OpenRouter App Rankings 衡量「**真的拿你燒錢的人有多少**」。後者貴非常多倍。

下次看到「我新做了一個 agent」，先去 OpenRouter App Rankings 看排名，比看 README 有用。

## ⚠️ 反方論點：Hermes 也不是萬靈丹

為了不變成業配，講三個它真的不好的地方：

### 1. Silent fail 折磨人

Hermes 跑 OpenAI SDK strict 模式，response 格式錯一個小欄位（缺 `usage` / 缺 `/v1/models` / stream 格式不對）就 silent drop——**exit 0、stdout 空白、沒 log**。debug 極端痛苦。詳細踩坑見[實作篇](/ai-lecturer-bob/blog/hermes-agent-mac-install/)。

### 2. 文件落後 release 太多

v0.13.0 加了一堆東西，但 README 還停在 v0.10 的範例。要看新功能怎麼用，只能讀源碼 + 看 release notes。對「我只想抄個範例」的人不友善。

### 3. 「The agent that grows with you」也意味著「會吃掉你的時間」

Hermes 把 customization 拉到極致——你可以寫 skill、寫 MCP server、寫 affordance、改 prompt。**有人視為自由，有人視為時間黑洞**。如果你只想要「能跑就好」，Claude Code 反而省事。

## 📚 延伸資源

- [NousResearch/hermes-agent GitHub](https://github.com/NousResearch/hermes-agent)
- [Hermes Agent v0.13.0 Release Notes](https://github.com/NousResearch/hermes-agent/releases/tag/v0.13.0)
- [OpenRouter App & Agent Rankings](https://openrouter.ai/rankings)
- [OpenRouter Model Rankings](https://openrouter.ai/rankings/models)
- [NousResearch 官方網站](https://nousresearch.com/)
- 姊妹實作篇：[從 0 在 Mac 上裝 Hermes Agent 接內網 LLM](/ai-lecturer-bob/blog/hermes-agent-mac-install/)

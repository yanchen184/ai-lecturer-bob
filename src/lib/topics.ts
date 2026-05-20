/**
 * SEO Topic Landing Pages 設定
 *
 * 每個 topic 對應一組搜尋意圖明確的長尾關鍵字。
 * tagMatchers 用來從文章 tags 撈出相關文章，articleSlugs 是手動補強的清單。
 */

export interface TopicFaq {
  q: string;
  a: string;
}

export interface TopicConfig {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  heroParagraph: string;
  intro: string[];
  tagMatchers: string[];
  articleSlugs: string[];
  faq: TopicFaq[];
  keywords: string[];
}

export const topics: TopicConfig[] = [
  {
    slug: 'local-llm-mobile',
    title: '手機跑本地 LLM 完整指南',
    metaTitle: '手機本地 LLM 完整指南 — PocketPal AI / LLMFarm / MLC Chat 教學',
    metaDescription:
      '想用 iPhone / Android 跑本地 LLM？本頁集合 PocketPal AI 安裝教學、模型選擇、效能實測、踩坑紀錄。涵蓋 iPhone 15 Plus 真實能跑哪些模型、Apple Intelligence 跟本地 LLM 的差別、on-device AI 開發者驗證指南。',
    h1: '手機跑本地 LLM 完整指南：iPhone / Android 教學與實測',
    heroParagraph:
      '2026 年想用手機跑 LLM，主流選項是 PocketPal AI、LLMFarm、MLC Chat。本頁整理我在 iPhone 15 Plus / Android 旗艦機上的實測筆記，包含安裝步驟、模型選擇、效能 benchmark、5 個踩坑、什麼情境真的值得在手機跑。',
    intro: [
      '**手機真的能跑 LLM 嗎？** 能，但「跑得動」跟「實用」是兩回事。2026 年 5 月的現況：iOS / Android 旗艦機種可以跑 1B-3B 量級模型，速度 5-15 tokens/秒。日常聊天比不上 ChatGPT API，但**隱私需求、離線環境、開發者驗證 on-device 可行性**這三種情境真的值得。',
      '**該選哪個 app？** PocketPal AI 是 [a-ghorbani/pocketpal-ai](https://github.com/a-ghorbani/pocketpal-ai) 開源 app，iOS / Android 雙平台、HuggingFace 直接抓模型、內建 benchmark，新手最佳入口。iOS 老玩家想搞 LoRA / 多模態走 LLMFarm，Android 旗艦機（Snapdragon）走 MLC Chat 吃 Hexagon NPU 加速。',
      '**iPhone 15 Plus 跟 15 Pro 差多少？** 差別主要在 RAM 不在 CPU。15 Plus 用 A16 + 6GB RAM 是 1B-2B sweet spot；15 Pro 用 A17 Pro + 8GB RAM 拉高到 3B-4B，還解鎖 Apple Intelligence。LLM 推理瓶頸是記憶體頻寬，6GB 跟 8GB 差距比想像中大。',
    ],
    tagMatchers: ['PocketPal AI', '本地 LLM', 'iPhone', 'Android', 'on-device AI', 'LLMFarm', 'MLC Chat', 'Apple Intelligence', 'GGUF', 'llama.cpp'],
    articleSlugs: ['phone-local-llm-pocketpal'],
    faq: [
      {
        q: 'iPhone 跑 LLM 速度怎麼樣？',
        a: 'iPhone 15 Plus（A16 + 6GB RAM）跑 Qwen2.5 1.5B 約 12-15 tokens/秒、Gemma 2 2B 約 6-8 tokens/秒、Llama 3.2 3B 已經掉到 3-5 tokens/秒不能用。iPhone 15 Pro（A17 Pro + 8GB）可以多跑一個 size 級距。Pixel 9 Pro / S24 Ultra 走 MLC Chat 吃 Hexagon NPU，3B 也能流暢。',
      },
      {
        q: '手機本地 LLM 跟 ChatGPT 比，差在哪？',
        a: '速度 ChatGPT API 完勝（手機 5-15 tok/s vs API 100+ tok/s），品質也是。手機本地 LLM 的優勢只有三個：絕對隱私、離線可用、零持續成本。日常用 ChatGPT / Claude API 划算 10 倍。手機本地 LLM 是「特殊情境工具」，不是「替代雲端 AI」。',
      },
      {
        q: 'on-device AI 開發者該裝哪個 app 測試？',
        a: '想驗證 GGUF 格式相容性 → PocketPal AI（直接抓 HuggingFace）。想測 NPU 加速效果 → Android + MLC Chat。想自己刻 iOS app 用 llama.cpp → LLMFarm 是最接近的開源參考實作。三個都裝、跑同一個 model 比 benchmark。',
      },
      {
        q: 'Apple Intelligence 算本地 LLM 嗎？',
        a: '算，而且是「最被廣泛使用的本地 LLM」。Apple Intelligence 在系統內塞了約 3B 參數的 foundation model，限 iPhone 15 Pro / M1+ Mac 支援。多數人在用 on-device AI 卻不自覺，因為它包裝在「摘要通知、改寫訊息、Siri 升級」這類功能裡。如果你的 iPhone 不支援 Apple Intelligence（iPhone 15 Plus 以下），PocketPal 是唯一選擇。',
      },
      {
        q: '手機跑 LLM 會把電池搞壞嗎？',
        a: '短期不會、長期有風險。連續跑 10 分鐘手機溫度可飆到 45-50°C 觸發降頻保護，鋰電池長期高溫運作確實會加速老化。日常使用：別連續超過 20 分鐘、別邊充電邊跑、夏天注意溫度。偶爾跑 30 分鐘做測試沒問題。',
      },
    ],
    keywords: [
      '手機本地 LLM',
      'iPhone 本地 LLM',
      'PocketPal AI 教學',
      'PocketPal AI 安裝',
      'on-device AI',
      'iPhone 15 Plus LLM',
      'LLMFarm 教學',
      'MLC Chat',
      'Apple Intelligence',
      'GGUF 量化',
      'llama.cpp 手機',
    ],
  },
  {
    slug: 'llm-wiki',
    title: 'LLM Wiki 完整指南',
    metaTitle: 'LLM Wiki 是什麼？Karpathy 知識編譯方案完整教學',
    metaDescription:
      'Karpathy 2026 年 4 月在 gist 丟出 200 行 markdown 引發社群實作潮。LLM Wiki 是什麼、跟 RAG 差在哪、怎麼建第一個 wiki、token 真的能降 87% 嗎？本頁集合所有相關文章、踩坑、社群實作版本對照。',
    h1: 'LLM Wiki 完整指南：Karpathy 知識編譯方案實測',
    heroParagraph:
      '2026 年 4 月 Karpathy 在 gist 丟了 200 行 markdown 引發社群炸開、12 個實作版本。一句話講：讓 LLM 把你的所有資料「編譯」成結構化 markdown 知識庫，以後問問題不查原檔、查 wiki。本頁集合所有 LLM Wiki 相關文章、實測筆記、社群實作版本對照。',
    intro: [
      '**LLM Wiki 跟 RAG 差在哪？** RAG 是「解釋式」——每次 query 都重新檢索 + 餵 chunk + 解釋；LLM Wiki 是「編譯式」——預先把所有資料整理成結構化 markdown，query 時只餵被編譯過的結論頁。MindStudio 案例 token 降 95%、我自己案例降 87%。',
      '**為什麼用 markdown 不用 SQL？** Karpathy 原文：markdown 是 LLM 最熟的格式，寫起來也最自然。SQL / JSON 會花時間在 schema migration，不是知識本身。markdown 可以丟 Obsidian / Logseq / grep / git，完全 tool-agnostic、永遠不會被綁定。',
      '**踩坑警告**：LLM Wiki 不是「自動產生可信知識庫」，是「自動產生一個你可以快速 audit 的草稿知識庫」。會被 hallucination 污染——所以 frontmatter 要寫 sources、confidence rating、定期跑 lint。',
    ],
    tagMatchers: ['LLM Wiki', 'Karpathy', 'RAG', '知識管理', 'Obsidian'],
    articleSlugs: ['karpathy-llm-wiki', 'ai-batch-seo-refactor-44-articles'],
    faq: [
      {
        q: 'LLM Wiki 跟 Notion AI / Mem.ai 差在哪？',
        a: 'Notion AI / Mem.ai 是「在你既有筆記裡加 AI 查詢入口」，本質還是 RAG——你寫的筆記是 source、AI 是 reader。LLM Wiki 是「AI 自己生成筆記、自己維護」，你的 source 跟 AI 的 wiki 是兩層。差別在 wiki 是 AI 為了 AI 自己以後查詢方便而寫的——結構是給 AI 看的（frontmatter、wikilink、confidence rating），不是給人看的。',
      },
      {
        q: 'token 真的會降 95% 嗎？',
        a: 'MindStudio 案例降 95%（383 檔案 + 100 場逐字稿），我自己案例降 87%。會降的關鍵在 query 階段不再餵原始 chunk，只餵被編譯過的結論頁。會降很多的情境：資料量大（>50 份）、問題偏綜合 / 模糊；降幅小的情境：資料量小、問題偏字面查詢（因為 retrieval-based RAG 本來就準）。前期 ingest 階段反而比 RAG 燒 token，投資回收期看你用多兇。',
      },
      {
        q: '什麼情境別裝 LLM Wiki？',
        a: '資料量小於 20 份（沒到甜蜜點，Obsidian + 全文搜尋更快）；資料常變（新聞、Twitter feed 每次 ingest 都要寫 contradiction block，維護成本爆炸）；你只是要「問檔案內容」（NotebookLM / Cursor docs 直接餵原檔答得很好）；公司資料合規不能丟 Claude API（編譯階段要餵 LLM，合規問題要先解）。',
      },
      {
        q: 'Karpathy 自己現在還在維護嗎？有 canonical implementation 嗎？',
        a: '到 2026 年 5 月為止 gist 本體沒再更新。但社群 fork 持續迭代——sdyckjq-lab、vanillaflava、kfchou、6eanut 四家活躍度最高，各自有 schema 變種。Karpathy 在 Twitter 多次轉發實作版，但沒指定官方分支。目前社群驅動，沒有 canonical implementation。新手建議從 6eanut/llm-wiki 開始（最貼近原文）。',
      },
      {
        q: 'wiki 會不會被 LLM hallucination 污染？',
        a: '會，這是這方案最大的風險。解法：第一，frontmatter 寫 sources 連回原始檔，人類抽查時順著查；第二，confidence rating LLM 對自己 hallucinate 出來的東西通常會給 low；第三，定期跑 lint-wiki 找 broken link、孤兒頁、矛盾；第四，重要 claim 你親眼讀過 source 再放心用。',
      },
    ],
    keywords: [
      'LLM Wiki',
      'LLM Wiki 教學',
      'Karpathy LLM Wiki',
      'AI 知識管理',
      'RAG vs LLM Wiki',
      '編譯式知識庫',
      'Obsidian AI',
      'Claude Code wiki',
    ],
  },
  {
    slug: 'mempalace',
    title: 'MemPalace 完整指南',
    metaTitle: 'MemPalace 知識管理工具完整教學 — 安裝、踩坑、claude -p proxy',
    metaDescription:
      'MemPalace 是 AI agent 用的長期記憶系統，用 chromadb + sqlite 存知識、用 LLM 自動壓縮。本頁集合安裝、3.3.5 救援、HNSW quarantine 機制、claude -p HTTP proxy 省 API 錢的完整教學。',
    h1: 'MemPalace 完整指南：AI Agent 長期記憶系統實戰',
    heroParagraph:
      'MemPalace 是給 Claude Code / Hermes Agent 用的長期記憶系統，跨 session 累積知識、自動壓縮、語意搜尋。本頁集合 MemPalace 安裝、3.3.5 救援實錄、HNSW segment quarantine 機制、from-sqlite 重建、claude -p HTTP proxy 省 API 錢的完整教學。',
    intro: [
      '**MemPalace 是什麼？** 給 AI agent 用的知識管理工具。設計理念：把零散筆記、對話紀錄、技術文件統一塞進 chromadb（向量檢索）+ sqlite（結構化資料），用 LLM 自動壓縮、語意搜尋。Claude Code 跨 session 找「以前討論過的 X」就是靠這個。',
      '**3.3.5 為什麼重要？** chromadb 1.5.x 在 macOS 26.4 ARM64 必 SIGSEGV，所有 CLI 指令全死、只剩 MCP server 苟活。3.3.5 加了兩個救命機制：HNSW segment quarantine 自動隔離壞索引、`repair --mode from-sqlite` 從 sqlite3 直接撈資料重灌新 palace。',
      '**claude -p proxy 是什麼？** MemPalace 壓縮階段要呼叫 LLM 燒 API 錢。Bob 寫了 180 行 Python proxy，把 `claude -p` CLI 包成 OpenAI 相容 HTTP 端點，走 Max 訂閱、零 API 成本。延遲 8-10 秒，對批次壓縮無所謂。',
    ],
    tagMatchers: ['MemPalace', '知識管理', 'chromadb', 'HNSW', 'claude -p', 'MCP server'],
    articleSlugs: ['mempalace-3-3-5-claude-p-proxy'],
    faq: [
      {
        q: 'MemPalace 跟 LLM Wiki 差在哪？',
        a: 'LLM Wiki 是「給 LLM 看的 markdown 知識庫」，重點在編譯 → 結構化 → human-auditable。MemPalace 是「給 AI agent 用的記憶系統」，重點在跨 session 累積 + 語意搜尋。Wiki 偏靜態知識管理、MemPalace 偏動態記憶。實務上兩個可以併用：Wiki 存「我已經懂的事」，MemPalace 存「跟 AI 討論過的歷程」。',
      },
      {
        q: '3.3.5 升級要做什麼準備？',
        a: '備份 ~/.mempalace/ 到 .mempalace.bak.<date>/。然後 pip install -U mempalace。MCP server 重啟一次讓它載新版。如果原本卡在 apply_logs 才需要跑 repair --mode from-sqlite --archive-existing，正常的話 quarantine 自動跑、不用手動干預。',
      },
      {
        q: 'claude -p 為什麼會比 OpenAI API 慢？',
        a: '兩個原因。第一，claude -p 每次都是冷啟動，要載 Node.js runtime + CLI 約 3-5 秒；第二，subprocess.run 走 stdout/stdin pipe，跟 HTTP API 的 keep-alive 沒得比。對批次壓縮無所謂，但要 chat 級互動延遲就不適合，該用 OpenAI / Anthropic API 直連。',
      },
      {
        q: 'MemPalace MCP server 怎麼跟 Claude Code 整合？',
        a: '在 ~/.claude.json 加 mcpServers.mempalace，args 指向 mempalace-mcp。Claude Code 啟動時自動連上，所有 mempalace_* tool 都會出現在 ToolSearch。實際使用：用 mempalace_status 看健康、mempalace_search 找東西、mempalace_kg_query 跨抽屜查詢。Bob 50K+ 抽屜全靠這個管。',
      },
      {
        q: 'HNSW quarantine 是什麼？',
        a: 'chromadb 的向量索引（HNSW segment）偶爾會壞掉，整個 collection 就讀不出來。3.3.5 加的機制是：發現壞 segment 時自動隔離（quarantine 資料夾），讓其他 segment 繼續工作。後續可以手動跑 repair 從 sqlite3 撈原始 (id, document, metadata) 重建索引。對「知識庫不能掛」的場景很重要。',
      },
    ],
    keywords: [
      'MemPalace',
      'MemPalace 教學',
      'MemPalace 安裝',
      'AI 記憶系統',
      'Claude Code 記憶',
      'chromadb 修復',
      'HNSW quarantine',
      'claude -p proxy',
      'AI agent 知識管理',
    ],
  },
  {
    slug: 'claude-code',
    title: 'Claude Code 完整指南',
    metaTitle: 'Claude Code 完整指南 — CLI 安裝、Plugin、Skills、Hooks 教學',
    metaDescription:
      'Claude Code 是 Anthropic 推出的 CLI agent。本頁集合安裝教學、Plugin 開發、Skills 寫法、Hooks 設定、/loop /schedule /powerup 等指令的完整實戰教學。新手到進階使用者一站搞定。',
    h1: 'Claude Code 完整指南：CLI agent 從安裝到 Plugin 開發',
    heroParagraph:
      'Claude Code 是 Anthropic 在 2025 推出的命令列 AI agent — 不只回答問題，會直接改檔、跑指令、跨 session 累積知識。本頁集合我在實戰中寫的 Claude Code 教學：從 5 分鐘安裝、Plugin 開發踩坑、自寫 Skill、Stop Hook 攔截、Remote Control 手機操作，到本地 LLM 接入。',
    intro: [
      '**Claude Code 跟 ChatGPT / Cursor 差在哪？** ChatGPT 只會回字、要你自己動手；Cursor 偏 IDE 內補完；Claude Code 是「跑在 terminal 的 agent」—— 看檔、改檔、跑指令、上網查、自己重試錯誤，做完才回報。最適合「跨多檔案、跨工具、要持續狀態」的任務。',
      '**該從哪開始？** 新手第一步：[Claude Code 安裝教學]，一行 curl 5 分鐘搞定。裝完後想立刻有產出 → 跑 `/powerup` 10 堂互動課掃過所有功能。想自己改 → 從寫 Skill 開始（單一檔案、零 cost）；想開源給人裝 → 包成 Plugin。',
      '**進階主題**：Stop Hook 攔截 AI 摸魚（Ralph Loop）、Plugin 開發踩坑、Remote Control 手機操作、本地 LLM 接入、frontend-design plugin 擋紫色問題、Skill 跟 Superpowers 怎麼選。每個主題都有實戰文章。',
    ],
    tagMatchers: ['Claude Code', 'Claude Code CLI', 'Claude Code Plugin', 'Skills', 'Hooks', 'Subagents', '/loop', '/schedule', '/powerup', 'Ralph Loop', 'Stop Hook', 'Plugin', 'CLAUDE.md', 'Superpowers', 'Anthropic', 'Remote Control', 'frontend-design'],
    articleSlugs: ['ai-lesson-01-part2', 'claude-code-powerup-tutorial', 'claude-code-remote-control', 'claude-code-5hour-limit-schedule-loop', 'claude-code-local-model-with-web-search', 'yc-plugin-youtube-upload', 'yc-plugin-pitfalls', 'zenbu-powers-claude-code-plugin-design', 'superpowers-vs-handcrafted-skills', 'karpathy-claude-skills', 'claude-self-sync-intro', 'how-i-built-claude-self-sync-with-claude', 'ralph-loop-skill', 'ralph-loop-real-world', 'cli-hidden-settings-strings', 'claude-frontend-design-plugin-guide', 'ai-frontend-purple-problem-explained', 'claude-figma-mcp-diagram-v2', 'claude-pptx-skill', 'claude-code-two-lessons-astro-and-tasklist'],
    faq: [
      {
        q: 'Claude Code 跟 ChatGPT 差在哪？我有 ChatGPT 還要裝嗎？',
        a: 'ChatGPT 只會回字、你要自己貼上去執行；Claude Code 直接在你 terminal 動手 —— 改檔、跑指令、查網、跨檔案重構，做完才回報。如果你工作流是「看一坨檔案、改幾個地方、跑測試、commit」這種要動手的，Claude Code 一裝就回不去。如果你只用 AI 問問題、寫長文，ChatGPT 夠了。',
      },
      {
        q: '裝 Claude Code 要會寫 code 嗎？',
        a: '不用。一行 curl 安裝、用中文跟它講話、它自己看你的檔案決定要改哪。不會 code 的人反而更受益 —— AI 直接動手而不是教你怎麼動手。但要事先知道：它會真的改你的檔，所以建議先在 git repo 裡用、改壞了可以 git restore。',
      },
      {
        q: 'Claude Code Skill 跟 Plugin 差在哪？',
        a: 'Skill 是「一個 markdown 檔，描述特定任務該怎麼做」，你寫好放到 ~/.claude/skills/ 就用。Plugin 是「打包好的 Skill / hook / agent 集合」，別人可以 npm 一鍵裝。寫給自己用 → Skill；要開源給人裝 → 包成 Plugin。我有寫過 yc-plugin 開源實戰跟 4 個踩坑。',
      },
      {
        q: 'Claude Code 可以接本地 LLM 嗎？',
        a: '可以，三條 env var 搞定（換 base URL、API key、model name）。但內建 WebSearch 工具是伺服器端服務，改接本地後直接失效。我寫過完整接線圖：Ollama / claude-code-router / claude-zen 三種路徑，含 Web Search 三種解法。',
      },
      {
        q: '怎麼防止 Claude Code 自己 exit 偷懶？',
        a: '用 Stop Hook 攔截 exit 0、把同一個 prompt 重新塞回去 —— 這個 pattern 叫 Ralph Loop。本質就 30 行 settings.json，TDD 收斂、跨多檔案任務超有用。我寫了兩篇：Ralph Loop Skill 機制解說、Ralph Loop 實戰 6 個踩坑。',
      },
    ],
    keywords: [
      'Claude Code',
      'Claude Code 教學',
      'Claude Code 安裝',
      'Claude Code Plugin',
      'Claude Code Skills',
      'Claude Code Hooks',
      'Ralph Loop',
      'Stop Hook',
      'Anthropic CLI agent',
      'Claude Code 本地模型',
      'Claude Code Remote Control',
    ],
  },
  {
    slug: 'hermes-agent',
    title: 'Hermes Agent 完整指南',
    metaTitle: 'Hermes Agent 完整指南 — NousResearch 開源 CLI agent 教學',
    metaDescription:
      'Hermes Agent 是 NousResearch 維護的開源 CLI agent，2026 上半年 OpenRouter App 排行榜第 2。本頁集合安裝教學、Sandbox 7 種後端選擇、Mac 接內網 LLM 實戰、跟 ChatGPT / Claude Code 比較。',
    h1: 'Hermes Agent 完整指南：開源 CLI agent 從安裝到接內網 LLM',
    heroParagraph:
      'Hermes Agent 是 NousResearch（開源大本營）維護的 CLI agent，2026 上半年衝上 OpenRouter App Rankings 第 2，僅次於 ChatGPT、把 Claude Code / Cline / Kilo Code 全壓在身後。本頁集合 Hermes Agent 從 5 分鐘新手安裝、7 種 Sandbox 後端怎麼選、到 Mac 接內網 LLM 寫 FastAPI proxy 補洞的完整實戰。',
    intro: [
      '**Hermes Agent 是什麼？** 給工程師用的命令列 AI agent —— 跟 Claude Code / Cline 同類，但完全開源、provider-agnostic、吃 OpenRouter 路由優勢。最大優勢：可以無痛在 Anthropic / OpenAI / Ollama / 自架模型之間切換。',
      '**為什麼第 2 名是 Hermes？** 三個結構性原因：provider-agnostic 直接吃 OpenRouter 紅利、開源 CLI 對學術社群天然吸引力、Hermes 訓練資料的 agent 任務密度高。整篇拆解見 [Hermes Agent 為什麼擠進 OpenRouter App 排行榜第 2]。',
      '**該怎麼上手？** 完全新手 → 先讀「Hermes Agent 是什麼（白話版）」搞清楚跟 ChatGPT 差別。要裝 → 「最簡安裝指南」5 分鐘搞定。Mac 用戶要接內網 LLM → 「Mac 完整實戰」教你寫 FastAPI proxy 補 OpenAI API 4 大漏洞。怕 AI 把電腦弄壞 → 「Sandbox 7 種後端」教你怎麼選 Docker / Modal / Daytona。',
    ],
    tagMatchers: ['Hermes Agent', 'NousResearch', 'AI Agent', 'CLI Agent', 'OpenRouter', 'Hermes Agent 安裝', 'Sandbox'],
    articleSlugs: ['hermes-agent-intro', 'hermes-agent-quickstart', 'hermes-agent-academic', 'hermes-agent-sandbox', 'hermes-agent-mac-install'],
    faq: [
      {
        q: 'Hermes Agent 跟 Claude Code 差在哪？',
        a: 'Claude Code 綁 Anthropic（雖然可改 backend）、官方支援強、UX 拋光好。Hermes Agent 完全開源、provider-agnostic 設計、吃 OpenRouter 路由能力強。實務上：日常開發 Claude Code、要切換多家模型或接內網 LLM 走 Hermes。我兩個都裝、看任務選。',
      },
      {
        q: 'Hermes Agent 安裝難嗎？',
        a: '不難。三步：裝 uv（Python 套件管理器）→ uv 裝 hermes-cli → 給一把 API key（Anthropic / OpenAI / 自家內網皆可）。完全新手 macOS / Linux / Windows 5 分鐘搞定。完整步驟見 [Hermes Agent 最簡安裝指南]。',
      },
      {
        q: 'Hermes Agent 沙盒怎麼選？',
        a: '看你怕什麼。完全不怕 → 本機跑（最快、零隔離）。怕改錯檔 → Docker（容器隔離）。怕被裝後門 → Modal / Daytona / Vercel Sandbox（跑在別人雲端、跟你電腦完全無關）。完整 7 種選擇對照表見 [Hermes Agent Sandbox 完整教學]。',
      },
      {
        q: 'Hermes Agent 可以接內網 LLM 嗎？',
        a: '可以，但 OpenAI-compatible wrapper 要寫對。我在 Mac 上接內網 Breeze2 LLM 時發現 wrapper 缺 4 件事（/v1/models endpoint、usage 欄位、SSE streaming、system_fingerprint），導致 hermes -z 跑完 exit 0 但 stdout 全空白。完整除錯記錄跟 FastAPI proxy 範本見 [Hermes Agent Mac 接內網 LLM]。',
      },
      {
        q: 'Hermes Agent 開發者是誰？可信嗎？',
        a: 'NousResearch 維護，是開源 LLM 圈最活躍的研究團體之一，發過 Hermes 系列 fine-tuned 模型、Forge 推理引擎、跟多家 lab 合作。GitHub repo 公開、commit history 透明、Discord 社群活躍。比那些「個人開發者一週就棄坑」的 agent 可信度高很多。',
      },
    ],
    keywords: [
      'Hermes Agent',
      'Hermes Agent 教學',
      'Hermes Agent 安裝',
      'NousResearch',
      'CLI Agent',
      'AI Agent 開源',
      'OpenRouter App Rankings',
      'Hermes Agent Sandbox',
      'Hermes Agent macOS',
    ],
  },
  {
    slug: 'ai-video',
    title: 'AI 影片生成完整指南',
    metaTitle: 'AI 影片生成完整指南 — Wan 2.2 / LoRA 訓練 / RTX 4070 本地實測',
    metaDescription:
      '想用 AI 生影片但不知道從哪開始？本頁集合 Wan 2.2 影片模型、fal.ai 雲端 LoRA 訓練、RTX 4070 本地 ComfyUI 跑 I2V、musubi-tuner Windows 訓 LoRA 的完整實戰。從雲端到本地、從圖到影片。',
    h1: 'AI 影片生成完整指南：Wan 2.2 + LoRA 訓練 + 本地 / 雲端實測',
    heroParagraph:
      '2026 年想自己跑 AI 影片，主流選項是 Wan 2.2 模型（開源、品質接近 Sora）+ ComfyUI（本地）/ fal.ai（雲端）+ LoRA 訓練角色一致性。本頁集合我在 RTX 4070 12GB 上跑通 I2V、用 fal.ai 訓商用 LoRA、把卡通形象訓進 Wan 2.2 掛上個人網站的完整實戰。',
    intro: [
      '**Wan 2.2 是什麼？** 阿里巴巴開源的影片生成模型，2026 年最熱的開源 video diffusion model 之一。雙 transformer 架構、支援 I2V / T2V、社群 LoRA 生態豐富。品質接近 Sora，但你可以自己跑、自己訓。',
      '**該選雲端還本地？** 想試水溫、不想搞硬體 → fal.ai 雲端 LoRA 訓練（$9 / 131 分鐘）。想自己控、長期算成本划算 → 本地 ComfyUI + RTX 4070 12GB 跑得動 14B 模型（用 lightx2v 4-step LoRA 加速）。',
      '**LoRA 訓練要踩多少坑？** 訓自己角色 LoRA 我用 musubi-tuner 在 Windows 上踩了 19 次失敗、5 次 BSOD、8 個 Windows-specific 雷區才跑通。雲端走 fal.ai 比較順但要懂 dataset 準備（15 張截圖 → 商用 .safetensors）。',
    ],
    tagMatchers: ['Wan 2.2', 'Wan2.2', 'LoRA', 'LoRA 訓練', 'fal.ai', 'AI 影片', 'I2V', 'ComfyUI', 'musubi-tuner', 'lightx2v', 'RTX 4070'],
    articleSlugs: ['fal-ai-wan22-character-lora-tutorial', 'rtx-4070-wan22-i2v-loop', 'ohwx-companion'],
    faq: [
      {
        q: 'Wan 2.2 跟 Sora、Runway 比品質差多少？',
        a: '單看 cherry-pick 樣本：Sora > Wan 2.2 > Runway Gen-3。但 Wan 2.2 開源、可以自訓 LoRA、本地跑零月費，這三點 Sora / Runway 都做不到。實務上：商業用、品質第一 → Sora / Runway 訂閱。要訓角色、要私有資料、要長期算成本 → Wan 2.2 + 自家 GPU 或 fal.ai。',
      },
      {
        q: 'RTX 4070 12GB 真的跑得動 Wan 2.2 嗎？',
        a: '跑得動 14B 模型，但要技巧。直接跑會 OOM；用 ComfyUI + lightx2v 4-step LoRA + fp8 量化可以把 VRAM 壓到 11GB 內、5 分鐘出 8 秒影片。完整實戰見 [RTX 4070 12GB 在家跑 Wan 2.2 I2V]，含從 OOM 到無縫 Loop 的全紀錄。',
      },
      {
        q: 'fal.ai 訓 LoRA 一次多少錢？',
        a: '我用 15 張截圖訓 Wan 2.2 角色 LoRA 花 $9、耗時 131 分鐘。雲端訓練優勢：不用買 GPU、不用搞 Windows / Linux 環境、結果可直接商用。完整步驟、dataset 準備、踩坑見 [fal.ai 訓練 Wan 2.2 角色 LoRA 教學]。',
      },
      {
        q: 'musubi-tuner Windows 上會踩什麼坑？',
        a: '我踩過 8 個 Windows-specific 雷：CUDA 版本不對 BSOD、Python 環境 conflict、accelerate config 預設值錯、bf16 在 Ampere 以下卡會炸、checkpoint 載入路徑長度限制、windows-specific symlink 權限、torch compile JIT 慢、watchdog crash。19 次訓練失敗、5 次 BSOD 才跑通。完整解法見 [ohwx-companion 訓練實錄]。',
      },
      {
        q: 'AI 生影片可以商用嗎？',
        a: '看模型授權跟訓練資料。Wan 2.2 是 Apache 2.0、自家訓的 LoRA 可商用。Sora / Runway 看訂閱方案有商用授權。fal.ai 上訓的 LoRA 商用權看 base model（用 Wan 2.2 OK，用 Sora 系列不行）。商用前一定要看 base model 跟訓練資料兩層授權。',
      },
    ],
    keywords: [
      'AI 影片生成',
      'Wan 2.2',
      'Wan 2.2 教學',
      'LoRA 訓練',
      'fal.ai LoRA',
      'ComfyUI Wan 2.2',
      'I2V',
      'RTX 4070 AI',
      'musubi-tuner',
      '角色 LoRA',
    ],
  },
  {
    slug: 'claude-code-skills',
    title: 'Claude Code Skills 完整指南',
    metaTitle: 'Claude Code Skills 完整指南 — 自寫 Skill、Superpowers、Anthropic 官方 Plugin',
    metaDescription:
      'Claude Code Skill 是什麼？該自己寫還是裝 Superpowers？本頁集合自寫 Skill 範本（SEO 計分、Brand Voice、Live Search Injection、blog-create）、Superpowers vs handcrafted 對照、Anthropic 官方 pptx / frontend-design plugin 教學。',
    h1: 'Claude Code Skills 完整指南：自寫 Skill vs Superpowers vs 官方 Plugin',
    heroParagraph:
      'Claude Code Skill 是「一個 markdown 檔描述特定任務該怎麼做」的最小可用單位。本頁集合我自己寫過的 5 個 Skill（部落格 SEO 計分、Brand Voice 防 AI 腔、Live Search Injection 即時查證、blog-create 一條龍寫作流程、Ralph Loop 監工）、跟 Superpowers / 官方 Plugin 的對照、什麼時候該自己寫什麼時候該裝現成。',
    intro: [
      '**Skill 是什麼？** 一個放在 ~/.claude/skills/ 的 markdown 檔，描述「遇到 X 任務時該怎麼做」。Claude Code 看到匹配的任務時自動讀進來當 context。最小 30 行就能寫一個有用的 Skill。',
      '**該自己寫還是裝 Superpowers？** Superpowers 14 個內建 skill 把資深工程師工作流（brainstorm / TDD / debug）強行套上來，token -14%、首次成功率 +40%。但小任務反而 +20% token、demo 前急著修 bug 會被 brainstorming 拖住。完整對照見 [Superpowers vs 手寫 Skill]。',
      '**有哪些值得抄的 Skill？** SEO 量化計分（12 條 100 分公式）、Brand Voice Profile（抽自己寫作指紋擋 AI 腔）、Live Search Injection（即時查證防數字過時）、Ralph Loop（Stop Hook 監工）、blog-create（一條龍寫作）。每個都有完整教學文章。',
    ],
    tagMatchers: ['Skills', 'Claude Code', 'Skill', 'Superpowers', 'Brand Voice', 'SEO', 'Content Score', 'Ralph Loop', 'blog-create', 'Fact Check'],
    articleSlugs: ['superpowers-vs-handcrafted-skills', 'karpathy-claude-skills', 'seo-content-score', 'brand-voice-profile', 'live-search-injection', 'blog-create-skill-overview', 'ralph-loop-skill', 'ralph-loop-real-world', 'claude-pptx-skill', 'claude-frontend-design-plugin-guide', 'ai-batch-seo-refactor-44-articles'],
    faq: [
      {
        q: 'Claude Code Skill 跟 Anthropic Plugin 差在哪？',
        a: 'Skill 是「一個 markdown 檔」，你寫好放 ~/.claude/skills/ 就用、不用打包、不用安裝。Plugin 是「打包好的 Skill / hook / agent 集合」，別人可以 npm 一鍵裝。寫給自己用 → Skill 最快；要開源給人裝 → 包 Plugin（但要踩 marketplace.json、cache、跨平台、credentials 4 個坑）。',
      },
      {
        q: 'Superpowers 該裝嗎？',
        a: '看任務類型。要做完整功能（brainstorm → spec → TDD → ship）→ 裝，工作流被強制走完、收斂快。日常小修補、demo 前緊急修 bug → 別裝或開 toggle 關掉，brainstorming 會卡住你。Haiku model 跑不動 Superpowers（context 太大），裝了反而拖累。完整對照見 [Superpowers vs 手寫 Skill]。',
      },
      {
        q: '寫 Skill 該從哪開始？',
        a: '先抄 Karpathy 那份 70 行 CLAUDE.md（108k stars 不是沒原因）。然後挑你最常重複做的工作流（寫部落格、寫測試、code review）寫一個 Skill。我自己第一個寫的是 SEO 量化計分 —— 寫完幾天就回本。詳細見 [Karpathy CLAUDE.md 規則解析]。',
      },
      {
        q: '怎麼擋 AI 寫的東西一眼看穿？',
        a: 'Brand Voice Profile + 禁用詞表雙保險。從舊文抽 6 個維度個人指紋（句長、開頭模式、口語比例、情緒詞密度、轉折詞、結尾模式），寫完新文章對照打 voice match 分數，< 70 分必重寫。完整實作見 [Brand Voice Profile 教學]。',
      },
      {
        q: '寫的 Skill 怎麼版本控制 + 多機同步？',
        a: '~/.claude/skills/ 整個丟 git repo。多機同步用 claude-self-sync（把 ~/.claude 拆成公開 config + 私密 secrets 兩個 git repo）。Dropbox / iCloud 都會把 chat history 撞壞別用。完整方案見 [claude-self-sync 教學]。',
      },
    ],
    keywords: [
      'Claude Code Skill',
      'Claude Code Skills',
      'Claude Code Skill 寫法',
      'Superpowers',
      'Anthropic Plugin',
      'CLAUDE.md',
      'Brand Voice Profile',
      'SEO Skill',
      'Ralph Loop',
      'blog-create',
    ],
  },
];

export function findTopic(slug: string): TopicConfig | undefined {
  return topics.find((t) => t.slug === slug);
}

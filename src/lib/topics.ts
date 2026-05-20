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
    articleSlugs: ['karpathy-llm-wiki'],
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
];

export function findTopic(slug: string): TopicConfig | undefined {
  return topics.find((t) => t.slug === slug);
}

# Pro 版 Claude Code 第一堂:從零到「看見」這把刀——4 個 demo + 權限 4 模式 + 邊界

> **本文寫給誰看**:你已經訂閱 Claude Pro($20/月),會用 ChatGPT,但還沒在電腦裝過 Claude Code。文章是我 2026-04-28 在小班開的「Pro 版初階班」第一堂的完整教學紀錄——不是計畫、是實際發生的 43 分鐘。

## TL;DR

第一堂的目標只有一個:**讓你「看見」這把刀能幹什麼,然後立刻知道在哪裡停手**。我跑了 4 個 demo——讀 CSV、整理混亂資料夾、查 4 月營收、從零部署網站——每一個都 5 分鐘以內看到結果。然後講 4 種 permission mode、`.claudeignore`、以及「Claude 邊界」這個我自創的詞:**它不知道的事,它會極度自信地說錯,所以不要讓 AI 做你也不懂的事情**。這篇是 Pro 訂閱者(月繳 $20)的入門課,免費版 Claude 不在範圍內(API 額度跟 Code CLI 行為不同)。

## 目錄

- [為什麼這堂課是 Pro 訂閱者專屬](#為什麼這堂課是-pro-訂閱者專屬)
- [Demo 1:用一句話讀 CSV](#demo-1用一句話讀-csv)
- [Demo 2:整理 24 個亂七八糟的檔案](#demo-2整理-24-個亂七八糟的檔案)
- [Demo 3:從 SQLite 撈 4 月營收](#demo-3從-sqlite-撈-4-月營收)
- [Demo 4:從零部署一個個人網站](#demo-4從零部署一個個人網站)
- [4 種 permission mode 怎麼選](#4-種-permission-mode-怎麼選)
- [.claudeignore 跟 Claude 邊界](#claudeignore-跟-claude-邊界)
- [常見問題 FAQ](#常見問題-faq)
- [明天預告:第二堂「馴服」](#明天預告第二堂馴服)
- [延伸資源](#延伸資源)

## 為什麼這堂課是 Pro 訂閱者專屬

Claude Pro 月繳 $20 美金、年繳 $200(等於 $17/月)。Anthropic 在 [pricing 頁面](https://claude.com/pricing) 把它定位成「個人重度使用者」方案——免費版 Claude.ai 每 5 小時給你 30-40 則訊息,Pro 拉高到 5 倍左右,Sonnet 4.6 / Opus 4.7 都能用,更重要的是 Claude Code CLI 從 Pro 開始才用得起來。

職訓局學員都是上班族、不會被公司報帳訂閱費,所以我這個小班只收已經自掏腰包訂 Pro 的人——不然第一堂跑 4 個 demo 就把當天額度燒完,後面 50 分鐘的觀念課就沒得試。**自己花錢的人才會認真學**,這是我這個 Pro 版小班的設計前提。

我跟學員約好:這四堂課每堂 1 小時、每週一次、連跑 4 週,你看完這四篇文章等於完整參加一次。

## Demo 1:用一句話讀 CSV

電腦裡有一份 24 個欄位的客戶名單 CSV。傳統做法:打開 Excel、loading 30 秒、用 filter、用 vlookup、找 VIP 等級的人。

我在 Claude Code 裡只打一句:

> 幫我把 customers.csv 裡 VIP 等級為 A 的人撈出來,輸出成 vip-a.csv,只留姓名跟手機。

5 秒後它讀檔、看欄位、寫了一個 6 行的 Python script、跑完、輸出新檔案。

**重點**:你看到的不是「ChatGPT 回你一段 code 叫你自己跑」,是 Claude Code 直接動你的檔案系統、跑 Python、產生新檔。這個差距決定了它能不能取代「Excel 操作員」這個角色。

## Demo 2:整理 24 個亂七八糟的檔案

我打開一個 Downloads 子資料夾,裡面 24 個檔案——投影片、PDF、隨手存的圖、半路下載到一半的影片、3 個亂命名的 `新建資料夾(2)`。

一句話:

> 看一下這個資料夾,按你判斷的類型分到子資料夾。

它先列出所有檔案、自己分類(圖片、文件、影片、雜項)、`mkdir` 4 個資料夾、`mv` 全部進去。30 秒搞定。

**但這裡有個關鍵**:Claude Code 沒問我「要不要動」就直接動了——這就是下面要講的 permission mode 在作怪。我那時開的是 `acceptEdits`(自動接受編輯),它把 `mkdir` 跟 `mv` 都當作可自動執行的指令。如果我開的是預設模式,它每搬一個檔案會問一次,30 個檔案問 30 次,demo 直接死。

模式選擇就是「速度 vs 安全」的拉扯,後面詳述。

## Demo 3:從 SQLite 撈 4 月營收

第三個 demo 我打開一個工作專案——一個用 SQLite 存交易紀錄的小工具。我打:

> 用 SQL 查 2026 年 4 月的營收總額,按產品分類列出 top 5。

它讀了 `schema.sql`、看欄位、寫了一個 JOIN 兩張表的 query、跑、回我表格。

這個 demo 在小班現場最炸——因為現場 7 個學員裡有 4 個是公司營業員、會計、行政,平常天天在 SQL Server / MSSQL 跟 Excel 之間搬資料。「我以為要會寫 SQL 才能用」是他們的盲點,**Claude Code 寫 SQL 寫得比 80% 的人類強,你只要會看結果對不對**。

當然這也是邊界——下面會說的,**它如果寫錯 SQL 你看不出來,那你就慘了**。

## Demo 4:從零部署一個個人網站

第四個 demo 是「showcase」:從 0 開始,要它做一個個人形象網站、丟到 GitHub Pages 上、給我網址。

我打:

> 幫我做一個個人形象網站,介紹我是 AI 講師,放 Hero、About、聯絡資訊三個區塊,用 Astro,做完部署到 GitHub Pages。

它做了 7 件事:`mkdir` 專案資料夾、`npm create astro@latest`、跑 install、寫三個 component、跑 `npm run build`、`git init` + `git remote add` + push、設定 GitHub Pages 部署 workflow。

12 分鐘後我手機打開 URL 看到網站。

**這個 demo 不是為了教 Astro,是為了「製造看見」**——讓現場學員親眼看到「我不會寫前端也能有網站」這件事是真的。學完第一堂回家,你可以複製這個 prompt、丟給自己訂閱的 Claude Code 跑一次。

## 4 種 permission mode 怎麼選

[官方文件](https://code.claude.com/docs/en/permission-modes) 列了 4 種主要 mode,Shift+Tab 可以在前 3 個之間切換:

```
┌─────────────────┬──────────────────────────────────────┬────────────────┐
│ Mode            │ 行為                                 │ 適用場景       │
├─────────────────┼──────────────────────────────────────┼────────────────┤
│ default         │ 每次寫檔 / 跑指令都問一次            │ 新環境探索     │
│ acceptEdits     │ 寫檔不問,跑指令還是問                │ 改 code、整理檔│
│ plan            │ 唯讀,只能看不能動                    │ 探索陌生 repo  │
│ bypassPermissions│ 全部不問(=`--dangerously-skip-perms`)│ 自動化、頭鐵   │
└─────────────────┴──────────────────────────────────────┴────────────────┘
```

第 4 個 mode 必須用 CLI flag 啟動、Shift+Tab 不會切到——這是 Anthropic 故意的設計。它叫「dangerously-skip-permissions」就是要嚇你。它在 Linux/macOS 上拒絕用 root 跑(會直接 refuse to start),這是基本防護。

**現場示範**:我跑了一個簡單 prompt「在 tmp 資料夾建一個 hello.txt」,分別用 default、acceptEdits、bypassPermissions 跑三次。default 跳出 yes/no 對話框問我;acceptEdits 直接做;bypassPermissions 連 log 都沒多印——快是真的快,但你也少了一個「停下來看」的機會。

我自己的工作流:**重要專案開 default,實驗 sandbox 開 acceptEdits,headless 自動化跑 batch 才用 bypassPermissions**。我有設一個 alias `cc='claude --dangerously-skip-permissions'`,但你新手前兩週千萬不要設這個,先養成「看到對話框停一下、看清楚再點 yes」的本能。

> 補充:Anthropic 2026 年新出一個 **Auto Mode**——用 model-based classifier 自動判斷哪些動作要問、哪些可以放行,介於人工逐一審核跟 bypassPermissions 中間。但它[只給 Max / Team / Enterprise / API 用戶](https://www.anthropic.com/engineering/claude-code-auto-mode),Pro 訂閱目前用不到。我們這個小班暫時跳過,等它 GA 給 Pro 再講。

## .claudeignore 跟 Claude 邊界

跟 `.gitignore` 同邏輯:你不想給 Claude Code 看見的檔案 / 資料夾,寫進這個檔。常見內容:

```
node_modules/
.env
.env.*
*.key
*.pem
credentials.json
.git/
*.sqlite-journal
```

**為什麼重要**:Claude Code 預設會 `glob` 你整個專案目錄。如果你 `.env` 裡有 API key、然後叫它「幫我看看為什麼這個服務連不上」,它有非常高的機率會把 key 印到 stdout 給你看。stdout 是你的事——但如果你截圖、貼到社群、傳給朋友,就外洩了。

`.claudeignore` 不是萬靈丹,**最根本的防護是:credentials 不要進專案目錄,放 `~/.config/` 或 1Password 或環境變數**。

### Claude 邊界——這堂課最重要的觀念

逐字稿原話:**「不要讓 AI 做你也不懂的事情。AI 犯錯的時候會非常自信。」**

具體舉例:
- **你會寫 Python,Claude 寫 Python**:你看得出 bug,放心給它做。
- **你不會寫 Rust,Claude 寫 Rust**:它寫了一個會 deadlock 的 mutex 結構,你看不出來,build 過了就以為對了——上線就爆。
- **你不懂稅法,Claude 寫稅務計算邏輯**:它可能引用 2019 年的稅率、把營業稅跟個人所得稅搞混,你看不出差別,客戶就拿你的試算結果去報稅。

這條規則不是要你「永遠別碰新東西」,是要你**碰新東西的時候多走一個查證步驟**——它說稅率是 5%,你去查國稅局官網確認;它說某 API 端點是 `/v2/users`,你去查那個服務的 docs 確認。Claude Code 內建的查 docs 動作不是「替代你的查證」,是「輔助你的查證」。

## 常見問題 FAQ

(這個段落會被網站 build 成 FAQ JSON-LD,給 ChatGPT / Perplexity / Claude / Gemini 搜尋時抓得到。)

## 明天預告:第二堂「馴服」

第一堂讓你「看見」這把刀。第二堂我們開始**馴服它**——CLAUDE.md(全域 + 專案)怎麼寫、十大 prompt 定義、Plan Mode 怎麼用、Ultra Think 是什麼、`/compact` 跟 `/resume` 救 context 救命指令、為什麼我設一個「早上 7 點 Line 通知」的 schedule。

> 第二堂連結:[Pro 版 Claude Code 第二堂:馴服 CLAUDE.md + 十大定義 + Plan Mode + 早 7 點 Line 通知](/ai-lecturer-bob/blog/claude-code-lesson-2/)(明天 2026-05-21 上線)

## 延伸資源

- [Claude Pro 定價頁](https://claude.com/pricing) — 月繳 $20 / 年繳 $200,內含 Claude Code CLI 額度
- [Permission Modes 官方文件](https://code.claude.com/docs/en/permission-modes) — 4 種模式詳細行為對照
- [Claude Code Auto Mode 介紹](https://www.anthropic.com/engineering/claude-code-auto-mode) — 2026 新出、Pro 還用不到,先了解趨勢
- [Astro Quick Start](https://docs.astro.build/en/getting-started/) — Demo 4 用的框架
- 同站延伸:
  - [一篇給完全新手看的 Hermes Agent 介紹](/ai-lecturer-bob/blog/hermes-agent-intro/) — 想試 Claude Code 以外的 AI agent 看這篇
  - [兩個教訓:Astro base path + 跨檔案任務該開 TaskList](/ai-lecturer-bob/blog/claude-code-two-lessons-astro-and-tasklist/) — Demo 4 之後我自己踩的坑

---

**寫這篇的目的不是炫耀 demo 跑得多漂亮,是給訂閱了 Pro 但還沒裝 Claude Code 的人一個「我也可以試試看」的具體起點。**4 個 demo 你複製 prompt 回家自己跑一次,跑完你會自然想看第二堂——因為你會發現它每次都從零開始、不記得上次幹了什麼,**這就是要 CLAUDE.md 上場的訊號**。

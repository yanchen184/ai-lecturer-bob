# Pro 版 Claude Code 第二堂:馴服 CLAUDE.md + 十大 prompt 定義 + 早 7 點 Line 通知

> **本文寫給誰看**:訂閱 Claude Pro($20/月)、看過[第一堂](/ai-lecturer-bob/blog/claude-code-lesson-1/) 4 個 demo 的人。第一堂讓你「看見」這把刀,這堂課我們開始**馴服它**——讓它記得你是誰、按你的紀律做事、累的時候會自動 compact、半夜還能幫你跑長任務。本文是 2026-05-05 第二堂 54 分鐘的完整紀錄。

## TL;DR

第二堂的核心是**「它在幕後默默觀察你」**——Claude Code 預設每次開啟都是失憶的,但只要你寫了 `~/.claude/CLAUDE.md`(全域) + `<專案>/CLAUDE.md`(專案),它就會在每次對話開頭把這兩份檔案讀進去當作「永遠的指令」。配合**十大 prompt 定義**寫好這份檔,它就會記得你叫什麼、用什麼工作風格、忌諱哪些字眼。本堂同時帶過 `/compact`、`/resume`、`pwd/ls/cd`、Ultra Think 強化思考模式、最後用一個「早上 7 點 Line 通知前一天踩坑」的實際 `/schedule` 把整堂課收束。

## 目錄

- [從第一堂回來:你應該已經會的事](#從第一堂回來你應該已經會的事)
- [Status Line:活著的訊息列](#status-line活著的訊息列)
- [/compact:它累了會主動說](#compact它累了會主動說)
- [`claude --continue` 跟 `/resume`:救命指令](#claude---continue-跟-resume救命指令)
- [pwd / ls / cd:在 Claude 裡開檔的最短路](#pwd--ls--cd在-claude-裡開檔的最短路)
- [CLAUDE.md 十大定義:全域 + 專案兩層](#claudemd-十大定義全域--專案兩層)
- [自己建立 sub-agent:第一個現場 demo](#自己建立-sub-agent第一個現場-demo)
- [MCP 是什麼:給它新工具](#mcp-是什麼給它新工具)
- [Ultra Think:馬力全開模式](#ultra-think馬力全開模式)
- [/schedule:早上 7 點 Line 通知前一天踩坑](#schedule早上-7-點-line-通知前一天踩坑)
- [常見問題 FAQ](#常見問題-faq)
- [明天預告:第三堂「自動化」](#明天預告第三堂自動化)
- [延伸資源](#延伸資源)

## 從第一堂回來:你應該已經會的事

回家作業是 [第一堂](/ai-lecturer-bob/blog/claude-code-lesson-1/) 的 Demo 4——從零部署個人網站。現場 7 個人有 5 個跑出網站、2 個卡在 GitHub Pages 設定(後來 office hour 救回來)。我把這當第二堂的開場:**你已經有一個「能跑出網站的本能」,接下來要養成的是「每次叫 Claude 做事都不浪費」**。

## Status Line:活著的訊息列

打開 Claude Code 你會看到底部一行小字——目前的 model、目前的權限模式、已用 token 數、上次 commit 多久前。預設 status line 已經夠用,但你可以改:`~/.claude/settings.json` 裡加一個 `statusLine` block,寫一支 shell script 印出你要的內容。

我自己的 status line 多加了兩個東西:
1. 當前 git branch
2. 當前 Sonnet 或 Opus 用了多少額度(用 `~/.claude/limits` 解析)

`/statusline-setup` 這個 skill 可以幫你產一個,新手第一堂不用碰、第二堂可以開始玩。

## /compact:它累了會主動說

Claude Code 的 context window 是有限的——Sonnet 4.6 / Opus 4.7 大約 200K tokens。**用滿之後對話會變遲緩、開始忘記前面講的、回覆品質掉下來**。

它累了會主動跳出來:
> Your context is getting full. Consider running `/compact` to free up space.

`/compact` 做的事是「保留摘要、扔掉細節」——把前面所有對話濃縮成一份簡明備忘錄,你之後跟它聊的時候,它記得「我們在做什麼」、但不記得「兩小時前那個 import 路徑長什麼樣」。

**我的習慣**:長任務每 90 分鐘主動跑一次 `/compact`,不等它叫我。等它叫的時候通常已經很卡了。

如果你想完全重來,`/clear` 直接清光,但前提是你已經把該寫的進 CLAUDE.md 了——不然下次它又從零開始,失憶。

## `claude --continue` 跟 `/resume`:救命指令

兩個情境會用到:

**情境 1:terminal 不小心關了**——重開 terminal、`cd` 回專案資料夾、跑 `claude --continue`,它會從上次離開的點接回來,連 context 都還在。這比 ChatGPT「對話歷史」可靠多了,因為它存在你本機 `~/.claude/projects/<path-encoded>/`。

**情境 2:你切到別的 session 想回來這個**——`/resume` 在 Claude Code 內列出最近 5 個 session,選一個跳回去。

[官方 headless 文件](https://code.claude.com/docs/en/headless) 提到一個未來改變:**2026-06-15 起,`claude -p`(headless mode)的用量會從新的「Agent SDK credit」扣,跟你互動式 Pro 用量分開記**。對 Pro 訂閱者來說,意思是「半夜寫 batch 別吃光白天的額度」——這在第三堂講。

## pwd / ls / cd:在 Claude 裡開檔的最短路

Claude Code 內建可以直接執行 bash 指令(預設模式會問你 yes/no、acceptEdits 直接跑)。三個最常用:

```bash
pwd           # 我現在在哪個資料夾
ls -la        # 這個資料夾裡有什麼
cd ~/workspace/popularize   # 切到指定資料夾
```

**為什麼第二堂才講**——因為第一堂的目標是「看見它能做什麼」,你不需要懂底層。第二堂開始你要「指揮它」,就要知道「指揮的座標系」是什麼:**你的 working directory + 你的檔案結構**。Claude 看不到你心裡想的「桌面那個檔案」,它只看到 `pwd` 印出來的路徑。

實際示範:我用 `cd ~/Downloads` + `ls` + 「幫我看看哪些檔案超過 30 天沒動」一氣呵成。**清晰的座標 + 明確的指令 = 它做得對的根本。**

## CLAUDE.md 十大定義:全域 + 專案兩層

這是第二堂最核心的觀念。Claude Code 開啟時會自動讀 **兩個** `CLAUDE.md`:

```
~/.claude/CLAUDE.md          ← 全域,所有專案共用(你是誰、你的偏好)
<專案目錄>/CLAUDE.md          ← 專案,只在這個 repo 生效(這專案的技術棧、紀律)
```

兩個都會被讀進每次對話的 system prompt,**它在幕後默默觀察你**——不是真的觀察,是真的把這兩份檔當作「永遠在最前面的指令」。

寫好這份檔是一門小學問。我把 prompt 的構成歸納成**十大定義**,這是我課堂上整理的、跟 Anthropic 官方 [Prompt Engineering 指南](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) 同源:

| # | 定義 | 講什麼 | 寫在哪一層 |
|---|---|---|---|
| 1 | 指令 (Prompt) | 你要它做什麼 | 對話 |
| 2 | 上下文 (Context) | 它需要知道的背景 | 對話 / 專案 CLAUDE.md |
| 3 | 人設 (Persona) | 它扮演什麼角色 | 全域 CLAUDE.md |
| 4 | 輸出格式 (Output Format) | 回我表格/條列/code block | 全域或對話 |
| 5 | 約束 (Constraint) | 不要做哪些事 | 全域 CLAUDE.md |
| 6 | 範例 (Few-shot) | 「像這樣寫」的範本 | 對話 |
| 7 | 評估 (Eval) | 怎樣算對 | 專案 CLAUDE.md |
| 8 | 迭代 (Iteration) | 不對就改、改幾次 | 對話 |
| 9 | 護欄 (Guardrail) | 安全限制(別動 production) | 全域 CLAUDE.md |
| 10 | 記憶 (Memory) | 長期累積的偏好 | 全域 CLAUDE.md |

**十大不是十個寫滿才合格**,是「你寫 CLAUDE.md 卡住的時候對照看自己漏了哪幾項」。我的全域 CLAUDE.md 重點放在 3、4、5、9、10——人設(資深工程師同事)、輸出格式(繁體中文簡潔)、約束(不准 commit credentials)、護欄(不准 force push)、記憶(memory 索引在哪)。

> **現場小笑點**:有學員問「我可以寫『不要讚美我』嗎?」——可以,而且很有用。我的 CLAUDE.md 第一條就是「禁開場白:太棒了/這是個好問題/沒問題」。它**真的會照做**,因為這在 Anthropic constitutional AI 的訓練裡權重很高,使用者明確要求的拒絕語氣會被尊重。

## 自己建立 sub-agent:第一個現場 demo

Claude Code 有 sub-agent 機制——可以讓主 agent 開一個小弟去做特定任務、結果回報。我現場 demo 建一個叫 `weekly-report` 的:

```
/agents create
> name: weekly-report
> description: 從 Discord 訊息撈一週重點寫週報
> instructions: 你是行銷部週報寫手,讀 #general 跟 #campaigns 兩個 channel 過去 7 天訊息,挑 5 件重要的,用條列寫,每條 ≤ 60 字。
```

建完之後我打:`/agent weekly-report 跑一下`,它就跑去抓訊息、寫報告、回我一份 markdown。

**這個 demo 在第二堂是埋種子,第三堂才完整講**——sub-agent 跟 Skill 跟 Slash Command 的差別很大,新手很容易混淆,我們留到自動化那堂課展開。

## MCP 是什麼:給它新工具

MCP = Model Context Protocol,Anthropic 推的「給 AI 工具」標準協議。一句話講:**讓 Claude 能呼叫你電腦/網路上不在它預設能力範圍裡的東西**。

舉例:
- **MCP playwright**:讓它能開瀏覽器、點按鈕、截圖
- **MCP github**:讓它能直接讀 PR、留 comment、merge
- **MCP twinkle-hub**:[整合 data.gov.tw 52,960 筆台灣政府開放資料的 MCP](https://hub.twinkleai.tw),讓它能查標案、實價登錄、立法院議案

第二堂我只簡介概念,**MCP 真正的安裝跟踩坑在第四堂——因為它牽涉到 token、Chrome 介接、conflict 排查,一次給太多會直接消化不良**。先讓「MCP = 工具背包,可以加東西」這個概念落地就夠了。

## Ultra Think:馬力全開模式

Claude 4 系列有一個叫 Extended Thinking 的特性——讓模型在回覆前先「想一段時間」,把 reasoning chain 全部跑完才動。預設是開的、但有上限。

開啟更深的 thinking:

- **官方文件記載**:macOS 用 `Option+T`,Windows/Linux 用 `Alt+T`(toggle)
- **我上課時示範的快捷鍵**:`Alt+Ctrl+Shift+H`(馬力全開模式,把 token budget 拉到上限 31,999)

> 兩個快捷鍵都試試看,看你環境哪個生效。如果你用第三方 terminal(WezTerm、iTerm2),按鍵可能被 terminal 攔截,要去 keybinding 設定排除。

**什麼時候用 Ultra Think**:
- 設計階段——技術選型、資料模型、API shape
- Debug 一個你已經想 30 分鐘的怪 bug
- 寫 prompt 的 prompt(meta-prompt)

**什麼時候不要開**:
- 簡單 CRUD、改 typo、跑 build
- 你已經知道答案,只是要它打字

Ultra Think 會吃比較多 token + 時間,但回覆品質明顯高一階。Pro 訂閱者開來用、額度撐得住。

## /schedule:早上 7 點 Line 通知前一天踩坑

這是第二堂的收尾——也是學員回家最 wow 的一個。

`/schedule` 是 Claude Code 內建的 skill([官方文件](https://code.claude.com/docs/en/loop-and-schedule)),讓你設定「定時跑某個 prompt」。我現場設了一個:

> 每天早上 7:00 跑這個任務:讀 `~/workspace/<我目前最大專案>/CLAUDE.md` 跟昨天的 commit log,挑出 1 個你覺得我可能會忘的踩坑、用 Line Notify 推一則訊息給我,訊息結尾附今天該補的一件事。

它建了一個 routine、確認排程、回我「明天早上 7 點開始」。

**為什麼這個 demo 震撼**——學員的反應是「原來 AI 可以主動找我,不只是我問它才回」。這在概念上是個跨越:從**反應式 chatbot → 主動式 agent**。Pro 訂閱有夠用的額度跑這種小任務(每天 1 次、每次 ≤ 2 分鐘),完全不影響白天的互動額度。

> 註:`/schedule` 跟 `/loop` 都是 2026 三月推出、最多 50 個 task/session、7 天自動過期。我們第三堂會把 `/loop` 講完——它跟 `/schedule` 的差別是「定時 vs 連續迭代」。

## 常見問題 FAQ

(這個段落會被網站 build 成 FAQ JSON-LD,給 ChatGPT / Perplexity / Claude / Gemini 搜尋時抓得到。)

## 明天預告:第三堂「自動化」

第二堂讓你**寫好兩份 CLAUDE.md**、知道**十大 prompt 定義**、會用 `/compact /resume`、看過 Ultra Think 跟 `/schedule`。

第三堂我們把 **Skill / Sub-agent / Slash Command** 三個概念拆乾淨——它們長得很像但用法天差地遠。然後我會現場 demo 一個「掃描桌面 202 個檔案、分類整理」的 sub-agent,以及一個「每天 5:03 寄 AI 日報到我信箱」的 `/loop`。再講 Hook(任務跑超過 5 分鐘自動跳通知)、Remote Control(QR code 手機操控你電腦上的 Claude)、跟一個叫 `ralph-wiggum` 的迭代工具(來自辛普森家庭那個 Ralph)。

> 第三堂連結:[Pro 版 Claude Code 第三堂:Skill / Agent / Loop / Hook / Remote Control](/ai-lecturer-bob/blog/claude-code-lesson-3/)(明天 2026-05-22 上線)

## 延伸資源

- [Claude Code Permission Modes](https://code.claude.com/docs/en/permission-modes) — 第一堂講的 4 種模式,第二堂加深用
- [Anthropic Prompt Engineering Overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) — 十大定義的官方對應材料
- [Claude Code /loop 跟 /schedule 介紹](https://code.claude.com/docs/en/loop-and-schedule) — 第二堂尾巴的 demo 來源
- [Headless mode 文件](https://code.claude.com/docs/en/headless) — `claude -p`、`--continue`、2026-06-15 後額度規則變動
- [Model Context Protocol(MCP)入門](https://modelcontextprotocol.io/) — 第四堂才會真的裝,先看概念
- 同站延伸:
  - [Pro 版 Claude Code 第一堂:從零到「看見」](/ai-lecturer-bob/blog/claude-code-lesson-1/) — 還沒看的請先補
  - [MemPalace 3.3.5 救援實錄 + claude -p HTTP proxy](/ai-lecturer-bob/blog/mempalace-3-3-5-claude-p-proxy/) — 把 headless `claude -p` 包成 OpenAI 端點的進階玩法

---

**寫 CLAUDE.md 不是寫文件——是把你自己訓練成「對 Claude 講話會有用的人」**。十大定義是骨架,實際的 CLAUDE.md 都是邊用邊改,我自己這份檔到 2026-05 為止改了 47 次 commit。你的第一版不會完美,但有第一版才有第二版。

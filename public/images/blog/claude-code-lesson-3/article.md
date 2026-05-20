# Pro 版 Claude Code 第三堂:Skill / Agent / Slash Command 拆乾淨 + Loop 自動化 + Hook + Remote Control

> **本文寫給誰看**:訂閱 Claude Pro($20/月)、已看過 [第一堂](/ai-lecturer-bob/blog/claude-code-lesson-1/)、[第二堂](/ai-lecturer-bob/blog/claude-code-lesson-2/) 的人。第二堂寫好兩份 CLAUDE.md,這堂課我們從「給它工作風格」升級到「給它腳本+定時+遠端遙控」。本文是 2026-05-12 第三堂 54 分鐘的完整紀錄。

## TL;DR

第三堂主題是**「AI 會偷懶,你不能讓它躺平」**。Skill / Sub-agent / Slash Command 三個東西長得像、其實完全不同——Skill 是觸發式的小教學文件、Sub-agent 是有獨立 context 的小弟、Slash Command 是你定義的快捷指令。先把這三個拆乾淨,再上 `/loop`(連續迭代到滿意)、Hook(自動觸發 shell)、Remote Control(QR code 手機操控)、ralph-wiggum(辛普森家庭那個 Ralph,負責 max-iterate=20 的死磕迴圈)。Pro 訂閱者跑這些自動化任務剛好夠額度,不會吃光白天互動配額。

## 目錄

- [從第二堂回來:應該已經有的 CLAUDE.md](#從第二堂回來應該已經有的-claudemd)
- [Skill / Sub-agent / Slash Command:三個容易混的東西](#skill--sub-agent--slash-command三個容易混的東西)
- [現場 demo 1:寫一個「週報 Skill」](#現場-demo-1寫一個週報-skill)
- [Model 切換:--model 跟什麼時候用 Opus](#model-切換--model-跟什麼時候用-opus)
- [`/compact` + `/clear` 的對照表](#compact--clear-的對照表)
- [現場 demo 2:sub-agent 掃描桌面 202 個檔案](#現場-demo-2sub-agent-掃描桌面-202-個檔案)
- [`/loop` + `/schedule`:每天 5:03 自動寄 AI 日報](#loop--schedule每天-503-自動寄-ai-日報)
- [Hook:任務跑超過 5 分鐘自動通知](#hook任務跑超過-5-分鐘自動通知)
- [Remote Control:手機掃 QR code 操控你電腦](#remote-control手機掃-qr-code-操控你電腦)
- [ralph-wiggum:max-iterate=20 的死磕工具](#ralph-wiggummax-iterate20-的死磕工具)
- [常見問題 FAQ](#常見問題-faq)
- [明天預告:第四堂「Superpowers + MCP + GitHub」](#明天預告第四堂superpowers--mcp--github)
- [延伸資源](#延伸資源)

## 從第二堂回來:應該已經有的 CLAUDE.md

第二堂回家作業是寫好你自己的 `~/.claude/CLAUDE.md`(全域 ≥ 30 行)+ 你最常用專案的 `<repo>/CLAUDE.md`(≥ 20 行)。第三堂開場我抽問——「你的全域 CLAUDE.md 第一條寫什麼?」7 個學員有 6 個答得出來(禁開場白、繁體中文、絕對路徑等等),1 個還沒寫——我給他開個小組任務,等下午再追。

**寫得出來才有第三堂可以聽**——後面講的 Skill / Sub-agent 都會引用 CLAUDE.md 裡的規則,沒這層底子就只是看煙火。

## Skill / Sub-agent / Slash Command:三個容易混的東西

這是學員最容易卡的觀念。我用一張對照表收乾淨:

```
┌──────────────────┬─────────────────────┬──────────────────────┬──────────────────────┐
│                  │ Skill               │ Sub-agent            │ Slash Command        │
├──────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤
│ 本質             │ markdown 教學文件   │ 有獨立 context 的小弟│ 你定義的快捷指令     │
│ 何時觸發         │ 主 agent 判斷需要時 │ 主 agent 明確指派    │ 你打 `/xxx`         │
│ 有自己 context?  │ 否(融入主 agent)  │ 是(獨立記憶體)     │ 否(就是指令)       │
│ 寫法             │ SKILL.md + 觸發句   │ agent definition + prompt│ .md 檔 + frontmatter│
│ 適合做           │ 給工作流加紀律      │ 平行跑、把大任務拆掉 │ 一鍵跑常用 prompt    │
│ 比喻             │ SOP 手冊            │ 派外包               │ 鍵盤快捷鍵           │
└──────────────────┴─────────────────────┴──────────────────────┴──────────────────────┘
```

**最常見的誤解**:
- 「Skill = 函式」——錯。Skill 沒有 invoke,是主 agent 自己看 description 決定要不要拿來讀。
- 「Sub-agent = 多視窗」——也錯。它是另一個獨立 Claude session,跟你眼前這個沒有共享記憶。
- 「Slash Command = Bash alias」——半對。它 expand 出一個 prompt,但 prompt 可以引用 frontmatter 的參數,比 alias 強。

## 現場 demo 1:寫一個「週報 Skill」

我現場新建一個 skill:

```bash
mkdir -p ~/.claude/skills/weekly-report
cat > ~/.claude/skills/weekly-report/SKILL.md <<EOF
---
name: weekly-report
description: 寫公司週報的標準流程。觸發詞:週報、weekly report、本週、回顧。
---

# 週報 SOP

1. 列出本週完成的事(從 git log + Linear ticket)
2. 列出下週要做的事(從 task list)
3. 列出 blocker(寫成「我需要 X 幫忙」)
4. 結尾一句 mood——本週能量 / 焦慮 / 興奮 / 卡關

格式用 markdown,簡潔、不寫廢話、≤ 200 字。
EOF
```

寫完之後我跟 Claude 講「幫我寫本週週報」——它讀到「週報」這個觸發詞、自動把 SKILL.md 載進 context、照 SOP 跑。**重點是:我沒有 `/weekly-report` 這個指令,Skill 完全是主 agent 自己決定要不要用**。

「觸發詞」寫得好不好決定 Skill 會不會被用對。寫太籠統(「報告」)它每次寫東西都會 trigger;寫太窄(「公司週報 SOP v2」)它永遠不會 trigger。**訣竅是:寫使用者真的會打的口語詞**。

## Model 切換:--model 跟什麼時候用 Opus

Claude Code 預設用 Sonnet 4.6([2026-02 發布](https://www.anthropic.com/news/claude-sonnet-4-6),寫 code 表現勝過上一代 Opus 4.5)。但 Pro 訂閱也包含 Opus 4.7,需要時可以切:

```bash
# 啟動 session 時指定
claude --model opus

# session 內切換
/model opus

# 在 prompt 暫時用 Opus 跑(只這次)
/think-with opus 「複雜架構決策...」
```

**什麼時候用 Opus 4.7**:
- 複雜系統設計、技術選型
- 長 reasoning chain(看歷史程式碼推測為什麼這樣寫)
- 「Sonnet 兩次都跑歪了」這種狀況——直接升 Opus 通常會解

**什麼時候用 Sonnet 4.6**:
- 9 成日常 coding、refactor、寫測試
- 跑 batch 任務(Opus 比較慢、比較貴)
- pair programming 模式(快比深更重要)

Opus 4.7 是 [2026-04 推出](https://www.anthropic.com/news/claude-opus-4-7),3x 圖像解析度、xhigh effort level、自我驗證 output。我自己工作流的比例大概是 Sonnet 90% / Opus 10%,只在「我已經卡 20 分鐘」才升 Opus。

## `/compact` + `/clear` 的對照表

第二堂講過 `/compact` 是壓縮、`/clear` 是清光。第三堂補一個重點——**它們跟 sub-agent 互動的關係**:

- 你 `/compact` → 主 agent 失去細節、但記得 sub-agent 跑過
- 你 `/clear` → 主 agent 整個重來、sub-agent 紀錄也沒了
- 你開新 session(`claude` 直接跑) → 跟 `/clear` 等價,但前一個 session 用 `claude --continue` 還救得回來

**現場踩坑**:有學員把長任務跑到一半 `/clear` 想「重新開始」,結果之前跑的 sub-agent 任務全丟。**正確姿勢**:長任務先 `/compact`,真要重來才 `/clear`。

## 現場 demo 2:sub-agent 掃描桌面 202 個檔案

主 agent 開一個 sub-agent 跑掃描任務:

```
主 agent:
> 開一個 sub-agent 掃我桌面所有檔案,每個檔案分類成「工作 / 個人 / 雜物 / 不確定」四類,
> 結果寫成 markdown 表格給我。

[ 主 agent 派遣 sub-agent ]
[ sub-agent 在獨立 session 裡掃 202 個檔案、跑 5 分鐘 ]
[ sub-agent 完工、回報 markdown 表格 ]

主 agent:
> 收到。我幫你產出整理計畫,「不確定」那 17 個我列出來你看一下要怎麼分。
```

**為什麼開 sub-agent 而不是直接讓主 agent 做**——因為主 agent 的 context 不能被 202 個 `ls` 結果撐爆。sub-agent 在獨立 context 裡跑完、只回精簡結論,主 agent 的 context 還是乾淨的。

逐字稿原句:**「AI 會偷懶,他可能是一個高覽實習生」**——意思是它不會主動把任務拆得很細,你不指派 sub-agent,它就用主 context 硬幹,然後跑到一半 context 滿了就開始亂答。**主動指派 sub-agent 是讓「實習生」變「中階工程師」的關鍵動作**。

## `/loop` + `/schedule`:每天 5:03 自動寄 AI 日報

第二堂講了 `/schedule` 是定時。第三堂講 `/loop` ——`/loop` 是**連續迭代,Claude 自己決定下一輪要做什麼,跑到滿意或卡住**。[官方文件](https://code.claude.com/docs/en/loop-and-schedule)講得清楚:dynamic loop mode 會自己調整輪詢間隔(60 秒 vs 20-30 分鐘),autonomous mode 可以跑到 3 天。

現場 demo:**每天 5:03 寄 AI 日報**

```
/schedule create
> name: ai-daily-news
> cron: 3 5 * * *  (每天 5:03)
> task: 用 WebSearch 撈過去 24 小時 Anthropic、OpenAI、Google AI 新聞各 3 則,
>       寫成 markdown 寄到 my@email.com,subject 寫日期 + 三家頭條。
```

這個排程跑了一個月,我每天醒來信箱已經有一份 AI 日報——Pro 額度跑這種小任務每天約耗 8K tokens,一個月不到 250K,完全在 Pro 範圍內。

**5:03 為什麼選這個怪時間**——因為 5:00 整很多 cron job 同時起跑、Anthropic API 偶爾會 429,5:03 錯峰避開。逐字稿原句:「5:03 是經驗值,別問」。

`/loop` 在第四堂會配合 `--dangerously-skip-permissions` 完整 demo——那個組合可以「半夜給它一個方向、早上看結果」,本堂先點到。

## Hook:任務跑超過 5 分鐘自動通知

Hook 是 `~/.claude/settings.json` 裡的設定,讓 Claude Code 在特定事件觸發時跑 shell 指令。3 種 hook:

- **PreToolUse**:工具被呼叫前(可以攔截、改參數)
- **PostToolUse**:工具跑完後(可以驗收、跑 linter)
- **Stop**:session 結束時(可以做 backup、丟通知)

我現場示範:**任務跑超過 5 分鐘自動發 Line 通知**

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "elapsed_seconds > 300",
        "hooks": [
          { "type": "command", "command": "~/.bin/line-notify '任務跑完了'" }
        ]
      }
    ]
  }
}
```

實際 setup 要寫一個簡單 shell script 包 Line Notify API。**為什麼有用**——你叫 Claude Code 跑長任務,你切去做別的事、忘了它,跑完它自己丟訊息到你手機。比你每 30 秒看一次 terminal 健康多了。

## Remote Control:手機掃 QR code 操控你電腦

[Remote Control](https://code.claude.com/docs/en/remote-control) 是 2026-02-24 推出、所有方案都能用的 feature。意思是:

1. 你電腦上 Claude Code 跑著
2. 按空白鍵 toggle 出 QR code
3. 手機 Claude app 掃描
4. 你出門了、走在路上,還能繼續對話、看進度、下新指令

**Claude 本人還是跑在你電腦上**,沒搬到雲端——這個架構決定了它在你斷網時 graceful degradation(手機看不到、電腦繼續跑),也決定了你不用擔心程式碼上雲。

現場示範:我把 demo 1 跑到一半,鎖電腦、拿手機掃 QR、繼續下指令、看 sub-agent 跑完——學員裡面有 3 個直接拿出手機跟著弄、5 分鐘內全跑通。**這個 feature 是 Pro 訂閱跟 Cursor 拉開差距的關鍵之一**,Cursor 沒有等價物。

## ralph-wiggum:max-iterate=20 的死磕工具

`ralph-wiggum` 是社群開發的 Claude Code plugin([辛普森家庭那個 Ralph](https://en.wikipedia.org/wiki/Ralph_Wiggum)),負責「給 Claude 一個目標、它沒做完不准停,最多迭代 20 次」。

跟 `/loop` 不同:
- `/loop` = 我給它一個任務、定期重啟它
- `ralph-loop` = 我給它一個目標、它自己跑、不行就重來、跑到對為止

裝法:

```bash
claude /plugin install obra/superpowers-marketplace ralph-wiggum
```

(注意:第四堂會講為什麼這個 marketplace 來自 [obra/superpowers](https://github.com/obra/superpowers) ——Jesse Vincent 寫的 Superpowers plugin 的延伸生態。)

**逐字稿提到的小坑**:v2.6 / v2.7 偶爾在 iterate count 重置上有 bug,如果你看到它跑超過 20 輪沒停,手動 Ctrl+C 然後 issue 給 obra/superpowers-marketplace。**新手第一次玩設 max-iterate=5**,習慣後再放大。

## 常見問題 FAQ

(這個段落會被網站 build 成 FAQ JSON-LD,給 ChatGPT / Perplexity / Claude / Gemini 搜尋時抓得到。)

## 明天預告:第四堂「Superpowers + MCP + GitHub」

第三堂我們把 Claude Code 內建的 Skill / Agent / Loop / Hook / Remote Control 玩過一輪。第四堂我會徹底翻轉視角:**今天主題應該叫做「我們自己寫一定不是最優解,要如何使用別人寫的」**——Superpowers plugin 安裝、Twinkle Hub MCP 接政府開放資料、GitHub 註冊跟 gh CLI auth、headless 模式半夜 batch。

我在第四堂卡關 3 次、被學員救場 1 次,完整紀錄都在那篇——**真實上課 demo 比教學計畫更有教育意義**。

> 第四堂連結:[Pro 版 Claude Code 第四堂:Superpowers + MCP + GitHub + Headless 半夜跑 batch](/ai-lecturer-bob/blog/claude-code-lesson-4/)(明天 2026-05-23 上線)

## 延伸資源

- [Claude Code Skills 官方文件](https://docs.anthropic.com/en/docs/claude-code/sub-agents) — Skill 跟 Sub-agent 的官方差別
- [Claude Code Remote Control](https://code.claude.com/docs/en/remote-control) — 手機 QR 碼操控詳細 setup
- [/loop 跟 /schedule 文件](https://code.claude.com/docs/en/loop-and-schedule) — autonomous mode 細節
- [Claude Sonnet 4.6 介紹](https://www.anthropic.com/news/claude-sonnet-4-6) — 預設 model
- [Claude Opus 4.7 介紹](https://www.anthropic.com/news/claude-opus-4-7) — 升級 model
- [obra/superpowers marketplace](https://github.com/obra/superpowers-marketplace) — ralph-wiggum 跟 superpowers 主 plugin 來源
- 同站延伸:
  - [Ralph Loop 實戰](/ai-lecturer-bob/blog/ralph-loop-real-world/) — ralph-wiggum 進階用法
  - [兩個 Claude Code 教訓:Astro 跟 TaskList](/ai-lecturer-bob/blog/claude-code-two-lessons-astro-and-tasklist/) — 我自己跑 sub-agent 寫文章的踩坑

---

**第三堂的本質是「分工」**——你要把「凡事自己幹」改成「該外包就外包」。Sub-agent 是外包、Hook 是助理、Loop 是定時器、Remote Control 是你出門時的接線員。Pro 訂閱 $20/月買的不只是 Claude,是一整套「個人指揮中心」的基礎建設。

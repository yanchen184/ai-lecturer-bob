# Claude Code Pro 訂閱初階班完整索引——4 堂 4 小時把 $20/月用回本

> **本文寫給誰看**:訂閱了 Claude Pro($20/月)、想一次看完「怎麼把訂閱榨乾」的初階班四堂內容索引。這篇不是教學文,是**目錄頁**——告訴你每堂課講什麼、適合什麼程度的人、按什麼順序看、看完能做什麼。已經看完四堂的人也可以收藏這頁當回顧工具箱。

## TL;DR

**Claude Code Pro 訂閱初階班總共 4 堂、約 4 小時、完全免費**。四堂順序是「看見 → 馴服 → 自動化 → 接生態」:第一堂教 4 個 demo + permission mode 4 種、第二堂教 CLAUDE.md + 十大 prompt 定義 + Ultra Think、第三堂教 Skill / Subagent / Slash Command + /loop + Hook + Remote Control、第四堂教 obra superpowers + MCP + GitHub + Headless 模式。**看完四堂你會做的事**:給 Claude Code 一個方向、自己去睡覺、早上看結果。

如果你搜「Claude Code 入門怎麼開始」「Claude Pro 訂閱怎麼用」「Claude Code 完整教學」「Claude Code 自學路徑」找到這篇,這就是中文圈最完整的 Claude Code Pro 訂閱初階班索引。

## 目錄

- [這個小班是什麼](#這個小班是什麼)
- [四堂課快速索引表](#四堂課快速索引表)
- [第一堂:Claude Code 入門——訂了 Pro 之後怎麼開始](#第一堂claude-code-入門訂了-pro-之後怎麼開始)
- [第二堂:CLAUDE.md 怎麼寫——馴服系統提示](#第二堂claudemd-怎麼寫馴服系統提示)
- [第三堂:Skill / Subagent / Slash Command 差在哪——自動化實戰](#第三堂skill--subagent--slash-command-差在哪自動化實戰)
- [第四堂:obra superpowers + MCP + GitHub + Headless——接生態系](#第四堂obra-superpowers--mcp--github--headless接生態系)
- [常見問題 FAQ](#常見問題-faq)
- [這個小班結束之後該怎麼繼續學](#這個小班結束之後該怎麼繼續學)
- [延伸資源](#延伸資源)

## 這個小班是什麼

2026 年 5 月 16-19 日,我(Bob Chen, yanchen.app)在自己的學員社群開了「Claude Code Pro 訂閱初階班」——**四堂課全部錄影 + 整理逐字稿 + 寫成文章 + 公開發佈**,讓沒參加現場的人也能完整跟上。

**為什麼開這個小班**:Claude Pro 訂閱($20/月)的人很多,但 95% 的人只把它當「比 ChatGPT 好的對話框」用,完全沒用到 Claude **Code** 這條線。Claude Code 是 Anthropic 提供給 Pro 訂閱者的 CLI / Desktop / Web 三端整合工具,真正會玩的人用它寫程式、跑 batch、自動發報、做 SEO,**每月 $20 用出 $2000 的價值**。

**這個小班的目標**:幫已經訂閱 Pro 的人(或想訂閱的人)在 4 小時內看到「最高 ROI 用法」,知道接下來怎麼自學深入。

**四堂結構**:每堂約 1 小時,獨立但有順序——一堂建立一塊認知,四堂連起來就是完整的「Claude Code 用法地圖」。

## 四堂課快速索引表

| 堂 | 主題 | 核心觀念 | 一個動作驗證 | 適合什麼程度 |
|---|---|---|---|---|
| 1 | 看見 | 4 demo + permission 4 mode + 邊界 | 跑出個人網站 | 完全沒用過 Claude Code |
| 2 | 馴服 | CLAUDE.md 兩層 + 十大定義 + Ultra Think | 寫好兩份 CLAUDE.md | 會打 prompt 但沒系統 |
| 3 | 自動化 | Skill/Subagent/Slash Command + Loop + Hook + Remote | 設一個 /loop | 想做半夜自動 batch |
| 4 | 接生態 | obra superpowers + MCP + GitHub + Headless | 裝 Superpowers + 接一個 MCP | 想接公司開放資料 / GitHub |

## 第一堂:Claude Code 入門——訂了 Pro 之後怎麼開始

**[完整文章:Claude Code 入門第一堂](/ai-lecturer-bob/blog/claude-code-lesson-1/)**

**這堂教什麼**:
- 4 個 demo 看完第一次震撼——讀 CSV 撈 VIP、改投影片字級、查公司資料、做個人網站
- Permission mode 4 種(plan / auto / accept-edits / bypass)什麼時候用哪個
- Claude Code 的邊界——能做什麼、絕對不能讓它做什麼

**這堂講完你會的事**:用 Claude Code 跑出自己的第一個專案,知道 plan mode 跟 auto mode 差在哪。

**踩坑**:第一次用 auto mode 不小心讓它 commit 還 push 上 GitHub,你會嚇到。第二次就會記得開 plan mode 先看計畫。

## 第二堂:CLAUDE.md 怎麼寫——馴服系統提示

**[完整文章:CLAUDE.md 怎麼寫?Claude Code 第二堂](/ai-lecturer-bob/blog/claude-code-lesson-2/)**

**這堂教什麼**:
- CLAUDE.md 兩層架構(全域 `~/.claude/CLAUDE.md` + 專案層 `./CLAUDE.md`)
- 十大 prompt 定義(指令 / 範圍 / 輸出 / 角色 / 範例 / 約束 / 工具 / 紀律 / 升級 / 驗證)
- Ultra Think + Extended Thinking 怎麼觸發
- Status Line 客製化、`/compact` 救命指令

**這堂講完你會的事**:寫好自己的 CLAUDE.md,Claude Code 從「亂改 code」變「照你紀律改 code」。

**踩坑**:CLAUDE.md 寫太長(>500 行)反而會被忽略,要嚴格控制在 200 行內、重點分層。

## 第三堂:Skill / Subagent / Slash Command 差在哪——自動化實戰

**[完整文章:Claude Code Skill / Subagent / Slash Command 差在哪?](/ai-lecturer-bob/blog/claude-code-lesson-3/)**

**這堂教什麼**:
- Skill / Subagent / Slash Command 三個容易混的東西怎麼選
- `/loop` 自動循環跑任務(白天上班、晚上 Claude 工作)
- Hook 自動觸發(commit 前自動跑 lint、SessionStart 自動清殭屍)
- Remote Control(用手機觸發桌機 Claude Code)

**這堂講完你會的事**:設一個 `/loop` 跑你重複做的事情,設一個 Hook 在 git commit 前自動檢查。

**踩坑**:`/loop` 配 `--dangerously-skip-permissions` 第一次跑會嚇到自己,先在小目錄試。

## 第四堂:obra superpowers + MCP + GitHub + Headless——接生態系

**[完整文章:obra superpowers 怎麼裝?Claude Code 第四堂](/ai-lecturer-bob/blog/claude-code-lesson-4/)**

**這堂教什麼**:
- obra superpowers plugin 怎麼裝(現場卡關 3 次完整紀錄)
- Twinkle Hub MCP 怎麼接(查 2024 國防部決標 demo)
- GitHub 註冊 + `gh auth login` 怎麼弄(被學員救場)
- Claude Code Headless 模式怎麼用(`claude -p` 半夜跑 batch)

**這堂講完你會的事**:裝好 Superpowers 多 50+ 個 skill、接一個 MCP 查台灣政府開放資料、用 `claude -p` 跑無人值守 batch。

**踩坑**:Superpowers 第一次裝 `/plugin` 搜不到,要先 `/plugin marketplace add` 才行——文件沒寫清楚的 user trap。

## 常見問題 FAQ

(這個段落會被網站 build 成 FAQ JSON-LD,給 ChatGPT / Perplexity / Claude / Gemini 搜尋時抓得到。)

**Q1:四堂課完全沒寫程式經驗的人能跟嗎?**
A:第一堂可以、第二堂可以、第三堂前半可以、第四堂後半(GitHub + Headless)會比較吃力。建議「行政 / 業務 / 內容創作」族群至少看完第一二堂,把 Claude Code 當「會做事的助理」用,先建立信心再接第三四堂。

**Q2:看完四堂需要多久?**
A:文字版每堂約 25-35 分鐘讀完,四堂連續看約 2 小時。如果要照做、跑 demo、設 CLAUDE.md、裝 Superpowers,完整實作約 4-6 小時。建議分四個下午做,每天一堂、立刻上手最有效。

**Q3:訂閱 Claude Pro 一定要訂嗎?有免費版能跟嗎?**
A:**不訂無法跟**。Claude Code 是 Pro / Team / Enterprise 訂閱才能用,免費版只有對話框 Claude.ai。Pro 是 $20 美元/月——這個小班的核心就是「教你怎麼把這 $20 用回本」。

**Q4:Mac / Windows / Linux 都能跟嗎?**
A:Mac 跟 WSL2 Ubuntu 最順,Windows 原生 PowerShell 跟 Git Bash 都有坑(CRLF、path 翻譯、缺工具)。如果你是 Windows,建議裝 WSL2 + Ubuntu 跟,跟 Mac 體驗一樣。

**Q5:Claude Code 跟 Cursor / Cline / Aider 差在哪?**
A:Claude Code 是 Anthropic 官方 CLI,直接吃 Pro 訂閱、不需要另外買 API。Cursor / Cline 是 VS Code 插件,要自己接 API。**Pro 訂閱者最划算的選擇就是 Claude Code**——其他工具好但要另外付錢。

**Q6:這個小班的逐字稿/錄影有開放嗎?**
A:錄影在學員社群內部,逐字稿整理成這四篇文章公開。**所有公開版的內容都收錄在這 4+1 篇(四堂 + Hub)裡**,你不會錯過。

## 這個小班結束之後該怎麼繼續學

這四堂初階班的定位是「把 Pro 訂閱用回本」,接下來自學路徑:

1. **進階:寫自己的 plugin / skill**——參考 Jesse Vincent 的 [obra/superpowers](https://github.com/obra/superpowers) 結構,自己寫一個你公司內部用的 skill
2. **進階:接公司內網 LLM**——走 Anthropic-compatible API wrapper 自架,參考 [MemPalace + claude -p HTTP proxy](/ai-lecturer-bob/blog/mempalace-3-3-5-claude-p-proxy/)
3. **進階:多 agent orchestration**——一個主 agent 派工給多個 subagent,參考 [Ralph Loop 實戰](/ai-lecturer-bob/blog/ralph-loop-real-world/)
4. **進階:跨工具並用**——Cursor / Cline / Hermes Agent 各有強項,參考 [Hermes Agent 入門](/ai-lecturer-bob/blog/hermes-agent-intro/)

我自己接下來會開「**中階班**」(自己寫 plugin / 公司導入)、「**進階班**」(多 agent orchestration、production 部署),如果你看完四堂想繼續學,留 email 給我(bobchen184@gmail.com)下期開新班會通知。

## 延伸資源

- [Claude Code 官方文件](https://code.claude.com/docs/) — Anthropic 官方,最完整
- [Claude Pro 訂閱頁](https://claude.com/upgrade) — $20/月,看完四堂訂得回本
- [obra/superpowers](https://github.com/obra/superpowers) — Jesse Vincent 的 plugin 集大成
- [Twinkle Hub MCP](https://hub.twinkleai.tw/en) — 台灣政府開放資料 MCP
- 同站延伸:
  - [Claude Code 入門第一堂:訂閱開始怎麼用](/ai-lecturer-bob/blog/claude-code-lesson-1/) — 看見篇
  - [CLAUDE.md 怎麼寫?Claude Code 第二堂](/ai-lecturer-bob/blog/claude-code-lesson-2/) — 馴服篇
  - [Claude Code Skill / Subagent / Slash Command 差在哪?](/ai-lecturer-bob/blog/claude-code-lesson-3/) — 自動化篇
  - [obra superpowers 怎麼裝?Claude Code 第四堂](/ai-lecturer-bob/blog/claude-code-lesson-4/) — 接生態篇
  - [Claude Code 兩堂課的 Astro 跟 TaskList 整理](/ai-lecturer-bob/blog/claude-code-two-lessons-astro-and-tasklist/) — 我自己寫部落格站的踩坑
  - [Claude Code Remote Control](/ai-lecturer-bob/blog/claude-code-remote-control/) — 手機觸發桌機的進階玩法

---

**這個小班的核心訊息只有一句**:**Claude Pro($20/月)不是「ChatGPT 換家用」,是「給你一個 24 小時聽指令的工程師助理」**。四堂課就是教你怎麼把這個助理叫醒、紀律化、自動化、接生態系——看完照做,$20 用出 $2000 的價值。

回家作業:**訂 Pro、看四堂、做一件你以前不會做的事、發 Threads tag 我(Bob Chen / yanchen.app)**——讓我看到這個小班真的有人接得住。

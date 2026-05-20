# 我把 AI 課程簡報全做成 HTML 丟上 GitHub Pages：popularize-slides 開源拆解

![repo social preview](/images/blog/popularize-slides-deck/repo-social.png)

## TL;DR

- 我把 4 堂「AI Claude Code 概論初級班」的教學簡報全部寫成 HTML，**沒用 Keynote、沒用 Google Slides、沒用 PowerPoint**，丟在 GitHub Pages 上跑：[yanchen184.github.io/popularize-slides](https://yanchen184.github.io/popularize-slides/)。
- repo 開源在 [github.com/yanchen184/popularize-slides](https://github.com/yanchen184/popularize-slides)，每堂課就是一個 `lessonN/index.html` 單檔，**沒有 build step、沒有 npm install**，clone 下來瀏覽器開就能用。
- 為什麼這樣做：簡報軟體在現場 demo terminal 跟 code block 時排版會醜、字體會跑掉、跨機器不一致。HTML 用 `<pre><code>` 直接 100% 還原；用 GitHub Pages 還能順便當教 Git 的活範例（學生看完課可以 fork 整套去改）。
- 第四堂 lesson4 的主題就是 Git × GitHub × Superpowers × GitHub Pages 一條龍，跟整個 repo 自己的存在方式互文 —— 教什麼就用什麼。

## 目錄

1. [一個職訓局講師為什麼自己寫 HTML 簡報](#一個職訓局講師為什麼自己寫-html-簡報)
2. [專案規模：4 堂課、12 commits、單檔 HTML](#專案規模4-堂課12-commits單檔-html)
3. [4 堂課在教什麼](#4-堂課在教什麼)
4. [技術選擇：為什麼是 HTML 不是 Reveal.js / Slidev](#技術選擇為什麼是-html-不是-revealjs--slidev)
5. [設計系統：襯線金 × 深色底 × 等寬碼字](#設計系統襯線金--深色底--等寬碼字)
6. [部署：GitHub Pages + `.nojekyll` + 一條 push 指令](#部署github-pages--nojekyll--一條-push-指令)
7. [你可以怎麼拿去用](#你可以怎麼拿去用)
8. [FAQ](#faq)
9. [延伸資源](#延伸資源)

---

## 一個職訓局講師為什麼自己寫 HTML 簡報

我在職訓局教「AI Claude Code 概論初級班」，4 堂課、每堂 3 小時。第一堂我用 Keynote 做了一份漂亮的簡報，現場 demo 第一個 code block —— **Cormorant Garamond 字體在 Keynote 裡是斜體，code block 顯示出來空白被吃掉、縮排亂了**。學生抬頭看大螢幕、低頭看自己機器，**看到的東西不一樣**。

我那場補救方法是把 code block 全部換成截圖，下課就決定第二堂不再用 Keynote。

選項本來有三個：

| 方案 | 優點 | 為什麼我沒選 |
|---|---|---|
| **Reveal.js / Slidev** | 簡報專用、有現成主題、Markdown 寫得快 | 要 build step、學生 clone 下來不能直接打開、`npm install` 動輒一分鐘 |
| **Marp** | Markdown to HTML，CLI 簡單 | 不能寫自訂 JS（我要鍵盤導航、fullscreen、進度條） |
| **手寫 HTML + CSS** | 100% 控制、沒有抽象漏洞、瀏覽器直接開 | 要自己寫 keyboard handler、自己處理動畫 |

最後選了**手寫 HTML**。理由很實際：

1. **學生 clone 下來，雙擊 `lesson1/index.html` 就能看** —— 沒有 build step、沒有 server，這是現場教 Git 時 demo 的最低門檻
2. **我自己會用 Claude Code** —— `keyboard handler / progress bar / fullscreen / 進場動畫` 這些我用講的，Claude 寫得比我親手寫快
3. **單檔 HTML 就是一份 commit unit** —— git diff 看 lesson4/index.html 直接是內容變更，沒有 build artifacts 雜訊

> 這個專案本身就是「教學內容 = source code」的實驗。簡報不是輔助、不是投影片，是 GitHub Pages 上的網頁，學生可以 fork、可以改、可以拿去當自己的範本。

---

## 專案規模：4 堂課、12 commits、單檔 HTML

事實先擺：

| 項目 | 數字 |
|---|---|
| Repo 創建日 | 2026-04-28 |
| 最新 commit | 2026-05-19 |
| Commits 總數 | 12 |
| 課程堂數 | 4 |
| 每堂課檔案數 | 1（`lessonN/index.html`） |
| 第四堂行數 | 775 行 HTML（含 inline CSS + JS） |
| Repo size | 51 KB |
| Star 數 | 0 ⭐（誠實揭露） |
| 部署方式 | GitHub Pages (`main` branch, `/` root) |

![首頁截圖](/images/blog/popularize-slides-deck/index-shot.png)

`index.html` 是入口，只是 4 個課程連結的列表。每堂課的 `lessonN/index.html` 是獨立簡報、獨立播放，**互相沒有共用 CSS 或 JS**。

這個設計是刻意的 —— 我每堂課改設計時不想動到前面的課。第二堂我改了字體大小、第三堂我把背景從淺灰換成深色 + 金色點綴、第四堂我加了 `slide.fade-up` 進場動畫。**前面的課完全沒被影響**，因為它們是另一個檔案。

> **trade-off：** 重複碼。第三堂跟第四堂的 CSS 大概有 60% 重複，按工程乾淨度應該抽 `shared.css`。但這是教學素材，不是 production code —— 抽出來反而會讓某一堂的視覺微調 break 另一堂。**4 堂課 = 4 個獨立檔案**，是我刻意接受的重複。

---

## 4 堂課在教什麼

每堂課對應一個核心痛點。我把這套課程命名為「概論初級班」是因為它**沒有任何前置條件**，學生可能連 terminal 都沒打開過。

### Lesson 1 — Claude Code 是什麼 / Spec 思維 / 資安底線 / MCP

> URL：[yanchen184.github.io/popularize-slides/lesson1](https://yanchen184.github.io/popularize-slides/lesson1/)

![Lesson 1 首頁](/images/blog/popularize-slides-deck/lesson1-shot.png)

第一堂打地基：Claude Code 跟 ChatGPT 差在哪、為什麼要學 Spec 思維（不是學指令）、什麼東西不能餵給它（密碼、客戶資料、合約）、MCP 是什麼。

教學 anchor 是「**你描述目的、它處理過程**」—— 學生第一次接觸 AI Agent 最容易誤解的就是「我要學它的指令」，要扭轉成「我描述要的結果，它去找路徑」。

### Lesson 2 — 馴服 Claude Code

> URL：[yanchen184.github.io/popularize-slides/lesson2](https://yanchen184.github.io/popularize-slides/lesson2/)

![Lesson 2 首頁](/images/blog/popularize-slides-deck/lesson2-shot.png)

第二堂是「**讓它聽話**」：Session 怎麼開、`.claude/` 資料夾在幹嘛、CLAUDE.md 的十大定義（身份、語氣、紀律、工具偏好、紅線、決策分層、卡關升級、Round-trip 驗證、自我罵點、Memory 入口）。Auto memory 是怎麼跨 session 記住你的偏好、Plan Mode 是什麼、什麼時候要按 Esc + Esc。

這堂是學生分水嶺。學完之後 Claude Code 才會「**像你的同事**」而不是「另一個 ChatGPT 視窗」。

### Lesson 3 — 經濟學

> URL：[yanchen184.github.io/popularize-slides/lesson3](https://yanchen184.github.io/popularize-slides/lesson3/)

![Lesson 3 首頁](/images/blog/popularize-slides-deck/lesson3-shot.png)

第三堂講錢：Claude API 跟 Anthropic 訂閱跟 OpenRouter 怎麼比、Token 5 武器（`/model` `/compact` `/clear` Skill Subagent）、Hooks 怎麼省 token、`/loop` 跟 `/schedule` 怎麼用。

3 家 API 價錢、5 個省 token 武器卡片、8 頁 Hooks 實作範例 —— 這堂課是「**讓你用得久而不破產**」。

### Lesson 4 — Safety Net：Git × GitHub × Superpowers × GitHub Pages

> URL：[yanchen184.github.io/popularize-slides/lesson4](https://yanchen184.github.io/popularize-slides/lesson4/)

![Lesson 4 首頁](/images/blog/popularize-slides-deck/lesson4-shot.png)

第四堂是這個 repo 的最新作。8 頁：

1. **標題頁** — Lesson 04 / Safety Net
2. **Hook 三件慘事** — 改爛了 / 沒了 / 忘了哪版才對
3. **兩根柱子** — 註冊 GitHub + 裝 Git（跨 Mac/Win11/WSL2）
4. **Superpowers 獨立頁** — `obra/superpowers` plugin 6 個 skill 卡片 + before/after 對比 + 安裝指令
5. **武器 01** — 一句話開新專案 + 第一個 commit + `.gitignore` 樣板
6. **武器 02** — 日常存檔 + push + 好爛 commit message 對比
7. **武器 03** — 後悔藥：五種出包場景 + 一句話救援
8. **加碼** — 把備份的東西順便丟上 GitHub Pages 變網址

這堂課刻意把 **「跟 AI 合作之後 Git 才真正重要」** 推到最前面 —— Claude Code 改錯一個檔案的速度比你還快，沒有 Git 你連退回去都做不到。

---

## 技術選擇：為什麼是 HTML 不是 Reveal.js / Slidev

這節展開上面那張表的細節。**如果你只是要做一份簡報、隨便丟一下就好，請用 Slidev**，這節跳過。如果你的場景跟我一樣（職訓局現場 demo + 學生要拿去 fork），讀下去。

### Slidev 的問題

[Slidev](https://sli.dev/) 是 [Anthony Fu](https://github.com/antfu) 寫的 Markdown-based 簡報引擎，很漂亮、Vue 生態、Vite build。我試過，問題在：

1. **build step** —— 學生 clone 下來，要先 `pnpm install` + `pnpm dev` 才能看，這對「第四堂才學 Git」的學生來說太遠
2. **依賴版本飄移** —— 我半年後想改某一堂課，`pnpm install` 拉了不一樣的 Vue 版本，編譯炸了
3. **GitHub Pages base path 問題** —— Slidev build 出來的路徑寫死，部署到 `/popularize-slides/` 底下會掉 asset，要改 `vite.config.ts`

第 3 點我有寫過一篇相關的踩坑：[Astro base path 自動加前綴的設計坑](https://yanchen.app/blog/astro-base-path-markdown-link/)，Slidev 是同一類設計選擇。

### Reveal.js 的問題

[Reveal.js](https://revealjs.com/) 是元老級簡報引擎，我大學就用過。但：

1. **預設主題不適合 code-heavy 教學** —— 字大、間距大，一頁塞不下三段 code
2. **客製化要動 SCSS** —— 跨機器 build 不一致
3. **GitHub Pages 部署要 plugin** —— `reveal.js-menu` `reveal.js-search` 都是社群 plugin、來源不一致

### 手寫 HTML 我得到了什麼

```bash
# 從 clone 到看到簡報，學生要做的事
git clone https://github.com/yanchen184/popularize-slides
cd popularize-slides
open lesson1/index.html  # macOS
# 或 explorer.exe lesson1/index.html  # Windows
# 完。
```

**沒了**。沒有 `npm install`、沒有 build、沒有 dev server。

跨 OS、跨 Chrome 版本、跨 5 年後依然能跑（因為 HTML 5 + 標準 CSS）。**這對教學素材是關鍵指標**。

---

## 設計系統：襯線金 × 深色底 × 等寬碼字

第三堂之後我才定了設計系統。前兩堂是淺色背景，第三堂改成深色 + 金色 accent 之後氣質完全不同，第四堂沿用：

```css
:root {
  --bg:           #0E0E10;  /* 深炭黑，比純黑舒服 */
  --bg-soft:      #15151A;
  --line:         #2A2A30;
  --ink:          #F4F0E8;  /* 米白文字 */
  --ink-mute:     #8A8A93;
  --accent:       #D4A574;  /* 黃金 highlight */
  --warn:         #C97B7B;  /* 警告紅 */
  --safe:         #7BA88E;  /* 安全綠 */
  --info:         #7B9BC9;  /* 提示藍 */

  --serif:  'Cormorant Garamond', 'Noto Serif TC', Georgia, serif;
  --sans:   'Inter', 'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono:   'JetBrains Mono', 'SF Mono', Menlo, monospace;
}
```

排版三大字級：

```css
.title-xl { font-family: var(--serif); font-weight: 300; font-size: 6rem; }
.title-l  { font-family: var(--serif); font-weight: 300; font-size: 3.8rem; }
.title-m  { font-family: var(--sans);  font-weight: 300; font-size: 2.4rem; }
```

**設計訊號**：
- **襯線體** 給標題 —— 教學現場大螢幕的權威感
- **無襯線體** 給內文 —— 中文讀起來清爽
- **等寬體** 給 code —— 縮排 100% 對齊

進場動畫用 stagger fade-up，CSS transition 直接做，**沒有 GSAP、沒有 Framer Motion**：

```css
.slide.fade-up > * {
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.slide.active.fade-up > * { opacity: 1; transform: translateY(0); }
.slide.active.fade-up > *:nth-child(1) { transition-delay: 0.08s; }
.slide.active.fade-up > *:nth-child(2) { transition-delay: 0.22s; }
.slide.active.fade-up > *:nth-child(3) { transition-delay: 0.36s; }
/* ... */
```

每個元素延遲 0.14 秒進場，視覺上像在「逐項揭露」。簡單但有效。

### 鍵盤導航 + Fullscreen + 進度條

```js
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') next();
  else if (e.key === 'ArrowLeft') prev();
  else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
});
```

3 行解決現場 demo 90% 的操控需求。F 鍵全螢幕、進度條跑滿底端。

---

## 部署：GitHub Pages + `.nojekyll` + 一條 push 指令

部署沒什麼好神秘的：

1. **Repo Settings → Pages**：source 設 `main` branch，folder 設 `/` (root)
2. **Repo root 放 `.nojekyll`** —— 確保檔名含 `_` 不被 Jekyll 當特殊檔過濾掉（我沒用 Jekyll 主題）
3. **push 完等 1-2 分鐘** —— GitHub Pages auto-deploy

```bash
# 我新增第四堂時做的事
mkdir -p lesson4
# (用 Claude Code 寫 lesson4/index.html)
# (改 root 的 index.html，把 lesson4 從「即將上線」換成連結)
git add lesson4/ index.html
git commit -m "feat(lesson4): Safety Net 第四堂"
git push
# 90 秒後 https://yanchen184.github.io/popularize-slides/lesson4/ 上線
```

驗證部署是不是真的成功 —— **不是看 GitHub Actions 綠燈**，是 `curl -I` 確認：

```bash
curl -I https://yanchen184.github.io/popularize-slides/lesson4/ | head -2
# HTTP/2 200
# server: GitHub.com
```

[Round-trip 驗證](https://yanchen.app/blog/seo-content-score/)，不是 handshake。

---

## 你可以怎麼拿去用

這個 repo 是 MIT-style（其實 repo 沒附 LICENSE，但設計上歡迎 fork）。最直接的用法：

### 1. Fork 整套，改成你自己的教學內容

```bash
# 在 GitHub 點 Fork
git clone https://github.com/你的帳號/popularize-slides
cd popularize-slides
# 改 lesson1/index.html 變你的第一堂課
# 改 root index.html 換成你的課程名稱
git push
```

到你的 fork 開 Settings → Pages → 啟用。**完全免費的個人課程網站**。

### 2. 把 lesson4 拿去當 Git 教學模板

如果你也要教完全 Git 新手用 Claude Code，第四堂的 8 頁結構（Hook 痛點 → 兩根柱子 → Superpowers → 武器 1 → 武器 2 → 武器 3 → 加碼 Pages）可以直接照搬，把每頁的 code block 改成你的版本。

### 3. 把設計系統抽出來自己用

CSS variables 那一段（`--bg` `--accent` `--serif` 等）可以直接複製到你的專案。襯線標題 + 深色底 + 黃金 accent 是非常通用的「教學感」配色，不只簡報能用。

---

## FAQ

### Q1：為什麼不用 Notion / Slidev / Reveal.js / Marp 這些現成工具？

簡答：**現場 demo 跟學生 fork 的場景下，build step 是負擔**。

長答：Notion 簡報模式不能改鍵盤導航、字體不能客製；Slidev 跟 Reveal.js 要 build step，學生 clone 下來不能直接看；Marp 不能寫自訂 JS。手寫 HTML 是「最不偷懶但最自由」的選擇，跟我的場景吻合。

如果你只是要做一份漂亮的簡報、不在意 fork 友善度，**請用 Slidev**，那是最快的路。

### Q2：每堂課 60% 重複 CSS 不會痛嗎？

會痛，但**沒抽出來是刻意的**。

教學素材的版本演進不是線性 refactor。第三堂我加了金色 accent，第四堂我覺得 progress bar 太細加粗了 —— 如果這些是 shared CSS，每改一次都要回頭驗證前面的課還能看。**分開檔案 = 每堂課獨立可審查**，這對「我會在發布後幾個月回頭微調某一堂」的場景值得。

YAGNI 原則：當我有第 8 堂課、共用樣式真的吵到我之前，不抽。

### Q3：用 AI 寫教學簡報會不會有「AI 腔」？

我自己寫文字內容、用 Claude Code 寫 HTML/CSS/JS。

文字部分（標題、痛點、口語、口號）我自己定，Claude 只是把我的 outline 變成 markup。我會在 prompt 裡明確說「不要用 AI 腔、不要寫『顛覆性』『革命性』、不要寫『超棒』『神器』」—— 跟我[寫部落格的 SoT 規範](https://yanchen.app/blog/seo-content-score/)同一套。

實作部分（CSS 動畫、鍵盤事件、進度條）Claude 寫得比我親手寫快 5 倍。**這就是分工**：我管「教什麼、要什麼感覺」，AI 管「把 HTML/CSS 寫出來」。

### Q4：GitHub Pages 不會收費嗎？流量大會掛嗎？

GitHub Pages 對 public repo **完全免費**，soft limit 是每月 100GB 流量、100GB 倉庫大小（我這個 repo 才 51KB，完全用不到）。

職訓局一場課 30 個學生、每人連線一次、靜態 HTML 30KB，**一場課總流量約 1MB**。流量永遠不會是問題。

唯一要注意：private repo 用 GitHub Pages 要 GitHub Pro / Team / Enterprise。教學素材建議 public，學生也才能 fork。

### Q5：學生用手機看會 OK 嗎？

**不會 OK**。

我刻意沒做 responsive。簡報設計給投影機（1920×1080）跟 17 吋筆電，手機螢幕字會炸出去。

我的取捨：簡報是現場大螢幕用的，**手機不該是設計目標**。學生回家複習可以用筆電開，或我會另外發 PDF 版本。為了手機去動 CSS 會犧牲大螢幕的視覺密度，**不值得**。

### Q6：可以拿這個 repo 商用嗎？

repo 目前沒附 LICENSE 檔，預設是 All Rights Reserved。

實務上 —— **歡迎 fork 改你自己的教學內容**。如果你要拿我的設計風格、CSS、結構去做付費課程，麻煩標一下來源（連結到這個 repo 或我的部落格）。不用問我、不用付錢，標個名字而已。

商用比較細節的部分歡迎私訊問。

---

## 延伸資源

- **Repo**: [github.com/yanchen184/popularize-slides](https://github.com/yanchen184/popularize-slides)
- **Live 站台**: [yanchen184.github.io/popularize-slides](https://yanchen184.github.io/popularize-slides/)
- **Superpowers plugin（第四堂介紹的）**: [github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Claude Code 官方**: [claude.com/claude-code](https://claude.com/claude-code)
- **GitHub Pages 文件**: [docs.github.com/pages](https://docs.github.com/en/pages)
- **同系列文章**: [Astro base path 設計坑（同樣是 GitHub Pages 部署問題）](https://yanchen.app/blog/astro-base-path-markdown-link/)

---

**寫在最後**：這個 repo 是一個小實驗 —— 用最樸素的技術（純 HTML + CSS + 一點 JS）做一件「應該要用大工具才能做的事」（簡報系統）。它能跑、能 fork、能在 5 年後依然打開 —— 這就是 YAGNI 對工程師最好的禮物。

教學內容開源這件事，比工具選擇重要得多。如果你也在教 AI / 軟體 / 任何東西，**把投影片放 GitHub 上**，這比什麼都還有用。

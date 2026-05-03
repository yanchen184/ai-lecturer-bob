# 個人形象網站 2026-05 內容優化提案

> 狀態：草稿，待作者審核後實作。本提案只動文字，不動結構與程式碼。
> 站點：`https://yanchen184.github.io/ai-lecturer-bob/`
> 技術棧：Astro 6 + React 19 + Tailwind 4，base = `/ai-lecturer-bob`

---

## 0. 現況快照（不動，只記錄）

### 首頁 SEO meta（`src/pages/index.astro` L52-54）
- title: `AI 講師陳彥彤YC — 後端工程師 · Spring Boot / React 企業內訓`
- description: `陳彥彤 Bob Chen — 資深後端工程師 · AI 講師。5-6 年電商核心系統開發經驗，10-50 場企業授課經歷。提供 Spring Boot、React、MySQL、Redis 企業內訓與技術諮詢。`

### Hero（首頁第一屏 L62-83）
- 上標：`ai lecturer · senior backend engineer`
- 標題：`你好，我是 程式講師陳彥彤`
- Motto：`不怕死，只怕不過癮。`
- 副標：`資深後端工程師 · AI 講師。Spring Boot / React / MySQL / Redis。企業內訓、技術寫作、系統架構諮詢。`

### Stats（L18-23）
- `5-6 年` Java 後端開發經驗
- `10-50 場` 企業授課經歷
- `AZ-900` Azure 雲端認證
- `98%` 學員滿意度

### Signature Work（L125-198，黑底）
- 三欄：WMS / MOX / MIX（10,000+ API/day, p95 <200ms）、Spring Boot 4 stack、10-50 場企業內訓（98% 滿意度）
- 對比 tagline：`others 教你寫 Hello World / me 帶你跑一遍電商核心系統`

### About（L216-228）
- 「擁有 5-6 年 Java 後端開發經驗」
- 「電商核心系統團隊，主責 WMS / MOX / MIX」
- 「系統每日處理上萬筆 API 請求，平均延遲維持低於 200ms」
- 標籤：後端專精 / 電商經驗 / 教學現場 / 全端能力

### Skills（L25-30）
- 後端：Spring Boot 4, Java 21, Maven, JPA / Hibernate
- 資料：MySQL, MSSQL, Redis, RabbitMQ
- 前端：React 19, TypeScript, Vite, Tailwind CSS
- DevOps：Docker, GitHub Actions, Firebase, Azure AZ-900

### Courses（L32-48）
- 企業內訓 · Spring Boot 全棧（電商案例）
- 一對一技術諮詢（架構、效能、AI 導入、Grails → Spring Boot 遷移）
- React 前端實戰

### Contact（L394-397）
- 「企業內訓、技術諮詢、系統架構顧問」
- Email: `bobchen184@gmail.com`，GitHub: `yanchen184`

### Navbar（`src/components/NavbarNeub.astro` L20-26）
- 首頁 / 關於 / 服務 / 部落格 / 聯繫
- Logo 文字：`AI 講師陳彥彤YC`

### Footer（`src/components/FooterNeub.astro` L9-14）
- 標題：`AI 講師陳彥彤YC`
- 副標：`後端工程師 · Spring Boot / React / MySQL / Redis。企業內訓 · 技術寫作 · 系統架構諮詢。`

### Person JSON-LD（`src/layouts/RootLayout.astro` L50-59）
- name: `陳彥彤 Bob Chen`
- alternateName: `陳彥彤YC`
- jobTitle: `AI 講師 · 資深後端工程師`
- knowsAbout: `['Spring Boot', 'React', 'MySQL', 'Redis', 'AI']`

### Testimonials（6 則學員 + 4 個 stats，`src/sections/Testimonials.astro`）
- stats：98% 滿意度 / 4.9/5 評分 / 95% 完成率 / 88% 推薦率

### Blog index meta（`src/pages/blog/index.astro` L55-56）
- title: `部落格 — AI 講師陳彥彤YC`
- description: `後端工程師的技術筆記。Spring Boot、React、MySQL、Redis 踩坑紀錄、解題過程、企業內訓現場心得。`

---

## 1. 定位轉變摘要

**舊：** AI 講師 + 資深後端工程師（5-6 年），主軸電商系統 + Spring Boot / React 企業內訓。

**新：** Java 後端 8 年 + AI 工程師 2 年。主力做 AI 項目（Hermes Agent、RAG、LLM Wiki、聯發科 Whisper 線），近年重心轉向 **AI / 前後端 / 雲端的企業內訓 + 顧問**。電商背景保留為 credibility，不再當主秀。

**對外那一句話定位：**
> 「Java 後端 8 年、AI 工程師 2 年。做 AI 項目、也做 AI 與前後端的企業培訓與顧問。」

---

## 2. SEO 關鍵字策略

### 主關鍵字（必排，每頁至少出現 1 次）
- `YC`
- `陳彥彤`
- `AI 顧問`
- `AI 企業培訓` / `AI 內訓`

### 次關鍵字（自然帶入）
- `Java 後端工程師`
- `AI 工程師`
- `RAG 顧問`
- `Spring Boot 企業內訓`
- `前端內訓` / `後端內訓` / `雲端內訓`
- `LLM 應用` / `Agent 開發`

### 長尾（部落格、服務頁）
- `企業 AI 導入顧問`
- `RAG 系統建置 顧問`
- `Java 轉 AI 工程師`
- `企業 LLM 內訓`
- `Spring Boot AI 整合`

### 站內關鍵字分佈原則
- **每頁 title** 必含「陳彥彤」或「YC」+ 一個服務關鍵字
- **每頁 description** 必含「AI 顧問」或「企業培訓」其一
- **H1 / H2** 自然分佈，不堆關鍵字
- **alt / aria-label** 補上「陳彥彤 YC」可被爬

---

## 3. 各頁面文案改寫（前後對照）

### 3.1 Hero（首頁第一屏）

**現況：**
```
ai lecturer · senior backend engineer

你好，我是 程式講師陳彥彤

motto  不怕死，只怕不過癮。

資深後端工程師 · AI 講師。
Spring Boot / React / MySQL / Redis。企業內訓、技術寫作、系統架構諮詢。
```

**建議改成：**
```
ai engineer · backend · consultant

你好，我是 陳彥彤 YC

motto  不怕死，只怕不過癮。

Java 後端 8 年、AI 工程師 2 年。
做 AI 項目，也做 AI / 前後端 / 雲端的企業培訓與顧問。
```

**理由：**
- 把「YC」放進 H1，直接吃 SEO 主關鍵字
- 「程式講師」改「陳彥彤 YC」更貼近 Google 搜尋意圖
- 副標把年資從「5-6 年」修正成「Java 8 年 + AI 2 年」，籠統且不浮誇
- 把「技術寫作、系統架構諮詢」收成「企業培訓與顧問」一句話，更聚焦

---

### 3.2 Stats 四格

**現況：**
```
5-6 年 / Java 後端開發經驗
10-50 場 / 企業授課經歷
AZ-900 / Azure 雲端認證
98% / 學員滿意度
```

**建議改成：**
```
8 年 / Java 後端
2 年 / AI 工程師
10-50 場 / 企業內訓
AZ-900 / Azure 認證
```

**理由：**
- 主動釋出新定位：兩條年資線並列
- 移除「98% 學員滿意度」放到 Testimonials（避免在 Hero 就過度自誇）
- 「企業授課」改「企業內訓」對齊 SEO 關鍵字

---

### 3.3 Signature Work（黑底三欄）

> 重要：這一段現在最容易被打臉。`10,000+ API/day` 跟 `p95 <200ms` 是具體技術數字，作者強調「籠統一點」、不確定的數字先標待確認。

**現況第一欄：**
```
WMS / MOX / MIX
電商核心的智能倉儲、訂單、貨品三套系統。
每日處理 10,000+ API requests，p95 延遲壓在 200ms 以下。
```

**建議改成：**
```
WMS / MOX / MIX
電商核心的智能倉儲、訂單、貨品三套系統。
高峰期承載每日上萬筆請求，是我練後端基本功的地方。
```

**現況第二欄：**
```
Spring Boot 4
Java 21 · JPA · Redis · RabbitMQ · MySQL。
不是看書學的，是跟著 Spring Boot 從 2 到 4 一起踩出來的。
```

**建議：保留**（這段務實、不浮誇，符合作者語氣）

**現況第三欄：**
```
10-50 場企業內訓
把產線上踩過的坑，變成能帶人少走彎路的教材。
98% 學員滿意度不是設計出來的數字。
```

**建議改成：**
```
AI / 前後端 / 雲端內訓
把產線上踩過的坑、跑過的 AI 項目，整理成能帶人少走彎路的教材。
近兩年重心從寫程式轉向培訓與顧問。
```

**理由：**
- 第三欄是定位轉變的重點，從「教 Spring Boot」改成「教 AI + 前後端 + 雲端」
- 把「98% 滿意度」這種數字從 Hero 區拿掉（避免疊加）

**Tagline 對比：**

**現況：** `others 教你寫 Hello World / me 帶你跑一遍電商核心系統`

**建議改成：** `others 教你 prompt 工程 / me 帶你把 AI 整進公司系統`

**理由：** 對齊新定位，且「把 AI 整進系統」是顧問價值主張。

---

### 3.4 About / 關於我

**現況：**
> 大家好，我是陳彥彤，一位資深後端工程師兼程式講師。擁有 5-6 年 Java 後端開發經驗，專精於企業級系統架構與高併發解決方案。
>
> 曾任職於電商核心系統團隊，主責智能倉儲系統（WMS）、訂單管理系統（MOX）、貨品管理系統（MIX）的開發與維護。系統每日處理上萬筆 API 請求，平均延遲維持低於 200ms。
>
> 技術專長包含 Spring Boot、MySQL、Redis、RabbitMQ 等後端技術，同時具備 React 前端開發能力。現在把這些年累積下來的工作經驗整理成系統化的教學內容，帶想學後端的人一起走一遍我走過的路。

**建議改成：**
> 大家好，我是 **陳彥彤（YC）**，Java 後端工程師 8 年，近兩年轉做 AI 工程師。
>
> 早年在電商核心團隊做 WMS / MOX / MIX 三套系統，這段經歷是我後端基本功的來源。近兩年重心移到 AI：跑過 RAG、Agent、語音相關的項目，也開始接 **AI 與前後端、雲端的企業內訓和顧問**。
>
> 講課的素材都是自己踩過的坑、解過的題，不照書唸。如果你的團隊正在想「AI 怎麼導入」、或是後端、前端、雲端有需要被帶一輪，歡迎聊聊。

**理由：**
- 第一句直接把「YC」「Java 8 年」「AI 2 年」鎖死
- 第二段不點名專案（避開 Hermes / 聯發科 Whisper 公開資訊敏感度）— 改用「RAG、Agent、語音相關」三類別涵蓋，留待 Experience 區塊細寫
- 「AI 與前後端、雲端的企業內訓和顧問」一次塞滿四個 SEO 關鍵字
- 收尾用「踩過的坑、解過的題、不照書唸」對齊作者語氣，避開「賦能、實戰派」字眼

**About 標籤四格改：**

| 現況 | 建議 |
|---|---|
| 後端專精 / Spring Boot 企業級 | 後端 8 年 / Java · Spring Boot |
| 電商經驗 / WMS · MOX · MIX | AI 2 年 / RAG · Agent · 語音 |
| 教學現場 / 企業內訓 10-50 場 | 企業培訓 / AI · 前後端 · 雲端 |
| 全端能力 / 前後端整合 | 顧問服務 / AI 導入 · 架構 |

---

### 3.5 Skills / 技術專長

**現況四個分組：** 後端 / 資料 / 前端 / DevOps

**建議：新增第五組「AI」，並把 DevOps 改 Cloud。**

| group | label | items |
|---|---|---|
| AI（新增） | ai | LLM 應用、RAG、Agent、Whisper / 語音、Prompt 設計 |
| 後端 | backend | Spring Boot 4, Java 21, Maven, JPA / Hibernate |
| 資料 | data | MySQL, MSSQL, Redis, RabbitMQ |
| 前端 | frontend | React 19, TypeScript, Vite, Tailwind CSS |
| 雲端 | cloud | Azure (AZ-900), Docker, GitHub Actions, Firebase |

**理由：**
- AI 卡放第一張，視覺優先
- 把「DevOps」改「Cloud」對齊「雲端內訓」關鍵字
- AI 卡內條目刻意用通用詞（LLM 應用、RAG、Agent、語音、Prompt 設計），不寫「擅長 LangChain / 我做過 X 模型微調」這種容易被打臉的具體技能

**注意：** 這需要動 `src/pages/index.astro` L25-30 的 `skills` 陣列。本提案不動 code，只列建議。

---

### 3.6 Courses / 課程與服務

**現況三張卡：**
1. 企業內訓 · Spring Boot 全棧（電商案例）
2. 一對一技術諮詢（架構、效能、AI 導入、Grails → Spring Boot 遷移）
3. React 前端實戰

**建議改成（新三張卡）：**

**卡 1：企業 AI 導入內訓**
```
標題：企業 AI 內訓 · 從 LLM 到落地
描述：給工程團隊的 AI 培訓。從 LLM 基礎、RAG、Agent，到怎麼把 AI 整進現有系統。內容會根據貴司技術棧客製，不是統一講義。
標籤：[AI 內訓, RAG, LLM 應用]
```

**卡 2：AI 顧問 · 架構與導入**
```
標題：AI 顧問 · 架構與導入
描述：給正在想「AI 怎麼導入」的團隊。先聊現況、聊資料、聊預算，再給一份能落地的計畫。也接系統架構與後端效能的長期顧問。
標籤：[AI 導入, 架構顧問, 技術選型]
```
> ⚠️ 待作者補充：是按小時計費 / 專案計費 / 月聘？

**卡 3：Spring Boot / React / 雲端內訓**
```
標題：前後端與雲端內訓
描述：Java + Spring Boot 後端、React + TypeScript 前端、Azure 雲端基礎。內容從電商核心系統真實場景延伸，不走 Hello World。
標籤：[Spring Boot, React, Azure]
```

**理由：**
- 順序對應 SEO 優先級：AI 內訓 > AI 顧問 > 傳統前後端
- 卡 1 + 卡 2 直接吃「AI 企業培訓」「AI 顧問」兩個主關鍵字
- 卡 3 把舊內容（Spring Boot、React）合併保留，但放最後

---

### 3.7 Experience / 經歷（建議新增區塊）

> 站上目前**沒有獨立 Experience 區**，年資資訊散在 Hero / About 裡。建議在 About 之後加一塊 timeline。

**建議內容：**

```
經歷時間軸

2018 - 至今 · Java 後端工程師（8 年）
- 電商核心：WMS（智能倉儲）/ MOX（訂單）/ MIX（貨品）
- 技術棧：Spring Boot 2 → 4、Java 21、JPA、Redis、RabbitMQ、MySQL、MSSQL
- 經驗：高併發、效能調校、舊系統遷移（Grails → Spring Boot）

2024 - 至今 · AI 工程師（2 年）
- 主力項目：
  · Hermes Agent 相關（待作者補充：使用 / 整合 / 二次開發？）
  · RAG 系統（內部 LLM Wiki、知識庫檢索）
  · 聯發科 Whisper 線（Breeze-ASR-26，Taigi 語音辨識）— 待作者補充參與形式
- 重心：把 AI 整進企業既有系統

近年 · 企業培訓與顧問
- 內訓主題：AI 導入 · Spring Boot · React · Azure 雲端
- 已執行：10-50 場
- 顧問形式：待作者補充
```

**理由：**
- 把「8 年 Java + 2 年 AI」做成可視化 timeline，對 SEO（H2 結構）和讀者掃讀都好
- 三個 AI 項目都先標「待作者補充參與形式」— **不要讓站上對外宣稱「主導 / 開發 / 維護」聯發科 Whisper，避免被打臉**
- 「LLM Wiki」如果是公司內部專案就標「內部知識庫專案」，不暴露公司名

---

### 3.8 Contact / 開始合作

**現況：**
> 企業內訓、技術諮詢、系統架構顧問 —— 歡迎透過 Email 或 GitHub 聯繫。一對一諮詢與團隊培訓皆可客製化內容，先聊需求再報價。

**建議改成：**
> AI 內訓、AI 導入顧問、前後端與雲端培訓 —— 透過 Email 聊聊。
> 第一次聊不收費，先確認需求對得上、技術棧合得來，再談合作形式。

**理由：**
- 三個服務項目順序與 Courses 區對齊
- 「第一次聊不收費」是務實話術，比「客製化內容」具體
- 拿掉「先聊需求再報價」（太業務感），改成「確認需求對得上」

---

## 4. SEO meta 改寫對照表

| 頁面 | 現有 title | 建議 title | 現有 desc | 建議 desc |
|---|---|---|---|---|
| 首頁 `/` | AI 講師陳彥彤YC — 後端工程師 · Spring Boot / React 企業內訓 | 陳彥彤 YC — AI 顧問 · AI 企業培訓 · Java 後端 8 年 | 陳彥彤 Bob Chen — 資深後端工程師 · AI 講師。5-6 年電商核心系統開發經驗，10-50 場企業授課經歷。提供 Spring Boot、React、MySQL、Redis 企業內訓與技術諮詢。 | 陳彥彤（YC）— Java 後端 8 年、AI 工程師 2 年。提供 AI 內訓、AI 導入顧問，以及前後端、Azure 雲端的企業培訓。 |
| 部落格 `/blog` | 部落格 — AI 講師陳彥彤YC | 技術筆記 — 陳彥彤 YC｜AI · 後端 · 雲端 | 後端工程師的技術筆記。Spring Boot、React、MySQL、Redis 踩坑紀錄、解題過程、企業內訓現場心得。 | 陳彥彤（YC）的技術筆記：AI / RAG / Agent 實作、Spring Boot 與 React 踩坑、Azure 雲端、企業培訓現場心得。 |
| 服務頁 `/services` | （未建立） | AI 內訓 · AI 顧問 — 陳彥彤 YC | （未建立） | 給工程團隊的 AI 內訓與導入顧問。LLM、RAG、Agent，從觀念到整進現有系統。也接前後端 / Azure 雲端培訓。 |

### Person JSON-LD 修改（`RootLayout.astro` L50-59）

```diff
- jobTitle: 'AI 講師 · 資深後端工程師',
+ jobTitle: 'AI 顧問 · AI 工程師 · 資深 Java 後端工程師',
- knowsAbout: ['Spring Boot', 'React', 'MySQL', 'Redis', 'AI'],
+ knowsAbout: ['AI 顧問', '企業內訓', 'LLM', 'RAG', 'Agent', 'Spring Boot', 'Java', 'React', 'Azure'],
```

### og:site_name 與 Footer 標題

| 位置 | 現況 | 建議 |
|---|---|---|
| `og:site_name` | AI 講師陳彥彤YC | 陳彥彤 YC · AI 顧問 |
| Footer 標題 | AI 講師陳彥彤YC | 陳彥彤 YC · AI 顧問 |
| Navbar Logo 文字 | AI 講師陳彥彤YC | 陳彥彤 YC |
| Footer 副標 | 後端工程師 · Spring Boot / React / MySQL / Redis。企業內訓 · 技術寫作 · 系統架構諮詢。 | Java 後端 8 年 · AI 工程師 2 年。AI 內訓 · AI 導入顧問 · 前後端與雲端培訓。 |

---

## 5. 結構增補建議

| 優先 | 項目 | 說明 |
|---|---|---|
| ★★★ | 新增 `/services` SEO landing | 三張卡（AI 內訓 / AI 顧問 / 前後端雲端內訓）做成獨立頁，每張卡 250-400 字。Navbar「服務」改指向這頁而不是 `#courses` 錨點 |
| ★★★ | 新增 `ProfessionalService` JSON-LD | 在 `/services` 頁加 `@type: ProfessionalService` schema，列出三項服務、聯絡方式、地區（台灣） |
| ★★★ | Person schema 補 `description` 與 `worksFor` | 給 Google Knowledge Graph 抓 |
| ★★ | 首頁加 Experience 區塊 | timeline 形式，見 §3.7 |
| ★★ | sitemap 補 `/services` | `astro.config.mjs` sitemap 設定無需動，新頁會自動納入 |
| ★★ | OG 圖更新 | 目前是 `og-default.png`，建議產一張包含「陳彥彤 YC · AI 顧問」字樣的版本 |
| ★ | Testimonials 加 1-2 則 AI 內訓的回饋 | 目前 6 則裡只有「黃經理：AI 輔助開發工作坊」一則沾到 AI，建議補 2 則 RAG / LLM 內訓的回饋 |
| ★ | `/blog` 加 AI 分類 tag | 目前分類靠 Firestore，需要在後台補 |
| ★ | Navbar 加「諮詢」CTA | 在右上加一顆黃底「諮詢預約」按鈕直連 mailto，提升轉換 |

---

## 6. 寫作語氣審查（虛 / 自誇 / AI 腔抓蟲）

> 作者要求：克制、務實、籠統一點，不要把 AI 工程師寫得很虛。

| 類別 | 現況句子 / 位置 | 建議 |
|---|---|---|
| **過度具體（容易打臉）** | 「每日處理 10,000+ API requests，p95 延遲壓在 200ms 以下」（index.astro L157） | 改「高峰期承載每日上萬筆請求」。具體數字若沒有截圖佐證先拿掉 |
| **過度具體** | 「系統每日處理上萬筆 API 請求，平均延遲維持低於 200ms」（L223-224） | 同上，「上萬筆」可保留，「200ms」拿掉 |
| **自誇** | 「98% 學員滿意度不是設計出來的數字」（L182） | 反向行銷，建議刪。Testimonials 區已有 98% 數字夠了 |
| **自誇** | 「不是看書學的，是跟著 Spring Boot 從 2 到 4 一起踩出來的」（L169） | 保留。這句務實、有畫面，符合作者語氣 |
| **空話** | 「專精於企業級系統架構與高併發解決方案」（L219） | 改「跟著電商核心系統練後端基本功」。「專精」「企業級」「高併發解決方案」都太套路 |
| **AI 腔** | （Skills 卡若加 AI）容易寫成「擅長 LLM 應用、深度學習、Agent 開發、模型微調」 | 用「LLM 應用、RAG、Agent、語音、Prompt 設計」這類通用詞，**絕不要寫「擅長」「精通」**，只列關鍵字 |
| **過度承諾** | Courses 卡 2「針對你實際的專案給出可落地的解法」（L41） | 改「先聊現況再給建議」更收斂 |
| **過度貼標** | Hero「程式講師陳彥彤」 | 改「陳彥彤 YC」，把「講師」位移到副標 |
| **空話** | Footer「技術寫作 · 系統架構諮詢」 | 改具體服務：「AI 內訓 · AI 導入顧問 · 前後端與雲端培訓」 |

### AI 工程師段落避雷清單

寫 AI 部分時，以下字眼**不要用**：
- ❌ 「賦能企業 AI 轉型」
- ❌ 「打造下一代 AI 應用」
- ❌ 「擁有豐富 LLM 實戰經驗」
- ❌ 「精通各大 LLM 框架」
- ❌ 「全方位 AI 解決方案」
- ❌ 「實戰派 AI 工程師」（自我貼標）

可以用：
- ✓ 「跑過 RAG、Agent、語音相關的項目」
- ✓ 「把 AI 整進公司系統」
- ✓ 「近兩年重心轉到 AI」
- ✓ 「踩過幾種架構，知道哪幾條是死巷」

---

## 7. 待作者補充清單

請作者逐項回覆，再進實作階段：

### A. 顧問服務細節
- [ ] 計費形式：小時 / 專案 / 月聘 / 三種都接？
- [ ] 接案範圍：只接 AI 顧問，還是傳統架構顧問也接？
- [ ] 地理範圍：只接台灣，還是遠端國外也行？
- [ ] 是否設「第一次免費聊」？提案中已暫填，需確認

### B. 三個 AI 項目的對外可講範圍

> 這部分**最重要**，不能憑印象寫。

#### B1. Hermes Agent
- [ ] 你是「使用者 / 整合者 / 二次開發者 / 貢獻者」？
- [ ] 是 Nous Research 的開源 Hermes Agent，還是別的同名專案？
- [ ] 對外可講到哪：可寫專案名？還是只能寫「Agent 框架實踐」？

#### B2. 聯發科 Whisper（Breeze-ASR-26）
> 公開資訊已查到：MediaTek Research + 陽明交大 SAI Center 共同開發，2026/2 釋出，基於 Whisper-large-v2 微調，2B 參數，主打 Taigi（台語）→ 中文字輸出。Apache 2.0。
- [ ] 你的參與形式：使用 / 整合 / 顧問 / 員工 / 合作？
- [ ] 是否有 NDA？對外可寫到「參與聯發科 Whisper 相關項目」這個粒度嗎？
- [ ] 是 Breeze-ASR-26 還是更新的版本？

#### B3. LLM Wiki
- [ ] 公開專案 / 公司內部 / 個人作品？
- [ ] 對外名稱可不可以寫？還是只能講「企業內部知識庫 RAG」？

#### B4. RAG
- [ ] 是泛指經驗，還是有具體可講的代表性專案？

### C. 站上既有自誇數字確認
- [ ] `10,000+ API/day, p95 <200ms` — 還能掛嗎？要不要降級表達？
- [ ] `98% 學員滿意度 / 4.9 評分 / 95% 完成率 / 88% 推薦` — 出處？要不要加「N=XX 份問卷」標註避免被質疑？
- [ ] `10-50 場企業內訓` — 真實區間？要不要改成「20+ 場」這種更具體的？

### D. Navbar / 整體標識
- [ ] Logo 文字「AI 講師陳彥彤YC」要改「陳彥彤 YC」嗎？提案中已建議改
- [ ] 站名 `og:site_name` 要不要從「AI 講師」改「AI 顧問」？

### E. 新增 `/services` 頁
- [ ] 要做嗎？預估產出 1 個獨立頁 + 3 個服務區塊
- [ ] 諮詢預約流程：純 mailto？還是要接 Calendly / Cal.com？

### F. AI 工程師那段的克制度
- [ ] 提案中 About 區只寫「跑過 RAG、Agent、語音相關的項目」，不點名專案。
      作者覺得這樣**夠籠統**還是**太籠統**？要不要再具體一點？

---

## 附錄：實作優先順序建議

如果一次只能做一輪，建議優先級：

1. **P0（必做）：** Hero、About、Skills、Courses、Footer 文案改寫 + Person JSON-LD 修改
2. **P1（強烈建議）：** Stats 數字改 + Signature Work 第三欄改 + meta title/description 全站改
3. **P2（增量）：** 新增 `/services` 頁 + Experience 區塊 + ProfessionalService schema
4. **P3（後續）：** OG 圖重產 + Testimonials 補 AI 內訓案例 + Navbar 諮詢 CTA

---

> 本提案由 Claude 草擬，所有專案參與細節（Hermes Agent、聯發科 Whisper、LLM Wiki）皆未代作者宣稱，已標「待作者補充」。實作前請作者逐項過 §7。

<div align="center">

# 陳彥彤 YC · AI 內訓 & 顧問

**把 AI 真的接到公司系統的講師 — 內訓現場的範例,就是我自己 production 系統的同一段 code。**

[![Visit Site](https://img.shields.io/badge/🌐_yanchen184.github.io/ai--lecturer--bob-FACC15?style=for-the-badge&labelColor=000000)](https://yanchen.app/)
[![Email](https://img.shields.io/badge/📧_bobchen184@gmail.com-000000?style=for-the-badge)](mailto:bobchen184@gmail.com)

</div>

---

## ☝️ 一句話定位

> Java 後端 8 年 · AI 工程師 2 年 · AI 內訓 / AI 導入顧問 / 前後端與雲端培訓

**今天**:我每天用 Claude Code、AI Agent 寫 production
**這個月**:整理成你團隊一天可上手的內訓
**下週**:你的學員下課就能在自己工位繼續用

---

## 🎯 這個站在做什麼

不是部落格,是一個**正在運營中的個人品牌站 + Signature Work 展示**,涵蓋兩條主線:

| 主線 | 內容 | 對應頁面 |
|---|---|---|
| 🧠 **AI 工程實踐** | Claude Code、AI Agent、AI 工作流,我自己 production 在用的同一套 | [`/blog`](https://yanchen.app/blog) |
| ☸️ **Kubernetes 教學系列** | 40 篇 SEO 系列文,每日自動上線一篇 | [`/blog/k8s`](https://yanchen.app/blog/k8s) |

加上 3 個**真的上線在跑的 AI 顧問實作**(NDA 抽象化):醫療決策輔助、Breeze-ASR-25 語音辨識、會議 RAG。

---

## 🤝 接案合作

> **AI 企業內訓 · AI 導入顧問 · 前後端 / 雲端培訓 · 客製化開發**
> 採 **審估制** — 依需求情境、團隊規模、交付期程個案評估,歡迎來信討論。

📧 **bobchen184@gmail.com**

---

# 👇 以下為本站技術文件

## 技術棧

| 項目 | 選用 |
|------|------|
| 框架 | Astro 6 + React 19(Islands 模式) |
| 樣式 | Tailwind CSS 4 |
| 部署 | GitHub Pages(base: `/ai-lecturer-bob`) |
| 內容 | TypeScript 資料檔(`src/data/*.ts`),純靜態 |
| 排程 | Build 階段過濾 `publishDate`(無資料庫) |
| Blog 後台 | Firebase Firestore(文章 metadata) |

## 內容區塊

- **首頁**:作者介紹 + 精選文章 + Signature Work
- **AI 部落格**(`/blog`):AI 工具與開發實踐
- **K8s 學習筆記**(`/blog/k8s`):40 篇 SEO 系列文,每日自動發一篇

## K8s 文章排程

文章以 `src/data/k8sLessons.ts` 為單一資料源,按 `publishDate` 自動上線:

```bash
# 列出所有文章排程(已上線/排程中/草稿)
npm run schedule:list

# 預覽未來某天會上線哪幾篇
PUBLISH_OVERRIDE_DATE=2026-05-30 npm run schedule:list
```

排程邏輯位於 `src/lib/k8s.ts` — `getStaticPaths()` 在 build 時呼叫 `getAllK8sLessons()` 過濾掉未到 `publishDate` 與 `draft: true` 的文章。

## 開發

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # 產出到 dist/
npm run preview
```

## 專案結構

```
ai-lecturer-bob/
├── astro.config.mjs        # Astro 設定(base /ai-lecturer-bob)
├── public/                 # 靜態資源(favicon, og-default, blog 圖片)
├── scripts/
│   ├── generate-og.mjs     # 產生 OG 圖
│   └── list-schedule.mjs   # K8s 文章排程預覽 CLI
└── src/
    ├── pages/              # 路由(含 /blog/k8s/[slug])
    ├── layouts/
    ├── components/
    ├── sections/           # 首頁區塊
    ├── data/
    │   ├── articles.ts     # AI 部落格文章
    │   └── k8sLessons.ts   # K8s 系列文章(40 篇)
    ├── lib/
    │   └── k8s.ts          # 排程過濾邏輯
    └── styles/
```

## 部署

推上 `master` 即觸發 GitHub Actions → GitHub Pages。Workflow 在 `.github/workflows/`。

---

<div align="center">
<sub>© 2026 陳彥彤 YC (Bob Chen). All rights reserved.</sub>
</div>

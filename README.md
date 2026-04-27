# ai-lecturer-bob

陳彥誠（Bob）的個人技術部落格與 Signature Work 展示站。

聚焦「**Kubernetes 教學系列**」與「**AI 工程實踐**」兩條主線。

線上：https://yanchen184.github.io/ai-lecturer-bob/

## 技術棧

| 項目 | 選用 |
|------|------|
| 框架 | Astro 6 + React 19（Islands 模式） |
| 樣式 | Tailwind CSS 4 |
| 部署 | GitHub Pages（base: `/ai-lecturer-bob`） |
| 內容 | TypeScript 資料檔（`src/data/*.ts`），純靜態 |
| 排程 | Build 階段過濾 `publishDate`（無資料庫） |

## 內容區塊

- **首頁**：作者介紹 + 精選文章 + Signature Work
- **AI 部落格**（`/blog`）：AI 工具與開發實踐
- **K8s 學習筆記**（`/blog/k8s`）：40 篇 SEO 系列文，每日自動發一篇

## K8s 文章排程

文章以 `src/data/k8sLessons.ts` 為單一資料源，按 `publishDate` 自動上線：

```bash
# 列出所有文章排程（已上線/排程中/草稿）
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
├── astro.config.mjs        # Astro 設定（base /ai-lecturer-bob）
├── public/                 # 靜態資源（favicon, og-default, blog 圖片）
├── scripts/
│   ├── generate-og.mjs     # 產生 OG 圖
│   └── list-schedule.mjs   # K8s 文章排程預覽 CLI
└── src/
    ├── pages/              # 路由（含 /blog/k8s/[slug]）
    ├── layouts/
    ├── components/
    ├── sections/           # 首頁區塊
    ├── data/
    │   ├── articles.ts     # AI 部落格文章
    │   └── k8sLessons.ts   # K8s 系列文章（40 篇）
    ├── lib/
    │   └── k8s.ts          # 排程過濾邏輯
    └── styles/
```

## 部署

推上 `master` 即觸發 GitHub Actions → GitHub Pages。Workflow 在 `.github/workflows/`。

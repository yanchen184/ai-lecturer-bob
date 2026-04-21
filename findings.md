# Astro 遷移踩坑紀錄

## 技術雷點（開工前先掃雷）

### 1. Tailwind v3 → v4 破壞相容
- 舊專案用 Tailwind v3（`@tailwind base;` 寫法）
- `npx astro add tailwind` 裝的是 **Tailwind v4**（`@import "tailwindcss";`）
- **影響**：`tailwind.config.js` 不再是主要配置檔，改用 CSS 檔 `@theme { }` 內聯
- **決策**：Astro MVP 直接用 v4，不要為了相容裝 v3 retrofit plugin
- **動作**：
  - 搬 `src/index.css` → `astro-site/src/styles/global.css` 時，`@tailwind` 改 `@import`
  - 自訂顏色（`#FFEB3B` 黃、`#C4A77D` 牛皮紙）用 CSS custom properties 或 Tailwind arbitrary values（`bg-[#FFEB3B]`，這個兩版都能用）
  - 避開 `theme.extend.colors` 寫法，改在 CSS 用 `@theme`

### 2. Firestore build-time fetch
- **問題**：Astro SSG 的 `getStaticPaths()` 在 Node 環境跑，但 `firebase/firestore` 預設是 browser SDK
- **解法選項**：
  - (A) **Admin SDK** (`firebase-admin`)：在 Node 環境安全跑，但要 service account JSON
  - (B) **Client SDK 跑在 Node**：可以 work，但需要 `node-fetch` polyfill，且 auth 規則要允許 anonymous read
- **決策**：用 **(B) Client SDK**，因為：
  - Firestore `bob_blog_posts` collection 本來就是 public read（部落格嘛）
  - 不用處理 service account 機密
  - Node 22 原生支援 fetch，不用 polyfill
- **Fallback**：build 時 Firestore 失敗 → 用 `src/data/blogPosts.ts` 靜態陣列當保底
- **風險**：發新文後要重新 build（Astro SSG 本質）→ 要做 Vercel webhook 讓 Firestore 更新 → 觸發 redeploy

### 3. React Context 在 SSG 的限制
- `BlogStyleContext` 用 `localStorage` → SSR 時 `window` / `localStorage` 不存在 → build 會炸
- **解法**：
  - Layout 給靜態 `neub` 作為預設
  - `BlogStyleSwitcher` 標 `client:load`（只在瀏覽器跑）
  - 讀 localStorage 前 guard：`typeof window !== 'undefined'`
  - Context Provider 可以在 client island 內建立
- **決策**：雙風格切換完全變成 client island，SSR 時 HTML 出 Neub 版（SEO 看到的是 Neub，已足夠）

### 4. Astro React integration 和 react-helmet-async
- Astro 原生支援 meta/head 管理（`<head>` 在 `.astro` 檔直接寫）
- **不需要 react-helmet-async**
- **決策**：Astro 版移除 `react-helmet-async`，每個頁面在 `.astro` 的 frontmatter 處理 SEO meta

---

## 完整範圍（無 MVP，全部搬）

### 搬到 Astro
- `/` 首頁（swiss-modernism 主題）→ SSR 真 HTML
- `/blog` 列表 → SSR 真 HTML
- `/blog/[slug]` 每篇文章 → SSR 真 HTML（build 時從 Firestore 生成）
- `/style/ai-native`、`/style/aurora`、`/style/bento-box`、`/style/bold-typography`、`/style/liquid-glass` 五個主題頁
- `/styles` 主題 showcase
- `/contact`（如果原本有獨立頁就搬）
- sitemap.xml / rss.xml（Astro integration）
- robots.txt

### Admin 的處理策略
- `/admin` 是動態互動頁面（訂閱 Firestore、表單編輯器）
- **決策**：Admin 也放進 Astro，但整頁標 `client:only="react"`（全島嶼，SSG 只出殼）
- 這樣保留單一部署、單一 repo、不用額外維護 admin 子網域
- SEO 不需要 index admin（robots.txt 加 Disallow）

### 主題展示頁的處理
- 五個主題頁是 React-heavy（有動畫、滾動特效、互動）
- **決策**：每個 ThemePage 用 `client:load` 島嶼包整頁
- Astro 頁面只負責 SEO meta + 靜態外殼
- React components 整份搬過去當 island

---

## 架構決策

| 項目 | 決策 | 理由 |
|------|------|------|
| CSS | Tailwind v4（Astro 預設） | 不硬撐 v3 |
| Firestore | Client SDK（Node 跑） | 免 service account |
| 雙風格切換 | Client island | SSR 只給 Neub |
| Meta/head | Astro 原生 | 不用 react-helmet |
| Site URL | `PUBLIC_SITE_URL` 環境變數 | Vercel / 自訂網域零改動 |
| 部署 | Vercel | Astro 原生適配、免費 tier 夠用 |
| RSS/Sitemap | Astro integration 自動 | 不手寫 |

---

## 遇到錯誤再補

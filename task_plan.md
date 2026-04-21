# 遷移 Astro + SEO 完整化計畫

## 目標
把現有 Vite+React SPA 遷移到 Astro SSG，每篇部落格文章 build 時產生真實 HTML，
部署到 Vercel，讓 Google / Bing / LINE 都能正確索引和抓 OG。

## 階段

### Phase 1 — 治標（GitHub Pages 版先修好）
- [x] HashRouter → BrowserRouter（保留 /ai-lecturer-bob/ basename）
- [x] public/404.html SPA redirect hack
- [x] index.html 加回還原 script
- [x] sitemap.xml / rss.xml / JSON-LD 移除所有 #/

### Phase 2 — 治本（Astro 遷移，平行開發）
- [x] 新建 Astro 專案（astro-site/）
- [x] Tailwind v4 + 字型 + global CSS 搬過去
- [x] Layout：RootLayout（含 SEO meta / OG / Person JSON-LD）
- [x] React 島嶼：BlogFilters（搜尋 / 分類 / 標籤篩選）
- [x] Firestore Client SDK build-time fetch + staticPosts fallback
- [x] pages/index.astro（極簡首頁，LATEST 3 篇）
- [x] pages/blog/index.astro（列表頁，SSR HTML + 客戶端篩選島嶼）
- [x] pages/blog/[slug].astro（單篇 SSG，TOC + 相關文章）
- [x] @astrojs/sitemap 自動產生
- [x] @astrojs/rss 自動產生（/rss.xml）
- [x] 每篇 JSON-LD BlogPosting + BreadcrumbList
- [ ] 五個主題頁（/style/ai-native 等）— 後續 commit
- [ ] Admin 頁（client:only 島嶼）— 後續 commit
- [ ] BlogStyleSwitcher Anti 風格切換 — 後續 commit
- [ ] 每篇文章動態 OG image（@vercel/og）— Phase 3 後做

### Phase 3 — 部署（等使用者執行）
- [x] vercel.json（monorepo build config）
- [ ] 使用者 `npm i -g vercel && vercel login`
- [ ] 使用者 `vercel` 在 repo 根目錄跑起來 → 第一次部署
- [ ] 設環境變數：PUBLIC_SITE_URL（日後綁自訂網域才填）
- [ ] 部署到 xxx.vercel.app 先跑起來
- [ ] Lighthouse SEO 驗證
- [ ] 舊 GitHub Pages 301 redirect

### Phase 4 — SEO 收尾
- [ ] Google Search Console 驗證 + sitemap 提交
- [ ] Bing Webmaster 提交
- [ ] Rich Results Test 跑 JSON-LD

### Phase 5 — 網域（等使用者買完）
- [ ] 使用者買網域
- [ ] Cloudflare DNS 設 CNAME / A record
- [ ] Vercel 綁定網域
- [ ] HTTPS 自動申請
- [ ] 更新所有 SITE_URL 常數

## 筆記
- 網域未定，所有 URL 先用環境變數 PUBLIC_SITE_URL
- Firestore 真文章：Astro 從 Firestore + blogPosts.ts fallback build
- 動態 OG：@vercel/og + 兩種風格模板

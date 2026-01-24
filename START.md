# AI講師陳彥彤 - 個人網站

## 專案資訊

- **版本**: 1.0.0
- **網站網址**: https://yanchen184.github.io/ai-lecturer-bob/
- **技術棧**: React + TypeScript + Tailwind CSS + Vite

## SEO 優化特色

### 1. Meta Tags 優化
- 完整的 title 和 description
- Open Graph (OG) 標籤支援社群分享
- Twitter Card 支援
- Canonical URL 設定

### 2. 結構化資料 (JSON-LD)
- **Person Schema**: AI講師陳彥彤的個人資訊
- **Course Schema**: 課程資訊
- **FAQPage Schema**: 常見問題

### 3. 技術 SEO
- `robots.txt` 允許搜尋引擎索引
- `sitemap.xml` 網站地圖
- 語意化 HTML 標籤
- ARIA 無障礙標籤
- 響應式設計

### 4. 關鍵字策略
**主要關鍵字**:
- AI講師
- 陳彥彤
- 人工智慧講師
- AI教學
- ChatGPT講師

**長尾關鍵字**:
- AI企業培訓
- Prompt Engineering 教學
- 機器學習課程
- 深度學習教學

## 本地開發

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 建置
npm run build

# 預覽建置結果
npm run preview
```

## 部署

推送到 master 分支後，GitHub Actions 會自動部署到 GitHub Pages。

## 提升 SEO 排名的建議

1. **提交到 Google Search Console**
   - 驗證網站所有權
   - 提交 sitemap.xml
   - 檢查索引狀態

2. **建立反向連結**
   - 在其他平台分享網站連結
   - 在 GitHub profile 加入網站連結
   - 在社群媒體分享

3. **持續更新內容**
   - 定期更新課程資訊
   - 新增作品集項目
   - 更新學員回饋

4. **效能優化**
   - 圖片優化
   - 程式碼分割
   - 快取策略

## 檔案結構

```
ai-lecturer-bob/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Skills.tsx
│   │   ├── Courses.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Testimonials.tsx
│   │   └── Contact.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html (含完整 SEO meta tags)
└── vite.config.ts
```

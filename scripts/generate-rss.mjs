/**
 * 建置時產生 RSS 2.0 feed。
 *
 * 資料來源：src/data/blogPosts.ts（靜態 fallback 陣列）
 * 輸出：public/rss.xml（build 時被 Vite 複製到 dist/）
 *
 * 執行方式（由 package.json prebuild 自動呼叫）：
 *   node --experimental-strip-types scripts/generate-rss.mjs
 *
 * 為何用 .mjs + strip-types：
 *   - 專案目前沒裝 tsx / ts-node，避免僅為腳本新增 devDependency
 *   - Node 22.12 原生支援 --experimental-strip-types，可直接 import .ts
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

const SITE_URL = 'https://yanchen184.github.io/ai-lecturer-bob'
const BLOG_PATH = '#/blog'
const FEED_TITLE = '陳彥彤的技術部落格'
const FEED_DESCRIPTION =
  '程式講師陳彥彤分享後端開發技術、Spring Boot 實戰、React 開發心得、系統架構設計經驗'
const FEED_LANGUAGE = 'zh-TW'
const FEED_AUTHOR_EMAIL = 'bobchen184@gmail.com'
const FEED_AUTHOR_NAME = '陳彥彤'

/**
 * 對 XML 特殊字元做跳脫，避免 RSS 內文出現 &, <, > 等破壞結構。
 */
const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/**
 * 以 <![CDATA[ ... ]]> 包裝 HTML / Markdown 內文。
 * 額外處理 `]]>` 以免提早終結 CDATA 區段。
 */
const wrapCdata = (value) => {
  const safe = String(value).replace(/\]\]>/g, ']]]]><![CDATA[>')
  return `<![CDATA[${safe}]]>`
}

/**
 * 將 ISO 日期字串（例如 "2024-01-15"）轉為 RFC-822 格式（RSS pubDate 規範）。
 */
const toRfc822 = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00+08:00`)
  if (Number.isNaN(date.getTime())) {
    // 防止 BlogPost 資料錯誤時導致整個 feed 無法產生
    return new Date().toUTCString()
  }
  return date.toUTCString()
}

const buildPostUrl = (slug) => `${SITE_URL}/${BLOG_PATH}/${slug}`

const renderItem = (post) => {
  const link = buildPostUrl(post.slug)
  const categories = (post.tags ?? [])
    .map((tag) => `      <category>${escapeXml(tag)}</category>`)
    .join('\n')

  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${wrapCdata(post.excerpt)}</description>
      <content:encoded>${wrapCdata(post.content)}</content:encoded>
      <pubDate>${toRfc822(post.publishDate)}</pubDate>
      <dc:creator>${escapeXml(post.author || FEED_AUTHOR_NAME)}</dc:creator>
      <author>${escapeXml(FEED_AUTHOR_EMAIL)} (${escapeXml(
        post.author || FEED_AUTHOR_NAME
      )})</author>
${categories}
    </item>`
}

const renderFeed = (posts) => {
  const lastBuildDate = new Date().toUTCString()
  const items = posts.map(renderItem).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}/${BLOG_PATH}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>${FEED_LANGUAGE}</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(FEED_AUTHOR_NAME)}</copyright>
    <managingEditor>${escapeXml(FEED_AUTHOR_EMAIL)} (${escapeXml(
      FEED_AUTHOR_NAME
    )})</managingEditor>
    <webMaster>${escapeXml(FEED_AUTHOR_EMAIL)} (${escapeXml(FEED_AUTHOR_NAME)})</webMaster>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`
}

const main = async () => {
  const blogPostsPath = pathToFileURL(
    resolve(projectRoot, 'src/data/blogPosts.ts')
  ).href
  const mod = await import(blogPostsPath)
  const posts = mod.blogPosts ?? []

  if (!Array.isArray(posts) || posts.length === 0) {
    console.error('[generate-rss] blogPosts 為空，略過產生 rss.xml')
    return
  }

  // 依發佈日期新到舊排序，確保 RSS reader 顯示順序正確
  const sorted = [...posts].sort((a, b) =>
    a.publishDate < b.publishDate ? 1 : -1
  )

  const xml = renderFeed(sorted)
  const outDir = resolve(projectRoot, 'public')
  const outPath = resolve(outDir, 'rss.xml')

  mkdirSync(outDir, { recursive: true })
  writeFileSync(outPath, xml, 'utf8')

  console.log(`[generate-rss] 已產生 ${outPath}（${sorted.length} 篇文章）`)
}

main().catch((error) => {
  console.error('[generate-rss] 產生失敗:', error)
  process.exit(1)
})

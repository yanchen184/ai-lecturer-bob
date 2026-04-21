/**
 * 建置時產生 sitemap.xml。
 *
 * 收錄：
 *   - 靜態頁面：/（首頁）、/blog（部落格列表）
 *   - 動態頁面：/blog/{slug}（每篇 blogPosts.ts 中的文章）
 *
 * 輸出：public/sitemap.xml
 *
 * 執行方式（由 package.json prebuild 自動呼叫）：
 *   node --experimental-strip-types scripts/generate-sitemap.mjs
 *
 * 本站改用 BrowserRouter，URL 為 https://.../blog/slug（真正 path）。
 * Google / Bing / 各家爬蟲都能正常索引，搭配 public/404.html SPA hack。
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

const SITE_URL = 'https://yanchen184.github.io/ai-lecturer-bob'

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/**
 * 確保 lastmod 是 YYYY-MM-DD 格式，無效日期 fallback 到今天。
 */
const normalizeLastmod = (isoDate) => {
  if (typeof isoDate !== 'string') return new Date().toISOString().slice(0, 10)
  const date = new Date(`${isoDate}T00:00:00+08:00`)
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return isoDate.slice(0, 10)
}

const renderUrl = ({ loc, lastmod, changefreq, priority }) =>
  `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`

const main = async () => {
  const blogPostsPath = pathToFileURL(
    resolve(projectRoot, 'src/data/blogPosts.ts')
  ).href
  const mod = await import(blogPostsPath)
  const posts = mod.blogPosts ?? []

  const today = new Date().toISOString().slice(0, 10)
  const latestPostDate = posts.reduce((latest, post) => {
    const date = normalizeLastmod(post.updateDate || post.publishDate)
    return date > latest ? date : latest
  }, today)

  const entries = [
    {
      loc: `${SITE_URL}/`,
      lastmod: latestPostDate,
      changefreq: 'weekly',
      priority: '1.0',
    },
    {
      loc: `${SITE_URL}/blog`,
      lastmod: latestPostDate,
      changefreq: 'weekly',
      priority: '0.9',
    },
    ...posts.map((post) => ({
      loc: `${SITE_URL}/blog/${post.slug}`,
      lastmod: normalizeLastmod(post.updateDate || post.publishDate),
      changefreq: 'weekly',
      priority: '0.8',
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(renderUrl).join('\n')}
</urlset>
`

  const outDir = resolve(projectRoot, 'public')
  const outPath = resolve(outDir, 'sitemap.xml')

  mkdirSync(outDir, { recursive: true })
  writeFileSync(outPath, xml, 'utf8')

  console.log(
    `[generate-sitemap] 已產生 ${outPath}（${entries.length} 筆 URL，含 ${posts.length} 篇文章）`
  )
}

main().catch((error) => {
  console.error('[generate-sitemap] 產生失敗:', error)
  process.exit(1)
})

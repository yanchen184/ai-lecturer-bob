import { readFileSync } from 'node:fs'
import { argv } from 'node:process'
import { request } from 'node:https'

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : fallback
}

const slug = arg('slug')
const title = arg('title')
const excerpt = arg('excerpt')
const contentPath = arg('content-file')
const category = arg('category', 'AI 工具')
const tagsRaw = arg('tags', '')
const author = arg('author', '陳彥彤')
const publishDate = arg('publish-date', new Date().toISOString().slice(0, 10))
const readingTime = parseInt(arg('reading-time', '7'), 10)
const featured = arg('featured', 'false') === 'true'
const faqPath = arg('faq-file')

if (!slug || !title || !excerpt || !contentPath) {
  console.error('Usage: node publish-blog.mjs --slug ... --title ... --excerpt ... --content-file ... [--tags a,b,c] [--category ...] [--reading-time N] [--featured true] [--publish-date YYYY-MM-DD] [--faq-file path/to/faq.json]')
  console.error('  --faq-file: JSON file with array of {q, a} objects (P1 AI Search 優化用)')
  process.exit(1)
}

const content = readFileSync(contentPath, 'utf-8')
const tags = tagsRaw.split(',').map(s => s.trim()).filter(Boolean)
const nowIso = new Date().toISOString()

let faqItems = []
if (faqPath) {
  const raw = JSON.parse(readFileSync(faqPath, 'utf-8'))
  if (!Array.isArray(raw)) {
    console.error('faq-file 必須是 JSON array of {q, a}')
    process.exit(1)
  }
  faqItems = raw
    .filter(it => it && typeof it.q === 'string' && typeof it.a === 'string')
    .map(it => ({ q: it.q, a: it.a }))
  if (faqItems.length < 4) {
    console.warn(`[warn] FAQ 只有 ${faqItems.length} 題，建議至少 4 題（P1 AI Search 優化）`)
  }
}

const fields = {
  slug: { stringValue: slug },
  title: { stringValue: title },
  excerpt: { stringValue: excerpt },
  content: { stringValue: content },
  author: { stringValue: author },
  category: { stringValue: category },
  publishDate: { stringValue: publishDate },
  readingTime: { integerValue: String(readingTime) },
  featured: { booleanValue: featured },
  published: { booleanValue: true },
  defaultStyle: { stringValue: 'neub' },
  createdAtIso: { stringValue: nowIso },
  updatedAtIso: { stringValue: nowIso },
  tags: {
    arrayValue: {
      values: tags.map(t => ({ stringValue: t })),
    },
  },
}

if (faqItems.length > 0) {
  fields.faqItems = {
    arrayValue: {
      values: faqItems.map(item => ({
        mapValue: {
          fields: {
            q: { stringValue: item.q },
            a: { stringValue: item.a },
          },
        },
      })),
    },
  }
}

const path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?key=${API_KEY}`
const body = JSON.stringify({ fields })

const req = request({
  hostname: 'firestore.googleapis.com',
  path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let data = ''
  res.on('data', c => data += c)
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const json = JSON.parse(data)
      const docId = json.name.split('/').pop()
      console.log(JSON.stringify({
        ok: true,
        docId,
        slug,
        publishDate,
        faqCount: faqItems.length,
        url: `https://yanchen184.github.io/ai-lecturer-bob/blog/${slug}/`,
      }, null, 2))
    } else {
      console.error('Publish failed:', res.statusCode, data)
      process.exit(1)
    }
  })
})

req.on('error', (e) => { console.error(e); process.exit(1) })
req.write(body)
req.end()

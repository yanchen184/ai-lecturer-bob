import { Hono } from 'hono';
import { authMiddleware } from './middleware';
import type { Env, Variables } from './types';

const members = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /members/posts —— 公開清單,只回標題/摘要/slug,不含全文（給靜態頁 build 時抓,吃 SEO）
members.get('/posts', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT slug, title, excerpt, tags, cover, created_at, sort_order
     FROM member_posts WHERE published = 1
     ORDER BY sort_order DESC, created_at DESC`,
  ).all();
  return c.json({ ok: true, posts: results });
});

// GET /members/content?slug= —— 鎖的全文,要 JWT。回全文 + 同步寫 read_logs
members.get('/content', authMiddleware, async (c) => {
  const slug = c.req.query('slug');
  if (!slug) return c.json({ ok: false, error: 'missing_slug' }, 400);

  const post = await c.env.DB.prepare(
    `SELECT slug, title, excerpt, content_md, tags, cover, created_at
     FROM member_posts WHERE slug = ? AND published = 1`,
  )
    .bind(slug)
    .first<{ slug: string; title: string; content_md: string }>();
  if (!post) return c.json({ ok: false, error: 'not_found' }, 404);

  const m = c.get('member');
  await c.env.DB.prepare(
    'INSERT INTO read_logs (member_id, slug, title, read_at) VALUES (?, ?, ?, ?)',
  )
    .bind(m.sub, post.slug, post.title, Date.now())
    .run();

  return c.json({ ok: true, post });
});

// POST /track/read —— 備用顯式記閱讀（前端某些情境用得到）
members.post('/track/read', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => null);
  const slug = typeof body?.slug === 'string' ? body.slug : null;
  if (!slug) return c.json({ ok: false, error: 'missing_slug' }, 400);
  const m = c.get('member');
  await c.env.DB.prepare(
    'INSERT INTO read_logs (member_id, slug, title, read_at) VALUES (?, ?, ?, ?)',
  )
    .bind(m.sub, slug, typeof body?.title === 'string' ? body.title : null, Date.now())
    .run();
  return c.json({ ok: true });
});

export default members;

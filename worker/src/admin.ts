import { Hono } from 'hono';
import { adminMiddleware } from './middleware';
import type { Env, Variables } from './types';

const admin = new Hono<{ Bindings: Env; Variables: Variables }>();

admin.use('*', adminMiddleware);

// GET /admin/stats —— 總覽:會員數、登入統計、閱讀統計
admin.get('/stats', async (c) => {
  const db = c.env.DB;

  const memberCount = await db.prepare('SELECT COUNT(*) AS n FROM members').first<{ n: number }>();
  const loginCount = await db
    .prepare("SELECT COUNT(*) AS n FROM login_logs WHERE outcome = 'success'")
    .first<{ n: number }>();
  const readCount = await db.prepare('SELECT COUNT(*) AS n FROM read_logs').first<{ n: number }>();

  const recentLogins = await db
    .prepare(
      `SELECT l.logged_at, l.email, l.outcome, l.ip, m.display_name
       FROM login_logs l LEFT JOIN members m ON m.id = l.member_id
       ORDER BY l.logged_at DESC LIMIT 50`,
    )
    .all();

  const readsByPost = await db
    .prepare(
      `SELECT slug, COUNT(*) AS reads, COUNT(DISTINCT member_id) AS readers
       FROM read_logs GROUP BY slug ORDER BY reads DESC`,
    )
    .all();

  const recentReads = await db
    .prepare(
      `SELECT r.read_at, r.slug, r.title, m.email, m.display_name
       FROM read_logs r LEFT JOIN members m ON m.id = r.member_id
       ORDER BY r.read_at DESC LIMIT 50`,
    )
    .all();

  return c.json({
    ok: true,
    stats: {
      members: memberCount?.n ?? 0,
      successfulLogins: loginCount?.n ?? 0,
      totalReads: readCount?.n ?? 0,
    },
    recentLogins: recentLogins.results,
    readsByPost: readsByPost.results,
    recentReads: recentReads.results,
  });
});

// GET /admin/members —— 會員明細（含每人登入/閱讀次數）
admin.get('/members', async (c) => {
  const limit = Math.min(Number(c.req.query('limit')) || 100, 500);
  const offset = Number(c.req.query('offset')) || 0;
  const { results } = await c.env.DB.prepare(
    `SELECT m.id, m.email, m.display_name, m.status, m.created_at, m.last_login_at,
            (SELECT COUNT(*) FROM login_logs l WHERE l.member_id = m.id AND l.outcome='success') AS login_count,
            (SELECT COUNT(*) FROM read_logs r WHERE r.member_id = m.id) AS read_count
     FROM members m ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(limit, offset)
    .all();
  return c.json({ ok: true, members: results });
});

export default admin;

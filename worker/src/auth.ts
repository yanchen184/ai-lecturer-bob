import { Hono } from 'hono';
import type { Context } from 'hono';
import { hashPassword, verifyPassword, signJwt } from './crypto';
import type { Env, Variables, MemberRow } from './types';

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const e = email.trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
}

function publicMember(row: MemberRow) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

// POST /auth/register —— 註冊即登入
auth.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = normEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';
  const displayName =
    typeof body?.displayName === 'string' ? body.displayName.trim().slice(0, 60) : null;

  if (!email) return c.json({ ok: false, error: 'invalid_email' }, 400);
  if (password.length < 6) return c.json({ ok: false, error: 'password_too_short' }, 400);

  const exists = await c.env.DB.prepare('SELECT id FROM members WHERE email = ?')
    .bind(email)
    .first();
  if (exists) return c.json({ ok: false, error: 'email_taken' }, 409);

  const rec = await hashPassword(password);
  const now = Date.now();
  const res = await c.env.DB.prepare(
    `INSERT INTO members (email, password_hash, salt, pbkdf2_iter, display_name, status, created_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
  )
    .bind(email, rec.hash, rec.salt, rec.iter, displayName, now, now)
    .run();

  const id = res.meta.last_row_id as number;
  const token = await signJwt({ sub: id, email }, c.env.JWT_SECRET);
  await logLogin(c.env, id, email, c.req.raw, 'success');

  return c.json({
    ok: true,
    token,
    member: { id, email, displayName, createdAt: now, lastLoginAt: now },
  });
});

// POST /auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = normEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password) return c.json({ ok: false, error: 'invalid_credentials' }, 400);

  const row = await c.env.DB.prepare('SELECT * FROM members WHERE email = ?')
    .bind(email)
    .first<MemberRow>();

  // 不論成敗都記 login_logs（失敗也要,Bob 要看誰登入)
  if (!row || row.status !== 'active') {
    await logLogin(c.env, row?.id ?? null, email, c.req.raw, 'fail');
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
  }

  const valid = await verifyPassword(password, {
    hash: row.password_hash,
    salt: row.salt,
    iter: row.pbkdf2_iter,
  });
  if (!valid) {
    await logLogin(c.env, row.id, email, c.req.raw, 'fail');
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
  }

  const now = Date.now();
  await c.env.DB.prepare('UPDATE members SET last_login_at = ? WHERE id = ?')
    .bind(now, row.id)
    .run();
  await logLogin(c.env, row.id, email, c.req.raw, 'success');

  const token = await signJwt({ sub: row.id, email }, c.env.JWT_SECRET);
  return c.json({ ok: true, token, member: publicMember({ ...row, last_login_at: now }) });
});

// POST /auth/logout —— 無狀態,前端丟 token 即可
auth.post('/logout', (c) => c.json({ ok: true }));

// /me handler（給 index.ts 掛在根層 /me,前置 authMiddleware）
export async function meHandler(c: Context<{ Bindings: Env; Variables: Variables }>) {
  const m = c.get('member');
  const row = await c.env.DB.prepare('SELECT * FROM members WHERE id = ?')
    .bind(m.sub)
    .first<MemberRow>();
  if (!row) return c.json({ ok: false, error: 'not_found' }, 404);
  return c.json({ ok: true, member: publicMember(row) });
}

async function logLogin(
  env: Env,
  memberId: number | null,
  email: string,
  req: Request,
  outcome: 'success' | 'fail',
) {
  const ip = req.headers.get('CF-Connecting-IP') || '';
  const ua = (req.headers.get('User-Agent') || '').slice(0, 300);
  await env.DB.prepare(
    'INSERT INTO login_logs (member_id, email, logged_at, ip, user_agent, outcome) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(memberId, email, Date.now(), ip, ua, outcome)
    .run();
}

export default auth;

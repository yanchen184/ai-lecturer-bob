import type { Context, Next } from 'hono';
import { verifyJwt, timingSafeEqual } from './crypto';
import type { Env, Variables } from './types';

type Ctx = Context<{ Bindings: Env; Variables: Variables }>;

/** 從 Authorization: Bearer <token> 取 token */
export function bearer(c: Ctx): string | null {
  const h = c.req.header('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/** 會員 JWT 驗證：驗過把 payload 塞進 c.var.member */
export async function authMiddleware(c: Ctx, next: Next) {
  const token = bearer(c);
  if (!token) return c.json({ ok: false, error: 'missing_token' }, 401);
  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ ok: false, error: 'invalid_token' }, 401);
  c.set('member', payload);
  await next();
}

/** admin：Authorization: Bearer <ADMIN_TOKEN>，常數時間比對 */
export async function adminMiddleware(c: Ctx, next: Next) {
  const token = bearer(c);
  if (!token || !c.env.ADMIN_TOKEN || !timingSafeEqual(token, c.env.ADMIN_TOKEN)) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  await next();
}

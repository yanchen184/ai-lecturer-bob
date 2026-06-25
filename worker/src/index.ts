import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth, { meHandler } from './auth';
import members from './members';
import admin from './admin';
import { authMiddleware } from './middleware';
import type { Env, Variables } from './types';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS：白名單前端網域（不是 wildcard）。Bearer token,不用 cookie → credentials:false
app.use('*', (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return cors({
    origin: (origin) => (allowed.includes(origin) ? origin : allowed[0] || ''),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    credentials: false,
    maxAge: 86400,
  })(c, next);
});

app.get('/', (c) => c.json({ ok: true, service: 'bob-members', ts: Date.now() }));
app.get('/health', (c) => c.json({ ok: true }));

app.route('/auth', auth);
app.route('/members', members);
app.route('/admin', admin);

// /me（前端習慣打根層 /me）→ 用 auth router 內的同款 handler
app.get('/me', authMiddleware, meHandler);

app.notFound((c) => c.json({ ok: false, error: 'not_found' }, 404));
app.onError((err, c) => {
  console.error('worker error', err);
  return c.json({ ok: false, error: 'internal' }, 500);
});

export default app;

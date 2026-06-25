import type { JwtPayload } from './crypto';

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
  JWT_SECRET: string;
  ADMIN_TOKEN: string;
}

// Hono context variables
export type Variables = {
  member: JwtPayload;
};

export interface MemberRow {
  id: number;
  email: string;
  password_hash: string;
  salt: string;
  pbkdf2_iter: number;
  display_name: string | null;
  status: string;
  created_at: number;
  last_login_at: number | null;
}

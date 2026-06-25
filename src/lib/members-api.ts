/**
 * 會員專區後端（Cloudflare Worker @ api.yanchen.app）的前端薄封裝。
 * - token 存 localStorage，打受保護端點時帶 Authorization: Bearer
 * - 純瀏覽器端用（client island），SSG build 時的公開清單抓取另走 fetchPublicPosts
 */

const API_BASE = import.meta.env.PUBLIC_MEMBERS_API || 'https://api.yanchen.app';
const TOKEN_KEY = 'bob_member_token';

export interface Member {
  id: number;
  email: string;
  displayName: string | null;
  createdAt: number;
  lastLoginAt: number | null;
}

export interface PublicPost {
  slug: string;
  title: string;
  excerpt: string;
  tags: string | null;
  cover: string | null;
  created_at: number;
  sort_order: number;
}

export interface FullPost {
  slug: string;
  title: string;
  excerpt: string;
  content_md: string;
  tags: string | null;
  cover: string | null;
  created_at: number;
}

interface AuthResponse {
  ok: boolean;
  token?: string;
  member?: Member;
  error?: string;
}

// ---- token（localStorage）----
export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
export function isLoggedIn(): boolean {
  return !!getToken();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

// ---- auth ----
export async function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResponse> {
  const data = await postJson<AuthResponse>('/auth/register', { email, password, displayName });
  if (data.ok && data.token) setToken(data.token);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await postJson<AuthResponse>('/auth/login', { email, password });
  if (data.ok && data.token) setToken(data.token);
  return data;
}

export function logout(): void {
  clearToken();
}

export async function getMe(): Promise<Member | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) clearToken();
    return null;
  }
  const data = (await res.json()) as { ok: boolean; member?: Member };
  return data.member ?? null;
}

// ---- 鎖的全文（帶 token；後端會自動記 read_log）----
export async function getContent(slug: string): Promise<FullPost | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/members/content?slug=${encodeURIComponent(slug)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) clearToken();
    return null;
  }
  const data = (await res.json()) as { ok: boolean; post?: FullPost };
  return data.post ?? null;
}

/**
 * SSG build 時抓公開清單（標題 + 摘要，吃 SEO）。
 * build 環境用 PUBLIC_MEMBERS_API 或預設線上網址；後端沒上線時回空陣列（讓 build 不掛）。
 */
export async function fetchPublicPosts(): Promise<PublicPost[]> {
  try {
    const res = await fetch(`${API_BASE}/members/posts`);
    if (!res.ok) return [];
    const data = (await res.json()) as { ok: boolean; posts?: PublicPost[] };
    return data.posts ?? [];
  } catch {
    return [];
  }
}

// ---- admin（後台用,帶 ADMIN_TOKEN,與會員 JWT 不同 secret）----
export interface AdminStats {
  ok: boolean;
  stats: { members: number; successfulLogins: number; totalReads: number };
  recentLogins: Array<{
    logged_at: number;
    email: string;
    outcome: string;
    ip: string;
    display_name: string | null;
  }>;
  readsByPost: Array<{ slug: string; reads: number; readers: number }>;
  recentReads: Array<{
    read_at: number;
    slug: string;
    title: string | null;
    email: string | null;
    display_name: string | null;
  }>;
}

export interface AdminMember {
  id: number;
  email: string;
  display_name: string | null;
  status: string;
  created_at: number;
  last_login_at: number | null;
  login_count: number;
  read_count: number;
}

export async function fetchAdminStats(adminToken: string): Promise<AdminStats | null> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as AdminStats;
}

export async function fetchAdminMembers(adminToken: string): Promise<AdminMember[]> {
  const res = await fetch(`${API_BASE}/admin/members`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { ok: boolean; members?: AdminMember[] };
  return data.members ?? [];
}

export { API_BASE };

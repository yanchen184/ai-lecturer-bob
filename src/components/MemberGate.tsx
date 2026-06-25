import { useEffect, useState, type FormEvent } from 'react';
import {
  register,
  login,
  logout,
  getMe,
  getContent,
  isLoggedIn,
  type Member,
  type FullPost,
} from '../lib/members-api';
import { mdToHtml } from '../lib/mini-markdown';

/**
 * 會員解鎖閘門（client island，掛在每篇作品文摘要下方）。
 * - 未登入：顯示註冊/登入表單（摘要已由 Astro 靜態渲染在上方,吃 SEO）
 * - 已登入：打 /members/content?slug= 拿全文,渲染（後端同步記 read_log）
 */

interface MemberGateProps {
  slug: string;
  title: string;
}

type Mode = 'login' | 'register';

export default function MemberGate({ slug, title }: MemberGateProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [checking, setChecking] = useState(true);
  const [post, setPost] = useState<FullPost | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  const [mode, setMode] = useState<Mode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 初次掛載：有 token 就驗 + 抓全文
  useEffect(() => {
    let active = true;
    (async () => {
      if (!isLoggedIn()) {
        if (active) setChecking(false);
        return;
      }
      const me = await getMe();
      if (!active) return;
      setMember(me);
      setChecking(false);
      if (me) void loadPost();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPost() {
    setLoadingPost(true);
    const p = await getContent(slug);
    setPost(p);
    setLoadingPost(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res =
        mode === 'register'
          ? await register(email.trim(), password, displayName.trim() || undefined)
          : await login(email.trim(), password);
      if (!res.ok) {
        setError(errorText(res.error));
        return;
      }
      setMember(res.member ?? null);
      await loadPost();
    } catch {
      setError('連線失敗,請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    setMember(null);
    setPost(null);
  }

  if (checking) {
    return (
      <div className="border-2 border-dashed border-black p-8 text-center text-sm opacity-60 font-mono">
        checking...
      </div>
    );
  }

  // 已登入：顯示全文
  if (member) {
    return (
      <div>
        <div
          className="flex items-center justify-between gap-3 mb-6 px-4 py-3 border-2 border-black bg-white"
          style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
        >
          <span className="text-sm font-bold font-mono truncate">
            ✓ {member.displayName || member.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest font-black border-2 border-black px-2 py-1 font-mono hover:bg-black hover:text-white transition-colors"
          >
            logout
          </button>
        </div>
        {loadingPost ? (
          <div className="border-2 border-dashed border-black p-8 text-center text-sm opacity-60 font-mono">
            loading full content...
          </div>
        ) : post ? (
          <article
            className="member-content leading-relaxed"
            dangerouslySetInnerHTML={{ __html: mdToHtml(post.content_md) }}
          />
        ) : (
          <div className="border-2 border-dashed border-black p-8 text-center text-sm">
            全文載入失敗,請重新整理。
          </div>
        )}
      </div>
    );
  }

  // 未登入：模糊遮罩 + 註冊/登入
  return (
    <div className="relative">
      {/* 模糊預覽（純裝飾,真正的鎖在後端:全文不在 HTML 裡）*/}
      <div
        aria-hidden="true"
        className="select-none pointer-events-none mb-[-180px] opacity-40"
        style={{
          filter: 'blur(6px)',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
      >
        <p className="leading-relaxed">
          後面還有完整的架構拆解、實作細節、踩坑紀錄……登入後解鎖全文。後面還有完整的架構拆解、實作細節、踩坑紀錄。後面還有完整的內容。
        </p>
      </div>

      <div
        className="relative border-2 border-black bg-white p-6 md:p-8"
        style={{ boxShadow: '6px 6px 0 #0a0a0a' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl" aria-hidden="true">
            🔒
          </span>
          <span className="text-xs uppercase tracking-widest font-black font-mono">
            members only
          </span>
        </div>
        <h3 className="text-lg md:text-xl font-black mb-1">登入看《{title}》全文</h3>
        <p className="text-sm opacity-70 mb-5">免費註冊,一個 email 就好。</p>

        {/* 模式切換 */}
        <div className="flex gap-0 mb-5 border-2 border-black w-fit font-mono text-xs">
          {(['register', 'login'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError('');
              }}
              className="px-4 py-2 uppercase tracking-widest font-black transition-colors"
              style={
                mode === m
                  ? { background: 'var(--color-neub-yellow)', color: '#0a0a0a' }
                  : { background: 'white', color: '#0a0a0a' }
              }
            >
              {m === 'register' ? '註冊' : '登入'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          {mode === 'register' && (
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wider mb-1.5 font-bold font-mono">
                暱稱（選填）
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                className="w-full px-3 py-2.5 text-sm border-2 border-black focus:outline-none"
                style={{ background: '#fafaf7' }}
              />
            </label>
          )}
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wider mb-1.5 font-bold font-mono">
              email *
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 text-sm border-2 border-black focus:outline-none"
              style={{ background: '#fafaf7' }}
            />
          </label>
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wider mb-1.5 font-bold font-mono">
              密碼 *（至少 6 碼）
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              className="w-full px-3 py-2.5 text-sm border-2 border-black focus:outline-none"
              style={{ background: '#fafaf7' }}
            />
          </label>

          {error && (
            <div
              className="px-2 py-1 inline-block text-xs font-bold border-2 border-black"
              style={{ background: '#fecaca' }}
              role="alert"
            >
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 text-sm uppercase tracking-widest font-black border-2 border-black transition-transform active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 font-mono"
            style={{
              background: 'var(--color-neub-yellow)',
              color: '#0a0a0a',
              boxShadow: '4px 4px 0 #0a0a0a',
            }}
          >
            {submitting ? '...' : mode === 'register' ? '→ 註冊並解鎖' : '→ 登入'}
          </button>
        </form>
      </div>
    </div>
  );
}

function errorText(code?: string): string {
  switch (code) {
    case 'email_taken':
      return '這個 email 已經註冊過了,改用登入吧。';
    case 'invalid_email':
      return 'email 格式不對。';
    case 'password_too_short':
      return '密碼至少 6 碼。';
    case 'invalid_credentials':
      return 'email 或密碼錯誤。';
    default:
      return '出了點問題,請再試一次。';
  }
}

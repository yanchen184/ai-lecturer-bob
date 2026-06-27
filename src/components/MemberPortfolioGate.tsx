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
 * 會員專區的單一大型解鎖閘門（整個專區共用一個，不分每篇文章）。
 * - 未登入：一張大大的 members-only 卡（模糊遮罩 + 註冊/登入表單）
 * - 已登入：把所有作品全文逐篇拉下來渲染（後端逐篇記 read_log）
 *
 * 全文「不在」靜態 HTML，真正的鎖在後端：登入帶 JWT 才拿得到 content_md。
 */

interface PostStub {
  slug: string;
  title: string;
}

interface MemberPortfolioGateProps {
  posts: PostStub[];
}

type Mode = 'login' | 'register';

export default function MemberPortfolioGate({ posts }: MemberPortfolioGateProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [checking, setChecking] = useState(true);
  const [fullPosts, setFullPosts] = useState<FullPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [mode, setMode] = useState<Mode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      if (me) void loadAllPosts();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAllPosts() {
    setLoadingPosts(true);
    const results = await Promise.all(posts.map((p) => getContent(p.slug)));
    setFullPosts(results.filter((p): p is FullPost => p !== null));
    setLoadingPosts(false);
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
      await loadAllPosts();
    } catch {
      setError('連線失敗,請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    setMember(null);
    setFullPosts([]);
  }

  if (checking) {
    return (
      <div className="border-2 border-dashed border-black p-8 text-center text-sm opacity-60 font-mono">
        checking...
      </div>
    );
  }

  // 已登入：展開所有作品全文
  if (member) {
    return (
      <div>
        <div
          className="flex items-center justify-between gap-3 mb-8 px-4 py-3 border-2 border-black bg-white"
          style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
        >
          <span className="text-sm font-bold font-mono truncate">
            ✓ {member.displayName || member.email} · 已解鎖全部作品
          </span>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest font-black border-2 border-black px-2 py-1 font-mono hover:bg-black hover:text-white transition-colors shrink-0"
          >
            logout
          </button>
        </div>

        {loadingPosts ? (
          <div className="border-2 border-dashed border-black p-8 text-center text-sm opacity-60 font-mono">
            loading full content...
          </div>
        ) : fullPosts.length > 0 ? (
          <div className="space-y-16">
            {fullPosts.map((post) => (
              <article
                key={post.slug}
                className="border-2 border-black bg-white p-6 md:p-10"
                style={{ boxShadow: '8px 8px 0 #0a0a0a' }}
              >
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-6 pb-3 border-b-2 border-black">
                  {post.title}
                </h2>
                <div
                  className="member-content leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: mdToHtml(post.content_md) }}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-black p-8 text-center text-sm">
            全文載入失敗,請重新整理。
          </div>
        )}
      </div>
    );
  }

  // 未登入：一張大大的 members-only 解鎖卡
  return (
    <div
      className="relative border-2 border-black bg-white p-6 md:p-12"
      style={{ boxShadow: '8px 8px 0 #0a0a0a' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl" aria-hidden="true">
          🔒
        </span>
        <span className="text-xs uppercase tracking-widest font-black font-mono">members only</span>
      </div>
      <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-3">
        登入解鎖所有作品全文
      </h2>
      <p className="text-sm md:text-base opacity-70 mb-8 max-w-2xl leading-relaxed">
        上面每件作品你都看得到封面、定位和技術亮點。想看完整的架構拆解、實作細節、
        踩坑紀錄和 demo 截圖,免費註冊一個 email 就全部解鎖 —— 一次登入,看全部。
      </p>

      {/* 模式切換 */}
      <div className="flex gap-0 mb-6 border-2 border-black w-fit font-mono text-xs">
        {(['register', 'login'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError('');
            }}
            className="px-5 py-2.5 uppercase tracking-widest font-black transition-colors"
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
          className="w-full py-3.5 text-sm uppercase tracking-widest font-black border-2 border-black transition-transform active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 font-mono"
          style={{
            background: 'var(--color-neub-yellow)',
            color: '#0a0a0a',
            boxShadow: '4px 4px 0 #0a0a0a',
          }}
        >
          {submitting ? '...' : mode === 'register' ? '→ 註冊並解鎖全部' : '→ 登入'}
        </button>
      </form>
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

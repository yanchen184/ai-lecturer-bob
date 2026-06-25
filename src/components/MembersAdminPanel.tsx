import { useState } from 'react';
import {
  fetchAdminStats,
  fetchAdminMembers,
  type AdminStats,
  type AdminMember,
} from '../lib/members-api';

/**
 * /admin 的「會員」tab 內容。
 * 會員資料在 Cloudflare Worker(D1),非 Firestore。要帶 ADMIN_TOKEN(Bob 手動貼)才看得到。
 * token 只存 sessionStorage(關分頁就清),不進 localStorage、不寫死。
 */

const TOKEN_KEY = 'bob_admin_token';
const card = { boxShadow: '4px 4px 0 #0a0a0a' } as const;

function fmt(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MembersAdminPanel() {
  const [token, setToken] = useState(
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) || '' : '',
  );
  const [input, setInput] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(t: string) {
    setLoading(true);
    setError('');
    const [s, m] = await Promise.all([fetchAdminStats(t), fetchAdminMembers(t)]);
    if (!s) {
      setError('ADMIN_TOKEN 不對,或後端還沒上線。');
      setStats(null);
      setMembers([]);
    } else {
      setStats(s);
      setMembers(m);
      sessionStorage.setItem(TOKEN_KEY, t);
      setToken(t);
    }
    setLoading(false);
  }

  // 未輸入 token:顯示輸入框
  if (!token) {
    return (
      <div className="border-2 border-black bg-white p-6 max-w-md" style={card}>
        <div className="text-xs uppercase tracking-widest font-black font-mono mb-3">
          🔑 members backend (D1)
        </div>
        <p className="text-sm opacity-70 mb-4">
          會員資料在 Cloudflare Worker。貼上 ADMIN_TOKEN 解鎖統計。
        </p>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ADMIN_TOKEN"
          className="w-full px-3 py-2.5 text-sm border-2 border-black focus:outline-none mb-3 font-mono"
          style={{ background: '#fafaf7' }}
        />
        {error && (
          <div className="px-2 py-1 inline-block text-xs font-bold border-2 border-black mb-3" style={{ background: '#fecaca' }}>
            ✕ {error}
          </div>
        )}
        <button
          onClick={() => input.trim() && load(input.trim())}
          disabled={loading || !input.trim()}
          className="w-full py-2.5 text-sm uppercase tracking-widest font-black border-2 border-black disabled:opacity-50 font-mono"
          style={{ background: 'var(--color-neub-yellow)', boxShadow: '3px 3px 0 #0a0a0a' }}
        >
          {loading ? '...' : '→ unlock'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Stat label="會員數" value={stats?.stats.members ?? 0} />
          <Stat label="成功登入" value={stats?.stats.successfulLogins ?? 0} />
          <Stat label="閱讀次數" value={stats?.stats.totalReads ?? 0} />
        </div>
        <button
          onClick={() => load(token)}
          className="text-xs uppercase tracking-widest font-black border-2 border-black px-3 py-1.5 font-mono hover:bg-black hover:text-white transition-colors"
        >
          {loading ? '...' : '↻ refresh'}
        </button>
      </div>

      {/* 會員明細 */}
      <div className="border-2 border-black bg-white" style={card}>
        <div className="p-4 border-b-2 border-black font-black">會員明細（{members.length}）</div>
        <div className="max-h-[360px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b-2 border-black sticky top-0">
              <tr>
                <Th>Email</Th>
                <Th>暱稱</Th>
                <Th>註冊</Th>
                <Th>最後登入</Th>
                <Th>登入次數</Th>
                <Th>閱讀</Th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 font-mono text-xs">{m.email}</td>
                  <td className="px-4 py-2 text-xs">{m.display_name || '—'}</td>
                  <td className="px-4 py-2 font-mono text-xs opacity-70 whitespace-nowrap">{fmt(m.created_at)}</td>
                  <td className="px-4 py-2 font-mono text-xs opacity-70 whitespace-nowrap">{fmt(m.last_login_at)}</td>
                  <td className="px-4 py-2 text-xs font-bold">{m.login_count}</td>
                  <td className="px-4 py-2 text-xs font-bold">{m.read_count}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm opacity-50 font-mono">
                    還沒有會員
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 各篇閱讀 + 最近閱讀 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border-2 border-black bg-white" style={card}>
          <div className="p-4 border-b-2 border-black font-black">各篇被讀次數</div>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-black sticky top-0">
                <tr><Th>作品</Th><Th>次數</Th><Th>不重複讀者</Th></tr>
              </thead>
              <tbody>
                {(stats?.readsByPost ?? []).map((r) => (
                  <tr key={r.slug} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-mono text-xs">{r.slug}</td>
                    <td className="px-4 py-2 text-xs font-bold">{r.reads}</td>
                    <td className="px-4 py-2 text-xs">{r.readers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-2 border-black bg-white" style={card}>
          <div className="p-4 border-b-2 border-black font-black">最近登入</div>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-black sticky top-0">
                <tr><Th>時間</Th><Th>Email</Th><Th>結果</Th></tr>
              </thead>
              <tbody>
                {(stats?.recentLogins ?? []).map((l, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-mono text-xs opacity-70 whitespace-nowrap">{fmt(l.logged_at)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{l.email}</td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className="inline-block px-2 py-0.5 border border-black text-[11px] font-mono"
                        style={{ background: l.outcome === 'success' ? '#bbf7d0' : '#fecaca' }}
                      >
                        {l.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-black bg-white px-4 py-3" style={card}>
      <div className="text-2xl font-black tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wider font-mono opacity-60">{label}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-2 font-mono text-xs uppercase">{children}</th>;
}

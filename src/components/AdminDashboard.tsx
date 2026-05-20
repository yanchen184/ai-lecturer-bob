import { useEffect, useMemo, useState } from 'react';
import type { Timestamp } from 'firebase/firestore';
import {
  subscribeToVisitorStats,
  subscribeToRecentVisitors,
  subscribeToPostStats,
  subscribeToPostViews,
  subscribeToOutboundStats,
  subscribeToOutboundClicks,
  subscribeToMessages,
  type VisitorRecord,
  type PostStat,
  type PostView,
  type OutboundStat,
  type OutboundClick,
  type GuestMessage,
  type VisitorStatsDoc,
} from '../lib/firebase-client';

type TimeRange = 'today' | '7d' | '30d' | 'all';

const RANGE_LABEL: Record<TimeRange, string> = {
  today: '今日',
  '7d': '7 天',
  '30d': '30 天',
  all: '全部',
};

const rangeCutoff = (range: TimeRange): number => {
  const now = Date.now();
  switch (range) {
    case 'today': {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    case '7d':
      return now - 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return now - 30 * 24 * 60 * 60 * 1000;
    case 'all':
      return 0;
  }
};

const tsMs = (t: Timestamp | null): number => (t ? t.toMillis() : 0);

const fmtDateTime = (t: Timestamp | null): string => {
  if (!t) return '—';
  const d = t.toDate();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
};

const detectBrowser = (ua: string): string => {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return 'Other';
};

const isMobile = (ua: string): boolean => /Mobi|Android|iPhone|iPad/.test(ua);

const shortenReferrer = (ref: string): string => {
  if (!ref || ref === 'direct') return 'direct';
  try {
    const u = new URL(ref);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return ref.slice(0, 30);
  }
};

const TARGET_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  youtube: '#FF0000',
  github: '#24292E',
  email: '#0EA5E9',
  linkedin: '#0A66C2',
  threads: '#000000',
  twitter: '#1DA1F2',
  facebook: '#1877F2',
  telegram: '#26A5E4',
  other: '#6B7280',
};

const TargetPill = ({ target }: { target: string }) => {
  const color = TARGET_COLORS[target] ?? TARGET_COLORS.other;
  return (
    <span
      style={{ background: color }}
      className="inline-block px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white rounded"
    >
      {target}
    </span>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
}
const StatCard = ({ label, value, hint }: StatCardProps) => (
  <div
    className="border-2 border-black bg-white p-4"
    style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
  >
    <div className="text-xs uppercase tracking-widest opacity-60 mb-1 font-mono">
      {label}
    </div>
    <div className="text-3xl font-black tracking-tight">{value}</div>
    {hint && <div className="text-xs opacity-60 mt-1">{hint}</div>}
  </div>
);

interface BarCardProps {
  title: string;
  rows: Array<{ label: string; value: number }>;
  emptyText?: string;
}
const BarCard = ({ title, rows, emptyText = '暫無資料' }: BarCardProps) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div
      className="border-2 border-black bg-white p-4"
      style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
    >
      <div className="font-black mb-3">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm opacity-60">{emptyText}</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="truncate mr-2">{r.label}</span>
                <span className="font-mono">{r.value}</span>
              </div>
              <div className="h-2 bg-gray-200">
                <div
                  className="h-2 bg-black"
                  style={{ width: `${(r.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<VisitorStatsDoc>({ totalVisits: 0, lastVisit: null });
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [postStats, setPostStats] = useState<PostStat[]>([]);
  const [postViews, setPostViews] = useState<PostView[]>([]);
  const [outboundStats, setOutboundStats] = useState<OutboundStat[]>([]);
  const [outboundClicks, setOutboundClicks] = useState<OutboundClick[]>([]);
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [range, setRange] = useState<TimeRange>('7d');
  const [tab, setTab] = useState<'overview' | 'posts' | 'outbound' | 'visitors'>(
    'overview'
  );

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    unsubs.push(subscribeToVisitorStats(setStats));
    unsubs.push(subscribeToRecentVisitors(500, setVisitors));
    unsubs.push(subscribeToPostStats(setPostStats));
    unsubs.push(subscribeToPostViews(500, setPostViews));
    unsubs.push(subscribeToOutboundStats(setOutboundStats));
    unsubs.push(subscribeToOutboundClicks(200, setOutboundClicks));
    unsubs.push(subscribeToMessages(setMessages));
    return () => unsubs.forEach((u) => u());
  }, []);

  const cutoff = rangeCutoff(range);

  const rangedVisitors = useMemo(
    () => visitors.filter((v) => tsMs(v.timestamp) >= cutoff),
    [visitors, cutoff]
  );
  const rangedPostViews = useMemo(
    () => postViews.filter((v) => tsMs(v.timestamp) >= cutoff),
    [postViews, cutoff]
  );
  const rangedOutbound = useMemo(
    () => outboundClicks.filter((c) => tsMs(c.timestamp) >= cutoff),
    [outboundClicks, cutoff]
  );

  // Posts ranking (merge stats + ranged views)
  const postViewsByRange = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of rangedPostViews) {
      m.set(v.slug, (m.get(v.slug) ?? 0) + 1);
    }
    return m;
  }, [rangedPostViews]);

  const postRanking = useMemo(() => {
    const known = new Map<string, PostStat>();
    for (const s of postStats) known.set(s.slug, s);
    for (const slug of postViewsByRange.keys()) {
      if (!known.has(slug)) {
        const view = rangedPostViews.find((v) => v.slug === slug);
        known.set(slug, {
          slug,
          title: view?.title || slug,
          totalViews: 0,
          lastViewAt: view?.timestamp ?? null,
          firstViewAt: view?.timestamp ?? null,
        });
      }
    }
    return Array.from(known.values())
      .map((s) => ({ ...s, rangeViews: postViewsByRange.get(s.slug) ?? 0 }))
      .sort((a, b) => b.rangeViews - a.rangeViews || b.totalViews - a.totalViews);
  }, [postStats, postViewsByRange, rangedPostViews]);

  // Outbound ranking
  const outboundByRange = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of rangedOutbound) m.set(c.target, (m.get(c.target) ?? 0) + 1);
    return m;
  }, [rangedOutbound]);

  const outboundRanking = useMemo(() => {
    const known = new Map<string, OutboundStat>();
    for (const s of outboundStats) known.set(s.target, s);
    for (const t of outboundByRange.keys()) {
      if (!known.has(t)) {
        known.set(t, { target: t, totalClicks: 0, lastClickAt: null, firstClickAt: null });
      }
    }
    return Array.from(known.values())
      .map((s) => ({ ...s, rangeClicks: outboundByRange.get(s.target) ?? 0 }))
      .sort((a, b) => b.rangeClicks - a.rangeClicks || b.totalClicks - a.totalClicks);
  }, [outboundStats, outboundByRange]);

  // Aggregates for overview
  const browserDist = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of rangedVisitors) {
      const b = detectBrowser(v.userAgent);
      m.set(b, (m.get(b) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [rangedVisitors]);

  const referrerDist = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of rangedVisitors) {
      const r = shortenReferrer(v.referrer);
      m.set(r, (m.get(r) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [rangedVisitors]);

  const mobileCount = useMemo(
    () => rangedVisitors.filter((v) => isMobile(v.userAgent)).length,
    [rangedVisitors]
  );
  const searchCount = useMemo(
    () => rangedVisitors.filter((v) => v.isFromSearch).length,
    [rangedVisitors]
  );

  const BUTTON_BASE =
    'px-3 py-1.5 text-sm font-mono uppercase tracking-widest border-2 border-black transition-colors';
  const BUTTON_ACTIVE =
    'bg-[var(--color-neub-yellow)]';
  const BUTTON_IDLE = 'bg-white hover:bg-gray-100';

  return (
    <div className="space-y-6">
      {/* Time range bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs uppercase tracking-widest opacity-60 font-mono mr-1">
          範圍：
        </span>
        {(['today', '7d', '30d', 'all'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`${BUTTON_BASE} ${range === r ? BUTTON_ACTIVE : BUTTON_IDLE}`}
            style={range === r ? { boxShadow: '3px 3px 0 #0a0a0a' } : undefined}
          >
            {RANGE_LABEL[r]}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black pb-3">
        {(['overview', 'posts', 'outbound', 'visitors'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`${BUTTON_BASE} ${tab === t ? BUTTON_ACTIVE : BUTTON_IDLE}`}
            style={tab === t ? { boxShadow: '3px 3px 0 #0a0a0a' } : undefined}
          >
            {t === 'overview'
              ? '總覽'
              : t === 'posts'
              ? `文章 (${postRanking.length})`
              : t === 'outbound'
              ? `外連 (${outboundRanking.length})`
              : `訪客 (${rangedVisitors.length})`}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <StatCard
              label="總訪客數"
              value={stats.totalVisits}
              hint={stats.lastVisit ? `最後 ${fmtDateTime(stats.lastVisit)}` : '—'}
            />
            <StatCard
              label={`${RANGE_LABEL[range]} 訪客`}
              value={rangedVisitors.length}
              hint={`${searchCount} 來自搜尋`}
            />
            <StatCard
              label={`${RANGE_LABEL[range]} 文章瀏覽`}
              value={rangedPostViews.length}
              hint={`${postRanking.filter((p) => p.rangeViews > 0).length} 篇被讀`}
            />
            <StatCard
              label={`${RANGE_LABEL[range]} 外連點擊`}
              value={rangedOutbound.length}
              hint={`${outboundRanking.filter((o) => o.rangeClicks > 0).length} 個目標`}
            />
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <StatCard
              label="行動裝置比例"
              value={
                rangedVisitors.length
                  ? `${Math.round((mobileCount / rangedVisitors.length) * 100)}%`
                  : '—'
              }
              hint={`${mobileCount} / ${rangedVisitors.length}`}
            />
            <StatCard label="留言板訊息" value={messages.length} />
            <StatCard
              label="總外連點擊"
              value={outboundStats.reduce((s, o) => s + o.totalClicks, 0)}
            />
            <StatCard
              label="總文章瀏覽"
              value={postStats.reduce((s, p) => s + p.totalViews, 0)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <BarCard title="瀏覽器分佈" rows={browserDist} />
            <BarCard title="Top 8 流量來源" rows={referrerDist} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div
              className="border-2 border-black bg-white p-4"
              style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
            >
              <div className="font-black mb-3">Top 5 文章（{RANGE_LABEL[range]}）</div>
              {postRanking.slice(0, 5).length === 0 ? (
                <div className="text-sm opacity-60">暫無資料</div>
              ) : (
                <ol className="space-y-2">
                  {postRanking.slice(0, 5).map((p, i) => (
                    <li key={p.slug} className="flex justify-between text-sm">
                      <span className="truncate mr-2">
                        {i + 1}. {p.title}
                      </span>
                      <span className="font-mono">{p.rangeViews}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div
              className="border-2 border-black bg-white p-4"
              style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
            >
              <div className="font-black mb-3">Top 5 外連（{RANGE_LABEL[range]}）</div>
              {outboundRanking.slice(0, 5).length === 0 ? (
                <div className="text-sm opacity-60">暫無資料</div>
              ) : (
                <ol className="space-y-2">
                  {outboundRanking.slice(0, 5).map((o, i) => (
                    <li key={o.target} className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{i + 1}.</span>
                        <TargetPill target={o.target} />
                      </span>
                      <span className="font-mono">{o.rangeClicks}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      {tab === 'posts' && (
        <div className="space-y-4">
          <div
            className="border-2 border-black bg-white"
            style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
          >
            <div className="p-4 border-b-2 border-black font-black">
              文章排行榜（{RANGE_LABEL[range]}）
            </div>
            {postRanking.length === 0 ? (
              <div className="p-4 text-sm opacity-60">暫無資料</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-black">
                    <tr>
                      <th className="text-left px-4 py-2 font-mono text-xs uppercase">#</th>
                      <th className="text-left px-4 py-2 font-mono text-xs uppercase">
                        文章
                      </th>
                      <th className="text-right px-4 py-2 font-mono text-xs uppercase">
                        {RANGE_LABEL[range]}
                      </th>
                      <th className="text-right px-4 py-2 font-mono text-xs uppercase">
                        累計
                      </th>
                      <th className="text-left px-4 py-2 font-mono text-xs uppercase">
                        最近瀏覽
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {postRanking.map((p, i) => (
                      <tr key={p.slug} className="border-b border-gray-200">
                        <td className="px-4 py-2 font-mono">{i + 1}</td>
                        <td className="px-4 py-2">
                          <a
                            href={`/blog/${p.slug}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {p.title}
                          </a>
                          <div className="text-xs opacity-50 font-mono">{p.slug}</div>
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-black">
                          {p.rangeViews}
                        </td>
                        <td className="px-4 py-2 text-right font-mono opacity-70">
                          {p.totalViews}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs opacity-70">
                          {fmtDateTime(p.lastViewAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div
            className="border-2 border-black bg-white"
            style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
          >
            <div className="p-4 border-b-2 border-black font-black">
              最新文章瀏覽（{rangedPostViews.length}）
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {rangedPostViews.slice(0, 50).map((v) => (
                    <tr key={v.id} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs opacity-70 whitespace-nowrap">
                        {fmtDateTime(v.timestamp)}
                      </td>
                      <td className="px-4 py-2 truncate max-w-[240px]">{v.title}</td>
                      <td className="px-4 py-2 text-xs opacity-60">
                        {shortenReferrer(v.referrer)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Outbound */}
      {tab === 'outbound' && (
        <div className="space-y-4">
          <div
            className="border-2 border-black bg-white"
            style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
          >
            <div className="p-4 border-b-2 border-black font-black">
              外連點擊排行（{RANGE_LABEL[range]}）
            </div>
            {outboundRanking.length === 0 ? (
              <div className="p-4 text-sm opacity-60">暫無資料</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-black">
                    <tr>
                      <th className="text-left px-4 py-2 font-mono text-xs uppercase">#</th>
                      <th className="text-left px-4 py-2 font-mono text-xs uppercase">
                        Target
                      </th>
                      <th className="text-right px-4 py-2 font-mono text-xs uppercase">
                        {RANGE_LABEL[range]}
                      </th>
                      <th className="text-right px-4 py-2 font-mono text-xs uppercase">
                        累計
                      </th>
                      <th className="text-left px-4 py-2 font-mono text-xs uppercase">
                        最近點擊
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {outboundRanking.map((o, i) => (
                      <tr key={o.target} className="border-b border-gray-200">
                        <td className="px-4 py-2 font-mono">{i + 1}</td>
                        <td className="px-4 py-2">
                          <TargetPill target={o.target} />
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-black">
                          {o.rangeClicks}
                        </td>
                        <td className="px-4 py-2 text-right font-mono opacity-70">
                          {o.totalClicks}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs opacity-70">
                          {fmtDateTime(o.lastClickAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div
            className="border-2 border-black bg-white"
            style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
          >
            <div className="p-4 border-b-2 border-black font-black">
              最新外連點擊（{rangedOutbound.length}）
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {rangedOutbound.slice(0, 80).map((c) => (
                    <tr key={c.id} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs opacity-70 whitespace-nowrap">
                        {fmtDateTime(c.timestamp)}
                      </td>
                      <td className="px-4 py-2">
                        <TargetPill target={c.target} />
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline break-all"
                        >
                          {c.label || c.url}
                        </a>
                        <div className="opacity-50 font-mono text-[11px]">
                          from {c.fromPath}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Visitors */}
      {tab === 'visitors' && (
        <div
          className="border-2 border-black bg-white"
          style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
        >
          <div className="p-4 border-b-2 border-black font-black">
            訪客記錄（{rangedVisitors.length}）
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-black sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-mono text-xs uppercase">時間</th>
                  <th className="text-left px-4 py-2 font-mono text-xs uppercase">頁面</th>
                  <th className="text-left px-4 py-2 font-mono text-xs uppercase">來源</th>
                  <th className="text-left px-4 py-2 font-mono text-xs uppercase">瀏覽器</th>
                </tr>
              </thead>
              <tbody>
                {rangedVisitors.slice(0, 200).map((v) => (
                  <tr key={v.id} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-mono text-xs opacity-70 whitespace-nowrap">
                      {fmtDateTime(v.timestamp)}
                    </td>
                    <td className="px-4 py-2 truncate max-w-[240px] font-mono text-xs">
                      {v.path}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {v.isFromSearch ? (
                        <span className="inline-block px-2 py-0.5 bg-yellow-200 border border-black text-[11px] font-mono mr-1">
                          {v.searchEngine}
                        </span>
                      ) : null}
                      {shortenReferrer(v.referrer)}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {detectBrowser(v.userAgent)}
                      {isMobile(v.userAgent) ? ' · mobile' : ' · desktop'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

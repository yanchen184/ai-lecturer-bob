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
  fetchGscDaily,
  fetchContentScores,
  type VisitorRecord,
  type PostStat,
  type PostView,
  type OutboundStat,
  type OutboundClick,
  type GuestMessage,
  type VisitorStatsDoc,
  type GscDailyRecord,
  type ContentScoresFile,
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

/**
 * 從 GSC page URL 抽出 blog slug，對齊 content-scores.json 的 key。
 * 例：https://yanchen.app/blog/langgraph-state-node-edge/ → langgraph-state-node-edge
 * 非 /blog/ 頁面（首頁、tag 頁等）回 null。
 */
function slugFromUrl(url: string): string | null {
  const m = url.match(/\/blog\/([^/?#]+)\/?/);
  return m ? m[1] : null;
}

// ============ GSC / SEO 視覺元件（純 SVG，無圖表庫） ============

/** 迷你折線 sparkline，畫在 trend card 裡 */
const Sparkline = ({
  values,
  color = '#0a0a0a',
  width = 120,
  height = 32,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) => {
  if (values.length < 2) {
    return <div style={{ width, height }} className="opacity-30 text-[10px] flex items-end">—</div>;
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pad = 2;
  const stepX = (width - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / span);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={pad + (values.length - 1) * stepX}
        cy={
          pad +
          (height - pad * 2) *
            (1 - (values[values.length - 1] - min) / span)
        }
        r={2.5}
        fill={color}
      />
    </svg>
  );
};

/**
 * 結構分 × 流量散點圖（手刻 SVG）。x = 結構分(0-100)，y = 曝光(log scale，因量級差很大)。
 * 點顏色依分數高低，hover 顯示 slug。沒曝光的文章(y=0)壓在底軸上，仍畫出來方便看「高分但沒流量」。
 */
const ScoreTrafficScatter = ({
  points,
}: {
  points: Array<{ slug: string; score: number; impressions: number; clicks: number }>;
}) => {
  const W = 560;
  const H = 320;
  const padL = 48;
  const padB = 40;
  const padT = 16;
  const padR = 16;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  if (points.length === 0) {
    return <div className="p-4 text-sm opacity-60">暫無可對照的資料</div>;
  }

  const maxImp = Math.max(1, ...points.map((p) => p.impressions));
  // log scale：y = log10(imp+1) / log10(maxImp+1)
  const logMax = Math.log10(maxImp + 1) || 1;
  const xOf = (score: number) => padL + (Math.min(100, Math.max(0, score)) / 100) * plotW;
  const yOf = (imp: number) =>
    padT + plotH * (1 - Math.log10(imp + 1) / logMax);

  const colorOf = (s: number) => (s >= 85 ? '#16a34a' : s >= 70 ? '#ca8a04' : '#dc2626');

  // x 軸刻度：0/25/50/75/100
  const xTicks = [0, 25, 50, 75, 100];
  // y 軸刻度：0, 10, 100, 1000…（log）
  const yTicks: number[] = [0];
  for (let v = 1; v <= maxImp; v *= 10) yTicks.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: W }}>
      {/* 軸線 */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#0a0a0a" strokeWidth={2} />
      <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#0a0a0a" strokeWidth={2} />
      {/* x 刻度 */}
      {xTicks.map((t) => (
        <g key={`x${t}`}>
          <line x1={xOf(t)} y1={padT + plotH} x2={xOf(t)} y2={padT + plotH + 4} stroke="#0a0a0a" strokeWidth={1} />
          <text x={xOf(t)} y={padT + plotH + 18} textAnchor="middle" fontSize={11} fontFamily="monospace" fill="#0a0a0a">
            {t}
          </text>
        </g>
      ))}
      <text x={padL + plotW / 2} y={H - 4} textAnchor="middle" fontSize={11} fontFamily="monospace" fill="#0a0a0a" fontWeight="bold">
        結構分 →
      </text>
      {/* y 刻度 */}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={padL - 4} y1={yOf(t)} x2={padL} y2={yOf(t)} stroke="#0a0a0a" strokeWidth={1} />
          <text x={padL - 6} y={yOf(t) + 3} textAnchor="end" fontSize={10} fontFamily="monospace" fill="#0a0a0a">
            {t >= 1000 ? `${t / 1000}k` : t}
          </text>
        </g>
      ))}
      <text x={12} y={padT + plotH / 2} textAnchor="middle" fontSize={11} fontFamily="monospace" fill="#0a0a0a" fontWeight="bold" transform={`rotate(-90 12 ${padT + plotH / 2})`}>
        曝光（log）↑
      </text>
      {/* 資料點 */}
      {points.map((p) => (
        <circle
          key={p.slug}
          cx={xOf(p.score)}
          cy={yOf(p.impressions)}
          r={5}
          fill={colorOf(p.score)}
          fillOpacity={0.7}
          stroke="#0a0a0a"
          strokeWidth={1.5}
        >
          <title>{`${p.slug}\n結構分 ${p.score} · 曝光 ${p.impressions} · 點擊 ${p.clicks}`}</title>
        </circle>
      ))}
    </svg>
  );
};

interface TrendCardProps {
  label: string;
  value: number | string;
  /** 與前一段相比的變化量（正/負/0）；undefined 表示無前期可比 */
  delta?: number;
  /** delta 單位後綴，例如 '' / '%' */
  deltaSuffix?: string;
  /** true 表示「值越低越好」（排名用），會反轉漲跌顏色 */
  lowerIsBetter?: boolean;
  spark: number[];
  sparkColor?: string;
}
const TrendCard = ({
  label,
  value,
  delta,
  deltaSuffix = '',
  lowerIsBetter = false,
  spark,
  sparkColor,
}: TrendCardProps) => {
  const hasDelta = delta !== undefined && Number.isFinite(delta) && delta !== 0;
  const good = delta === undefined ? false : lowerIsBetter ? delta < 0 : delta > 0;
  const deltaColor = !hasDelta ? '#6B7280' : good ? '#16A34A' : '#DC2626';
  const arrow = !hasDelta ? '' : delta! > 0 ? '▲' : '▼';
  return (
    <div
      className="border-2 border-black bg-white p-4"
      style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
    >
      <div className="text-xs uppercase tracking-widest opacity-60 mb-1 font-mono">
        {label}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <Sparkline values={spark} color={sparkColor} />
      </div>
      <div className="text-xs mt-1 font-mono" style={{ color: deltaColor }}>
        {hasDelta
          ? `${arrow} ${Math.abs(delta!).toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}${deltaSuffix} vs 前期`
          : '— 無前期可比'}
      </div>
    </div>
  );
};

/** 曝光 vs 點擊雙軸折線圖（純 SVG）。曝光值通常遠大於點擊，各自正規化到自己的最大值。 */
const ImpClickChart = ({
  data,
}: {
  data: Array<{ date: string; impressions: number; clicks: number }>;
}) => {
  const W = 720;
  const H = 240;
  const padL = 8;
  const padR = 8;
  const padT = 16;
  const padB = 28;
  if (data.length < 2) {
    return <div className="text-sm opacity-60 p-4">資料天數不足，至少需要 2 天才能畫趨勢圖。</div>;
  }
  const maxImp = Math.max(1, ...data.map((d) => d.impressions));
  const maxClk = Math.max(1, ...data.map((d) => d.clicks));
  const stepX = (W - padL - padR) / (data.length - 1);
  const yImp = (v: number) => padT + (H - padT - padB) * (1 - v / maxImp);
  const yClk = (v: number) => padT + (H - padT - padB) * (1 - v / maxClk);
  const impPts = data.map((d, i) => `${padL + i * stepX},${yImp(d.impressions)}`).join(' ');
  const clkPts = data.map((d, i) => `${padL + i * stepX},${yClk(d.clicks)}`).join(' ');
  // x 軸只標頭、中、尾，避免擠
  const tickIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1];
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 480 }}>
        {/* baseline */}
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#e5e7eb" strokeWidth={1} />
        {/* impressions area-ish line */}
        <polyline points={impPts} fill="none" stroke="#2563EB" strokeWidth={2.5} strokeLinejoin="round" />
        {/* clicks line */}
        <polyline points={clkPts} fill="none" stroke="#DC2626" strokeWidth={2.5} strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={d.date}>
            <circle cx={padL + i * stepX} cy={yImp(d.impressions)} r={2} fill="#2563EB" />
            <circle cx={padL + i * stepX} cy={yClk(d.clicks)} r={2} fill="#DC2626" />
          </g>
        ))}
        {tickIdx.map((i) => (
          <text
            key={i}
            x={padL + i * stepX}
            y={H - 8}
            fontSize={11}
            fontFamily="monospace"
            fill="#6B7280"
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          >
            {data[i].date.slice(5)}
          </text>
        ))}
      </svg>
      <div className="flex gap-4 text-xs font-mono mt-1 px-2">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5" style={{ background: '#2563EB' }} />曝光（左尺度，max {maxImp}）
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5" style={{ background: '#DC2626' }} />點擊（右尺度，max {maxClk}）
        </span>
      </div>
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
  const [gscDaily, setGscDaily] = useState<GscDailyRecord[]>([]);
  const [contentScores, setContentScores] = useState<ContentScoresFile>({
    generatedAt: '',
    scores: {},
  });
  const [range, setRange] = useState<TimeRange>('7d');
  const [gscDays, setGscDays] = useState<7 | 28 | 90>(28);
  const [tab, setTab] = useState<
    'overview' | 'seo' | 'posts' | 'outbound' | 'visitors'
  >('overview');

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    unsubs.push(subscribeToVisitorStats(setStats));
    unsubs.push(subscribeToRecentVisitors(500, setVisitors));
    unsubs.push(subscribeToPostStats(setPostStats));
    unsubs.push(subscribeToPostViews(500, setPostViews));
    unsubs.push(subscribeToOutboundStats(setOutboundStats));
    unsubs.push(subscribeToOutboundClicks(200, setOutboundClicks));
    unsubs.push(subscribeToMessages(setMessages));
    // GSC 改讀靜態 JSON（非 Firestore）：一次抓取，非實時訂閱
    fetchGscDaily(90)
      .then(setGscDaily)
      .catch((e) => console.error('[admin] fetchGscDaily failed', e));
    fetchContentScores()
      .then(setContentScores)
      .catch((e) => console.error('[admin] fetchContentScores failed', e));
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

  // ============ GSC / SEO 聚合 ============
  // gscDaily 已是升冪（舊→新）。取最後 gscDays 天為「本期」。
  const gscWindow = useMemo(
    () => gscDaily.slice(-gscDays),
    [gscDaily, gscDays]
  );
  // 前一段同長度區間，用來算 period-over-period delta
  const gscPrevWindow = useMemo(
    () => gscDaily.slice(-gscDays * 2, -gscDays),
    [gscDaily, gscDays]
  );

  // 最新一天有 Claude 洞察的記錄（daily-seo-email.sh Step 4b 寫入 analysis 欄位）
  const latestAnalysis = useMemo(
    () => [...gscDaily].reverse().find((d) => d.analysis && d.analysis.trim()),
    [gscDaily]
  );

  const sumWindow = (rows: GscDailyRecord[]) => {
    const imp = rows.reduce((s, r) => s + r.impressions, 0);
    const clk = rows.reduce((s, r) => s + r.clicks, 0);
    const ctr = imp ? (clk / imp) * 100 : 0;
    // 曝光加權平均排名
    const pos = imp
      ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / imp
      : 0;
    return { imp, clk, ctr, pos };
  };

  const gscNow = useMemo(() => sumWindow(gscWindow), [gscWindow]);
  const gscPrev = useMemo(() => sumWindow(gscPrevWindow), [gscPrevWindow]);
  const hasPrev = gscPrevWindow.length > 0;

  // 關鍵字 → 文章 聚合（本期窗內所有天加總）。同一 query 可能落在多頁，取曝光最高那頁當代表。
  const keywordAgg = useMemo(() => {
    type Agg = {
      query: string;
      impressions: number;
      clicks: number;
      posSum: number; // 曝光加權排名分子
      pageImp: Map<string, number>; // page -> impressions（決定代表頁）
    };
    const m = new Map<string, Agg>();
    for (const day of gscWindow) {
      for (const q of day.queries) {
        let a = m.get(q.query);
        if (!a) {
          a = { query: q.query, impressions: 0, clicks: 0, posSum: 0, pageImp: new Map() };
          m.set(q.query, a);
        }
        a.impressions += q.impressions;
        a.clicks += q.clicks;
        a.posSum += q.position * q.impressions;
        if (q.page) a.pageImp.set(q.page, (a.pageImp.get(q.page) ?? 0) + q.impressions);
      }
    }
    return Array.from(m.values())
      .map((a) => {
        let topPage = '';
        let topImp = -1;
        for (const [p, imp] of a.pageImp) {
          if (imp > topImp) {
            topImp = imp;
            topPage = p;
          }
        }
        return {
          query: a.query,
          page: topPage,
          impressions: a.impressions,
          clicks: a.clicks,
          ctr: a.impressions ? (a.clicks / a.impressions) * 100 : 0,
          position: a.impressions ? a.posSum / a.impressions : 0,
        };
      })
      .sort((x, y) => y.impressions - x.impressions || y.clicks - x.clicks);
  }, [gscWindow]);

  // 🆕 新關鍵字：最新一天出現、但本期較早天數從未出現過的 query
  const newKeywords = useMemo(() => {
    if (gscWindow.length === 0) return [];
    const latest = gscWindow[gscWindow.length - 1];
    const earlier = new Set<string>();
    for (let i = 0; i < gscWindow.length - 1; i++) {
      for (const q of gscWindow[i].queries) earlier.add(q.query);
    }
    return latest.queries.filter((q) => !earlier.has(q.query));
  }, [gscWindow]);

  // 頁面聚合（本期窗內加總）
  const pageAgg = useMemo(() => {
    const m = new Map<string, { page: string; impressions: number; clicks: number; posSum: number }>();
    for (const day of gscWindow) {
      for (const p of day.pages) {
        let a = m.get(p.page);
        if (!a) {
          a = { page: p.page, impressions: 0, clicks: 0, posSum: 0 };
          m.set(p.page, a);
        }
        a.impressions += p.impressions;
        a.clicks += p.clicks;
        a.posSum += p.position * p.impressions;
      }
    }
    return Array.from(m.values())
      .map((a) => ({
        page: a.page,
        impressions: a.impressions,
        clicks: a.clicks,
        ctr: a.impressions ? (a.clicks / a.impressions) * 100 : 0,
        position: a.impressions ? a.posSum / a.impressions : 0,
      }))
      .sort((x, y) => y.impressions - x.impressions || y.clicks - x.clicks);
  }, [gscWindow]);

  // 結構分 × 流量 join：每點 = 一篇同時有「結構分」且「本期 GSC 有曝光」的文章。
  // 用來肉眼檢驗「高結構分是否真的換到更多曝光」。
  const scoreVsTraffic = useMemo(() => {
    const byPage = new Map(pageAgg.map((p) => [p.page, p]));
    const points: Array<{
      slug: string;
      score: number;
      impressions: number;
      clicks: number;
    }> = [];
    for (const [slug, sc] of Object.entries(contentScores.scores)) {
      // pageAgg 的 page 是完整 URL；用 slug 反查代表頁的流量。
      let agg: (typeof pageAgg)[number] | undefined;
      for (const [url, p] of byPage) {
        if (slugFromUrl(url) === slug) {
          agg = p;
          break;
        }
      }
      points.push({
        slug,
        score: sc.total,
        impressions: agg?.impressions ?? 0,
        clicks: agg?.clicks ?? 0,
      });
    }
    return points.sort((a, b) => b.impressions - a.impressions);
  }, [contentScores, pageAgg]);

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
        {(['overview', 'seo', 'posts', 'outbound', 'visitors'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`${BUTTON_BASE} ${tab === t ? BUTTON_ACTIVE : BUTTON_IDLE}`}
            style={tab === t ? { boxShadow: '3px 3px 0 #0a0a0a' } : undefined}
          >
            {t === 'overview'
              ? '總覽'
              : t === 'seo'
              ? `SEO (${gscDaily.length})`
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

      {/* SEO (GSC) */}
      {tab === 'seo' && (
        <div className="space-y-4">
          {/* GSC 天數選擇 + 資料說明 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest opacity-60 font-mono mr-1">
              GSC 區間：
            </span>
            {([7, 28, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setGscDays(d)}
                className={`${BUTTON_BASE} ${gscDays === d ? BUTTON_ACTIVE : BUTTON_IDLE}`}
                style={gscDays === d ? { boxShadow: '3px 3px 0 #0a0a0a' } : undefined}
              >
                {d} 天
              </button>
            ))}
            <span className="text-xs opacity-50 font-mono ml-auto">
              已收 {gscDaily.length} 天 · GSC 有 3-4 天延遲
            </span>
          </div>

          {gscDaily.length === 0 ? (
            <div
              className="border-2 border-black bg-white p-6 text-sm opacity-70"
              style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
            >
              還沒有 GSC 數據。每天早上 routine 會自動寫入；第一次需等明早跑完，或手動跑
              <code className="font-mono"> gsc-fetch-structured.py</code> 回補。
            </div>
          ) : (
            <>
              {/* 🤖 今日 Claude SEO 洞察（daily-seo-email.sh 每早寫入） */}
              {latestAnalysis?.analysis && (
                <div
                  className="border-2 border-black bg-[#FEF9C3] p-4"
                  style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <span className="text-xs uppercase tracking-widest font-mono font-bold">
                      🤖 今日洞察
                    </span>
                    <span className="text-xs opacity-50 font-mono">
                      GSC {latestAnalysis.date}
                      {latestAnalysis.analysisGeneratedAt
                        ? ` · 產生於 ${latestAnalysis.analysisGeneratedAt.slice(0, 10)}`
                        : ''}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {latestAnalysis.analysis}
                  </p>
                </div>
              )}

              {/* 4 張趨勢卡 */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <TrendCard
                  label={`曝光（${gscDays} 天）`}
                  value={gscNow.imp.toLocaleString()}
                  delta={hasPrev ? gscNow.imp - gscPrev.imp : undefined}
                  spark={gscWindow.map((d) => d.impressions)}
                  sparkColor="#2563EB"
                />
                <TrendCard
                  label={`點擊（${gscDays} 天）`}
                  value={gscNow.clk.toLocaleString()}
                  delta={hasPrev ? gscNow.clk - gscPrev.clk : undefined}
                  spark={gscWindow.map((d) => d.clicks)}
                  sparkColor="#DC2626"
                />
                <TrendCard
                  label="平均排名"
                  value={gscNow.pos ? gscNow.pos.toFixed(1) : '—'}
                  delta={hasPrev && gscPrev.pos ? gscNow.pos - gscPrev.pos : undefined}
                  lowerIsBetter
                  spark={gscWindow.map((d) => d.position)}
                  sparkColor="#7C3AED"
                />
                <TrendCard
                  label="CTR"
                  value={`${gscNow.ctr.toFixed(1)}%`}
                  delta={hasPrev ? gscNow.ctr - gscPrev.ctr : undefined}
                  deltaSuffix="%"
                  spark={gscWindow.map((d) => d.ctr)}
                  sparkColor="#16A34A"
                />
              </div>

              {/* 曝光 vs 點擊趨勢圖 */}
              <div
                className="border-2 border-black bg-white p-4"
                style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
              >
                <div className="font-black mb-2">曝光 vs 點擊趨勢</div>
                <ImpClickChart
                  data={gscWindow.map((d) => ({
                    date: d.date,
                    impressions: d.impressions,
                    clicks: d.clicks,
                  }))}
                />
              </div>

              {/* 🆕 新關鍵字 */}
              {newKeywords.length > 0 && (
                <div
                  className="border-2 border-black p-4"
                  style={{ boxShadow: '4px 4px 0 #0a0a0a', background: 'var(--color-neub-yellow)' }}
                >
                  <div className="font-black mb-2">
                    🆕 最新一天冒出的新關鍵字（{newKeywords.length}）
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newKeywords.map((q) => (
                      <span
                        key={q.query}
                        className="inline-block px-2 py-1 bg-white border-2 border-black text-xs font-mono"
                      >
                        {q.query}
                        <span className="opacity-50"> · {q.page || '?'} · 曝光 {q.impressions}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 關鍵字 → 文章 對應表（核心：別人搜什麼找到我的文章） */}
              <div
                className="border-2 border-black bg-white"
                style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
              >
                <div className="p-4 border-b-2 border-black font-black">
                  關鍵字 → 文章（{gscDays} 天，{keywordAgg.length} 個查詢）
                </div>
                {keywordAgg.length === 0 ? (
                  <div className="p-4 text-sm opacity-60">
                    此區間沒有查詢數據（GSC 對低流量查詢會匿名/門檻過濾，屬正常）。
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b-2 border-black">
                        <tr>
                          <th className="text-left px-4 py-2 font-mono text-xs uppercase">關鍵字</th>
                          <th className="text-left px-4 py-2 font-mono text-xs uppercase">落地文章</th>
                          <th className="text-right px-4 py-2 font-mono text-xs uppercase">曝光</th>
                          <th className="text-right px-4 py-2 font-mono text-xs uppercase">點擊</th>
                          <th className="text-right px-4 py-2 font-mono text-xs uppercase">CTR</th>
                          <th className="text-right px-4 py-2 font-mono text-xs uppercase">排名</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keywordAgg.slice(0, 100).map((k) => (
                          <tr key={k.query} className="border-b border-gray-200">
                            <td className="px-4 py-2 font-semibold">{k.query}</td>
                            <td className="px-4 py-2">
                              {k.page ? (
                                <a
                                  href={k.page}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline font-mono text-xs break-all"
                                >
                                  {k.page}
                                </a>
                              ) : (
                                <span className="opacity-40 font-mono text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-black">
                              {k.impressions}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">{k.clicks}</td>
                            <td className="px-4 py-2 text-right font-mono opacity-70">
                              {k.ctr.toFixed(1)}%
                            </td>
                            <td className="px-4 py-2 text-right font-mono opacity-70">
                              {k.position.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Top 頁面 */}
              <div
                className="border-2 border-black bg-white"
                style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
              >
                <div className="p-4 border-b-2 border-black font-black">
                  Top 頁面（{gscDays} 天曝光排序）
                </div>
                {pageAgg.length === 0 ? (
                  <div className="p-4 text-sm opacity-60">暫無資料</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b-2 border-black">
                        <tr>
                          <th className="text-left px-4 py-2 font-mono text-xs uppercase">#</th>
                          <th className="text-left px-4 py-2 font-mono text-xs uppercase">頁面</th>
                          <th className="text-right px-4 py-2 font-mono text-xs uppercase">曝光</th>
                          <th className="text-right px-4 py-2 font-mono text-xs uppercase">點擊</th>
                          <th className="text-right px-4 py-2 font-mono text-xs uppercase">CTR</th>
                          <th className="text-right px-4 py-2 font-mono text-xs uppercase">排名</th>
                          <th className="text-right px-4 py-2 font-mono text-xs uppercase" title="文章結構分（滿分 100，publish 時算）">結構分</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageAgg.slice(0, 50).map((p, i) => {
                          const slug = slugFromUrl(p.page);
                          const sc = slug ? contentScores.scores[slug] : undefined;
                          return (
                          <tr key={p.page} className="border-b border-gray-200">
                            <td className="px-4 py-2 font-mono">{i + 1}</td>
                            <td className="px-4 py-2">
                              <a
                                href={p.page}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-mono text-xs break-all"
                              >
                                {p.page}
                              </a>
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-black">
                              {p.impressions}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">{p.clicks}</td>
                            <td className="px-4 py-2 text-right font-mono opacity-70">
                              {p.ctr.toFixed(1)}%
                            </td>
                            <td className="px-4 py-2 text-right font-mono opacity-70">
                              {p.position.toFixed(1)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {sc ? (
                                <span
                                  className="font-black"
                                  style={{ color: sc.total >= 85 ? '#16a34a' : sc.total >= 70 ? '#ca8a04' : '#dc2626' }}
                                  title={Object.entries(sc.breakdown).map(([k, v]) => `${k}:${v}`).join(' / ')}
                                >
                                  {sc.total}
                                </span>
                              ) : (
                                <span className="opacity-30">—</span>
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 結構分 × 流量散點圖（分析：高分是否真的換到流量） */}
              <div
                className="border-2 border-black bg-white"
                style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
              >
                <div className="p-4 border-b-2 border-black font-black flex items-baseline justify-between flex-wrap gap-2">
                  <span>結構分 × 曝光（{gscDays} 天）</span>
                  <span className="text-xs font-mono font-normal opacity-60">
                    {contentScores.generatedAt
                      ? `分數算於 ${contentScores.generatedAt}`
                      : ''}{' '}
                    · {scoreVsTraffic.length} 篇
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <ScoreTrafficScatter points={scoreVsTraffic} />
                  <div className="flex gap-4 text-xs font-mono opacity-70 flex-wrap">
                    <span><span style={{ color: '#16a34a' }}>●</span> ≥85</span>
                    <span><span style={{ color: '#ca8a04' }}>●</span> 70-84</span>
                    <span><span style={{ color: '#dc2626' }}>●</span> &lt;70</span>
                    <span>結構分只含 14 項可程式量測項，不含查證／SoT 對照（需人工）</span>
                  </div>
                </div>
              </div>
            </>
          )}
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

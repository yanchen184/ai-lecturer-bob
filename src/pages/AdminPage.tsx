import { useEffect, useMemo, useState } from 'react'
import {
  subscribeToVisitorStats,
  subscribeToRecentVisitors,
  subscribeToMessages,
  subscribeToContacts,
  subscribeToPostStats,
  subscribeToPostViews,
  subscribeToOutboundStats,
  subscribeToOutboundClicks,
  markContactHandled,
} from '../firebase'
import type {
  VisitorStats,
  GuestMessage,
  ContactRecord,
  PostStat,
  PostView,
  OutboundStat,
  OutboundClick,
} from '../firebase'
import { Timestamp } from 'firebase/firestore'
import AdminBlogEditor from '../components/admin/AdminBlogEditor'

interface Visitor {
  id: string
  timestamp: Timestamp | null
  userAgent: string
  referrer: string
  screenWidth: number
  screenHeight: number
  language: string
  path: string
  isFromSearch?: boolean
  searchEngine?: string
}

type TimeRange = 'today' | '7d' | '30d' | 'all'

const RANGE_LABEL: Record<TimeRange, string> = {
  today: '今日',
  '7d': '7 天',
  '30d': '30 天',
  all: '全部',
}

const rangeCutoff = (range: TimeRange): number => {
  const now = Date.now()
  switch (range) {
    case 'today': {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    case '7d':
      return now - 7 * 24 * 60 * 60 * 1000
    case '30d':
      return now - 30 * 24 * 60 * 60 * 1000
    case 'all':
      return 0
  }
}

const AdminPage = () => {
  const [stats, setStats] = useState<VisitorStats>({ totalVisits: 0, lastVisit: null })
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [messages, setMessages] = useState<GuestMessage[]>([])
  const [contacts, setContacts] = useState<ContactRecord[]>([])
  const [postStats, setPostStats] = useState<PostStat[]>([])
  const [postViews, setPostViews] = useState<PostView[]>([])
  const [outboundStats, setOutboundStats] = useState<OutboundStat[]>([])
  const [outboundClicks, setOutboundClicks] = useState<OutboundClick[]>([])
  const [activeTab, setActiveTab] = useState<
    'overview' | 'posts-traffic' | 'outbound' | 'visitors' | 'messages' | 'contacts' | 'posts'
  >('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [contactFilter, setContactFilter] = useState<'all' | 'pending' | 'handled'>('pending')
  const [range, setRange] = useState<TimeRange>('7d')
  const [pathFilter, setPathFilter] = useState<string>('')

  useEffect(() => {
    const unsubs: (() => void)[] = []
    unsubs.push(
      subscribeToVisitorStats((s) => {
        setStats(s)
        setIsLoading(false)
      })
    )
    unsubs.push(subscribeToRecentVisitors((v) => setVisitors(v), 500))
    unsubs.push(subscribeToMessages((m) => setMessages(m)))
    unsubs.push(subscribeToContacts((c) => setContacts(c)))
    unsubs.push(subscribeToPostStats((p) => setPostStats(p)))
    unsubs.push(subscribeToPostViews((v) => setPostViews(v), 500))
    unsubs.push(subscribeToOutboundStats((o) => setOutboundStats(o)))
    unsubs.push(subscribeToOutboundClicks((o) => setOutboundClicks(o), 200))
    return () => unsubs.forEach((u) => u())
  }, [])

  const pendingContactCount = contacts.filter((c) => !c.handled).length

  const formatTime = (ts: Timestamp | null) => {
    if (!ts) return '—'
    return ts.toDate().toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const parseUA = (ua: string) => {
    let browser = 'Other'
    let os = 'Other'
    let device = 'Desktop'
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Edg')) browser = 'Edge'
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac OS')) os = 'macOS'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) os = 'iOS'
    else if (ua.includes('Linux')) os = 'Linux'
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device = 'Mobile'
    else if (ua.includes('iPad') || ua.includes('Tablet')) device = 'Tablet'
    return { browser, os, device }
  }

  // === 時間區間過濾 ===
  const cutoff = rangeCutoff(range)
  const rangedVisitors = useMemo(
    () => visitors.filter((v) => (v.timestamp?.toMillis() ?? 0) >= cutoff),
    [visitors, cutoff]
  )
  const rangedPostViews = useMemo(
    () => postViews.filter((v) => (v.timestamp?.toMillis() ?? 0) >= cutoff),
    [postViews, cutoff]
  )
  const rangedOutbound = useMemo(
    () => outboundClicks.filter((c) => (c.timestamp?.toMillis() ?? 0) >= cutoff),
    [outboundClicks, cutoff]
  )

  // === 派生統計 ===
  const mobileCount = rangedVisitors.filter((v) => parseUA(v.userAgent).device === 'Mobile').length
  const searchCount = rangedVisitors.filter((v) => v.isFromSearch).length

  const browserStats = rangedVisitors.reduce(
    (acc, v) => {
      const { browser } = parseUA(v.userAgent)
      acc[browser] = (acc[browser] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const referrerStats = rangedVisitors.reduce(
    (acc, v) => {
      const ref = v.isFromSearch
        ? v.searchEngine || 'Search'
        : v.referrer === 'direct'
          ? 'Direct'
          : 'Referral'
      acc[ref] = (acc[ref] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // 每篇文章區間內瀏覽次數
  const postViewsByRange = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const v of rangedPostViews) {
      counts[v.slug] = (counts[v.slug] || 0) + 1
    }
    return counts
  }, [rangedPostViews])

  // 綜合：文章排行（累計 + 區間）
  const postRanking = useMemo(() => {
    const rows = postStats.map((s) => ({
      slug: s.slug,
      title: s.title,
      totalViews: s.totalViews,
      rangeViews: postViewsByRange[s.slug] || 0,
      lastViewAt: s.lastViewAt,
    }))
    // 有文章還沒寫進 bob_post_stats、只在 bob_post_views 裡出現過 → 補上
    for (const slug of Object.keys(postViewsByRange)) {
      if (!rows.some((r) => r.slug === slug)) {
        const title = postViews.find((v) => v.slug === slug)?.title || slug
        rows.push({
          slug,
          title,
          totalViews: postViewsByRange[slug],
          rangeViews: postViewsByRange[slug],
          lastViewAt: null,
        })
      }
    }
    rows.sort((a, b) => b.rangeViews - a.rangeViews || b.totalViews - a.totalViews)
    return rows
  }, [postStats, postViewsByRange, postViews])

  // 外連區間統計
  const outboundByRange = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of rangedOutbound) {
      counts[c.target] = (counts[c.target] || 0) + 1
    }
    return counts
  }, [rangedOutbound])

  const outboundRanking = useMemo(() => {
    const rows = outboundStats.map((s) => ({
      target: s.target,
      totalClicks: s.totalClicks,
      rangeClicks: outboundByRange[s.target] || 0,
      lastClickAt: s.lastClickAt,
    }))
    for (const target of Object.keys(outboundByRange)) {
      if (!rows.some((r) => r.target === target)) {
        rows.push({
          target,
          totalClicks: outboundByRange[target],
          rangeClicks: outboundByRange[target],
          lastClickAt: null,
        })
      }
    }
    rows.sort((a, b) => b.rangeClicks - a.rangeClicks || b.totalClicks - a.totalClicks)
    return rows
  }, [outboundStats, outboundByRange])

  const rangeLabel = RANGE_LABEL[range]

  const tabs = [
    { id: 'overview' as const, label: '總覽' },
    { id: 'posts-traffic' as const, label: '文章流量' },
    { id: 'outbound' as const, label: '外連點擊' },
    { id: 'visitors' as const, label: '訪客' },
    { id: 'messages' as const, label: '留言' },
    { id: 'contacts' as const, label: '聯絡訊息', badge: pendingContactCount },
    { id: 'posts' as const, label: '文章管理' },
  ]

  // path 篩選（給「訪客」和「文章流量」共用）
  const allPaths = useMemo(() => {
    const set = new Set<string>()
    visitors.forEach((v) => set.add(v.path || '/'))
    return Array.from(set).sort()
  }, [visitors])

  const filteredVisitors = pathFilter
    ? rangedVisitors.filter((v) => (v.path || '/').includes(pathFilter))
    : rangedVisitors

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">Bob's Site Admin</h1>
          <a href="#/" className="text-gray-400 hover:text-white text-sm">
            ← 返回網站
          </a>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-5 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {'badge' in tab && tab.badge ? (
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 時間區間切換 — 只在數據類 tab 顯示 */}
      {(activeTab === 'overview' ||
        activeTab === 'posts-traffic' ||
        activeTab === 'outbound' ||
        activeTab === 'visitors') && (
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 text-xs text-gray-500">
            <span>區間：</span>
            {(['today', '7d', '30d', 'all'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded ${
                  range === r
                    ? 'bg-slate-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {RANGE_LABEL[r]}
              </button>
            ))}
            <span className="ml-auto text-gray-400">
              * 訪客/文章瀏覽為最近 500 筆內的區間統計；累計數字為全期
            </span>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading && activeTab !== 'posts' ? (
          <div className="text-center py-16 text-gray-400">載入中...</div>
        ) : (
          <>
            {/* ========= 總覽 ========= */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="總訪客（累計）" value={stats.totalVisits} />
                  <StatCard
                    label={`區間訪客（${rangeLabel}）`}
                    value={rangedVisitors.length}
                    color="text-sky-600"
                  />
                  <StatCard
                    label={`文章瀏覽（${rangeLabel}）`}
                    value={rangedPostViews.length}
                    color="text-violet-600"
                  />
                  <StatCard
                    label="聯絡訊息（待處理）"
                    value={pendingContactCount}
                    color={pendingContactCount > 0 ? 'text-rose-600' : 'text-gray-900'}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label={`搜尋引擎（${rangeLabel}）`} value={searchCount} color="text-purple-600" />
                  <StatCard label={`行動裝置（${rangeLabel}）`} value={mobileCount} color="text-emerald-600" />
                  <StatCard
                    label={`外連點擊（${rangeLabel}）`}
                    value={rangedOutbound.length}
                    color="text-amber-600"
                  />
                  <StatCard label="總留言" value={messages.length} />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <BarCard
                    title="瀏覽器分布"
                    color="bg-sky-500"
                    items={Object.entries(browserStats).sort((a, b) => b[1] - a[1])}
                    total={rangedVisitors.length}
                  />
                  <BarCard
                    title="訪客來源分布"
                    color="bg-violet-500"
                    items={Object.entries(referrerStats).sort((a, b) => b[1] - a[1])}
                    total={rangedVisitors.length}
                  />
                </div>

                {/* 熱門文章 + 熱門外連 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-700">
                        熱門文章 Top 5（{rangeLabel}）
                      </h3>
                      <button
                        onClick={() => setActiveTab('posts-traffic')}
                        className="text-xs text-sky-600 hover:underline"
                      >
                        看全部 →
                      </button>
                    </div>
                    {postRanking.length > 0 ? (
                      <ol className="space-y-2">
                        {postRanking.slice(0, 5).map((p, i) => (
                          <li key={p.slug} className="flex items-center gap-3 text-sm">
                            <span className="w-5 text-xs text-gray-400 font-mono">{i + 1}</span>
                            <span className="flex-1 truncate text-gray-700">{p.title}</span>
                            <span className="text-sky-600 font-bold font-mono">{p.rangeViews}</span>
                            <span className="text-[10px] text-gray-400 w-12 text-right">
                              累計 {p.totalViews}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-xs text-gray-400 py-3 text-center">此區間內無文章瀏覽</p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-700">
                        外連點擊 Top 5（{rangeLabel}）
                      </h3>
                      <button
                        onClick={() => setActiveTab('outbound')}
                        className="text-xs text-sky-600 hover:underline"
                      >
                        看全部 →
                      </button>
                    </div>
                    {outboundRanking.length > 0 ? (
                      <ol className="space-y-2">
                        {outboundRanking.slice(0, 5).map((o, i) => (
                          <li key={o.target} className="flex items-center gap-3 text-sm">
                            <span className="w-5 text-xs text-gray-400 font-mono">{i + 1}</span>
                            <TargetPill target={o.target} />
                            <span className="ml-auto text-amber-600 font-bold font-mono">
                              {o.rangeClicks}
                            </span>
                            <span className="text-[10px] text-gray-400 w-12 text-right">
                              累計 {o.totalClicks}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-xs text-gray-400 py-3 text-center">此區間內無外連點擊</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">最近留言（{messages.length}）</h3>
                  {messages.length > 0 ? (
                    <div className="space-y-3">
                      {messages.slice(0, 5).map((msg) => (
                        <div key={msg.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {msg.nickname.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">{msg.nickname}</span>
                              <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 py-4 text-center">尚無留言</p>
                  )}
                </div>
              </div>
            )}

            {/* ========= 文章流量 ========= */}
            {activeTab === 'posts-traffic' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-700">
                      文章排行（{rangeLabel}，共 {postRanking.length} 篇）
                    </h3>
                    <span className="text-xs text-gray-400">
                      區間總瀏覽：{rangedPostViews.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs text-gray-500">
                          <th className="py-2 px-4 w-10">#</th>
                          <th className="py-2 px-4">標題</th>
                          <th className="py-2 px-4 text-right w-24">{rangeLabel}</th>
                          <th className="py-2 px-4 text-right w-24">累計</th>
                          <th className="py-2 px-4 w-32">最近瀏覽</th>
                          <th className="py-2 px-4 w-20">打開</th>
                        </tr>
                      </thead>
                      <tbody>
                        {postRanking.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                              尚無文章瀏覽紀錄
                            </td>
                          </tr>
                        ) : (
                          postRanking.map((p, i) => (
                            <tr key={p.slug} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-4 text-xs text-gray-400 font-mono">{i + 1}</td>
                              <td className="py-2 px-4">
                                <div className="font-medium text-gray-800 truncate max-w-md">
                                  {p.title}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">/{p.slug}</div>
                              </td>
                              <td className="py-2 px-4 text-right font-bold text-sky-600 font-mono">
                                {p.rangeViews}
                              </td>
                              <td className="py-2 px-4 text-right text-gray-600 font-mono">
                                {p.totalViews}
                              </td>
                              <td className="py-2 px-4 text-xs text-gray-500">
                                {formatTime(p.lastViewAt)}
                              </td>
                              <td className="py-2 px-4">
                                <a
                                  href={`https://yanchen184.github.io/ai-lecturer-bob/blog/${p.slug}/`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-sky-600 hover:underline"
                                >
                                  開啟 ↗
                                </a>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 最近的文章瀏覽 */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-bold text-gray-700">
                      最近文章瀏覽（{rangedPostViews.length}）
                    </h3>
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr className="text-left text-xs text-gray-500">
                          <th className="py-2 px-4">時間</th>
                          <th className="py-2 px-4">文章</th>
                          <th className="py-2 px-4">來源</th>
                          <th className="py-2 px-4">裝置</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rangedPostViews.slice(0, 100).map((v) => {
                          const ua = parseUA(v.userAgent)
                          return (
                            <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-4 text-xs text-gray-500">
                                {formatTime(v.timestamp)}
                              </td>
                              <td className="py-2 px-4 text-xs text-gray-700 truncate max-w-xs">
                                {v.title || v.slug}
                              </td>
                              <td className="py-2 px-4">
                                {v.isFromSearch ? (
                                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                                    {v.searchEngine}
                                  </span>
                                ) : v.referrer === 'direct' ? (
                                  <span className="text-gray-400 text-xs">直接</span>
                                ) : (
                                  <span className="text-blue-500 text-xs truncate block max-w-[160px]">
                                    {v.referrer}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-4 text-xs text-gray-600">
                                {ua.os} · {ua.browser}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========= 外連點擊 ========= */}
            {activeTab === 'outbound' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-bold text-gray-700">
                      外連平台排行（{rangeLabel}）
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs text-gray-500">
                          <th className="py-2 px-4">平台</th>
                          <th className="py-2 px-4 text-right w-24">{rangeLabel}</th>
                          <th className="py-2 px-4 text-right w-24">累計</th>
                          <th className="py-2 px-4">最近點擊</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outboundRanking.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-12 text-gray-400 text-sm">
                              尚無外連點擊紀錄
                            </td>
                          </tr>
                        ) : (
                          outboundRanking.map((o) => (
                            <tr key={o.target} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-4">
                                <TargetPill target={o.target} />
                              </td>
                              <td className="py-2 px-4 text-right font-bold text-amber-600 font-mono">
                                {o.rangeClicks}
                              </td>
                              <td className="py-2 px-4 text-right text-gray-600 font-mono">
                                {o.totalClicks}
                              </td>
                              <td className="py-2 px-4 text-xs text-gray-500">
                                {formatTime(o.lastClickAt)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 最近外連點擊明細 */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-bold text-gray-700">
                      最近點擊明細（{rangedOutbound.length}）
                    </h3>
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr className="text-left text-xs text-gray-500">
                          <th className="py-2 px-4">時間</th>
                          <th className="py-2 px-4">平台</th>
                          <th className="py-2 px-4">URL / 按鈕</th>
                          <th className="py-2 px-4">來源頁</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rangedOutbound.slice(0, 100).map((c) => (
                          <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-4 text-xs text-gray-500">
                              {formatTime(c.timestamp)}
                            </td>
                            <td className="py-2 px-4">
                              <TargetPill target={c.target} />
                            </td>
                            <td className="py-2 px-4 text-xs">
                              <div className="text-gray-700 truncate max-w-xs">
                                {c.label || c.url}
                              </div>
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-sky-600 hover:underline truncate block max-w-xs"
                              >
                                {c.url}
                              </a>
                            </td>
                            <td className="py-2 px-4 text-xs text-gray-500 font-mono truncate max-w-[180px]">
                              {c.fromPath || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========= 訪客 ========= */}
            {activeTab === 'visitors' && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center gap-3 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-700">
                    最近訪客（{filteredVisitors.length} / {rangedVisitors.length}）
                  </h3>
                  <select
                    value={pathFilter}
                    onChange={(e) => setPathFilter(e.target.value)}
                    className="ml-auto text-xs border rounded px-2 py-1 text-gray-600"
                  >
                    <option value="">全部路徑</option>
                    {allPaths.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-500">
                        <th className="py-2 px-4">時間</th>
                        <th className="py-2 px-4">路徑</th>
                        <th className="py-2 px-4">來源</th>
                        <th className="py-2 px-4">裝置</th>
                        <th className="py-2 px-4">瀏覽器</th>
                        <th className="py-2 px-4">螢幕</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVisitors.map((v) => {
                        const { browser, os, device } = parseUA(v.userAgent)
                        return (
                          <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-4 text-gray-600">{formatTime(v.timestamp)}</td>
                            <td className="py-2 px-4 text-xs font-mono text-gray-500 truncate max-w-[200px]">
                              {v.path || '/'}
                            </td>
                            <td className="py-2 px-4">
                              {v.isFromSearch ? (
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                                  {v.searchEngine}
                                </span>
                              ) : v.referrer === 'direct' ? (
                                <span className="text-gray-400 text-xs">直接訪問</span>
                              ) : (
                                <span className="text-blue-500 text-xs truncate block max-w-[120px]">
                                  {v.referrer}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-4">
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  device === 'Mobile'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {os}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-gray-600">{browser}</td>
                            <td className="py-2 px-4 text-gray-400 text-xs">
                              {v.screenWidth}x{v.screenHeight}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========= 聯絡訊息 ========= */}
            {activeTab === 'contacts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-700">
                    聯絡訊息（{contacts.length}，待處理 {pendingContactCount}）
                  </h3>
                  <div className="flex gap-1">
                    {(['pending', 'all', 'handled'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setContactFilter(f)}
                        className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                          contactFilter === f
                            ? 'bg-sky-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {f === 'pending' ? '待處理' : f === 'handled' ? '已處理' : '全部'}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const filtered = contacts.filter((c) =>
                    contactFilter === 'all'
                      ? true
                      : contactFilter === 'pending'
                        ? !c.handled
                        : c.handled
                  )

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white rounded-lg p-10 text-center text-sm text-gray-400 shadow-sm">
                        {contactFilter === 'pending' ? '沒有待處理的訊息' : '尚無訊息'}
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-3">
                      {filtered.map((c) => (
                        <ContactCard
                          key={c.id}
                          contact={c}
                          formatTime={formatTime}
                          onToggleHandled={async () => {
                            try {
                              await markContactHandled(c.id, !c.handled)
                            } catch (err) {
                              console.error('標記處理狀態失敗:', err)
                            }
                          }}
                        />
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ========= 文章管理 ========= */}
            {activeTab === 'posts' && <AdminBlogEditor />}

            {/* ========= 留言 ========= */}
            {activeTab === 'messages' && (
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-4">所有留言（{messages.length}）</h3>
                {messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-bold">
                              {msg.nickname.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800 text-sm">{msg.nickname}</span>
                          </div>
                          <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap pl-10">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-400">尚無留言</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

const StatCard = ({ label, value, color = 'text-gray-900' }: { label: string; value: number; color?: string }) => (
  <div className="bg-white rounded-lg p-4 shadow-sm">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
)

const BarCard = ({
  title,
  items,
  total,
  color,
}: {
  title: string
  items: [string, number][]
  total: number
  color: string
}) => (
  <div className="bg-white rounded-lg p-5 shadow-sm">
    <h3 className="text-sm font-bold text-gray-700 mb-3">{title}</h3>
    {items.length === 0 ? (
      <p className="text-xs text-gray-400 py-4 text-center">無資料</p>
    ) : (
      <div className="space-y-2">
        {items.map(([name, count]) => (
          <div key={name} className="flex items-center gap-3">
            <span className="w-20 text-xs text-gray-500 truncate">{name}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2.5">
              <div
                className={`${color} h-2.5 rounded-full`}
                style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
              />
            </div>
            <span className="w-8 text-xs text-gray-600 text-right">{count}</span>
          </div>
        ))}
      </div>
    )}
  </div>
)

const TARGET_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700',
  youtube: 'bg-red-100 text-red-700',
  github: 'bg-gray-800 text-white',
  email: 'bg-sky-100 text-sky-700',
  linkedin: 'bg-blue-100 text-blue-700',
  threads: 'bg-gray-100 text-gray-800',
  twitter: 'bg-slate-100 text-slate-700',
  facebook: 'bg-indigo-100 text-indigo-700',
  telegram: 'bg-cyan-100 text-cyan-700',
  other: 'bg-gray-100 text-gray-600',
}

const TARGET_ICON: Record<string, string> = {
  instagram: 'IG',
  youtube: 'YT',
  github: 'GH',
  email: '@',
  linkedin: 'in',
  threads: 'Th',
  twitter: 'X',
  facebook: 'fb',
  telegram: 'TG',
  other: '…',
}

const TargetPill = ({ target }: { target: string }) => {
  const cls = TARGET_COLORS[target] || TARGET_COLORS.other
  const icon = TARGET_ICON[target] || TARGET_ICON.other
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded ${cls}`}>
      <span className="font-mono font-bold text-[10px]">{icon}</span>
      <span className="capitalize">{target}</span>
    </span>
  )
}

interface ContactCardProps {
  contact: ContactRecord
  formatTime: (ts: Timestamp | null) => string
  onToggleHandled: () => void
}

const ContactCard = ({ contact, formatTime, onToggleHandled }: ContactCardProps) => {
  const mailtoHref = `mailto:${contact.email}?subject=${encodeURIComponent(
    'Re: ' + contact.subject
  )}&body=${encodeURIComponent(`Hi ${contact.name},\n\n`)}`

  return (
    <div
      className={`bg-white rounded-lg p-5 shadow-sm border-l-4 ${
        contact.handled ? 'border-emerald-400 opacity-60' : 'border-rose-400'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-gray-800">{contact.name}</span>
            {contact.company && (
              <span className="text-xs text-gray-500">· {contact.company}</span>
            )}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                contact.handled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {contact.handled ? '已處理' : '待處理'}
            </span>
          </div>
          <div className="text-xs text-gray-500 space-x-2">
            <a href={mailtoHref} className="text-sky-600 hover:underline">
              {contact.email}
            </a>
            <span>·</span>
            <span>{formatTime(contact.createdAt)}</span>
          </div>
        </div>
        <button
          onClick={onToggleHandled}
          className={`text-xs px-3 py-1.5 rounded-md border transition-colors flex-shrink-0 ${
            contact.handled
              ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
              : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          {contact.handled ? '標記未處理' : '標記已處理'}
        </button>
      </div>
      <div className="mt-2">
        <div className="text-sm font-medium text-gray-800 mb-1">{contact.subject}</div>
        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
          {contact.message}
        </p>
      </div>
      {contact.referrerPath && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400 font-mono">
          來自: {contact.referrerPath}
        </div>
      )}
    </div>
  )
}

export default AdminPage

import { useEffect, useState } from 'react'
import {
  subscribeToVisitorStats,
  subscribeToRecentVisitors,
  subscribeToMessages,
} from '../firebase'
import type { VisitorStats, GuestMessage } from '../firebase'
import { Timestamp } from 'firebase/firestore'

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

const AdminPage = () => {
  const [stats, setStats] = useState<VisitorStats>({ totalVisits: 0, lastVisit: null })
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [messages, setMessages] = useState<GuestMessage[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'visitors' | 'messages'>('overview')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsub1 = subscribeToVisitorStats((s) => {
      setStats(s)
      setIsLoading(false)
    })
    const unsub2 = subscribeToRecentVisitors((v) => setVisitors(v))
    const unsub3 = subscribeToMessages((m) => setMessages(m))
    return () => { unsub1(); unsub2(); unsub3() }
  }, [])

  const formatTime = (ts: Timestamp | null) => {
    if (!ts) return '—'
    return ts.toDate().toLocaleString('zh-TW', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
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

  // 統計
  const mobileCount = visitors.filter(v => parseUA(v.userAgent).device === 'Mobile').length
  const desktopCount = visitors.filter(v => parseUA(v.userAgent).device !== 'Mobile').length
  const searchCount = visitors.filter(v => v.isFromSearch).length

  const browserStats = visitors.reduce((acc, v) => {
    const { browser } = parseUA(v.userAgent)
    acc[browser] = (acc[browser] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const referrerStats = visitors.reduce((acc, v) => {
    const ref = v.isFromSearch ? v.searchEngine || 'Search' : v.referrer === 'direct' ? 'Direct' : 'Referral'
    acc[ref] = (acc[ref] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const tabs = [
    { id: 'overview' as const, label: '總覽' },
    { id: 'visitors' as const, label: '訪客' },
    { id: 'messages' as const, label: '留言' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">Bob's Site Admin</h1>
          <a href="#/" className="text-gray-400 hover:text-white text-sm">← 返回網站</a>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">載入中...</div>
        ) : (
          <>
            {/* 總覽 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="總訪客" value={stats.totalVisits} />
                  <StatCard label="搜尋引擎" value={searchCount} color="text-purple-600" />
                  <StatCard label="行動裝置" value={mobileCount} color="text-green-600" />
                  <StatCard label="桌面裝置" value={desktopCount} color="text-blue-600" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">瀏覽器分布</h3>
                    <div className="space-y-2">
                      {Object.entries(browserStats).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                        <div key={name} className="flex items-center gap-3">
                          <span className="w-16 text-xs text-gray-500">{name}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                            <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${(count / visitors.length) * 100}%` }} />
                          </div>
                          <span className="w-8 text-xs text-gray-600 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">來源分布</h3>
                    <div className="space-y-2">
                      {Object.entries(referrerStats).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                        <div key={name} className="flex items-center gap-3">
                          <span className="w-16 text-xs text-gray-500">{name}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                            <div className="bg-violet-500 h-2.5 rounded-full" style={{ width: `${(count / visitors.length) * 100}%` }} />
                          </div>
                          <span className="w-8 text-xs text-gray-600 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
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

            {/* 訪客 */}
            {activeTab === 'visitors' && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-bold text-gray-700">最近訪客（{visitors.length}）</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-500">
                        <th className="py-2 px-4">時間</th>
                        <th className="py-2 px-4">來源</th>
                        <th className="py-2 px-4">裝置</th>
                        <th className="py-2 px-4">瀏覽器</th>
                        <th className="py-2 px-4">螢幕</th>
                        <th className="py-2 px-4">語言</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.map((v) => {
                        const { browser, os, device } = parseUA(v.userAgent)
                        return (
                          <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-4 text-gray-600">{formatTime(v.timestamp)}</td>
                            <td className="py-2 px-4">
                              {v.isFromSearch ? (
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">{v.searchEngine}</span>
                              ) : v.referrer === 'direct' ? (
                                <span className="text-gray-400 text-xs">直接訪問</span>
                              ) : (
                                <span className="text-blue-500 text-xs truncate block max-w-[120px]">{v.referrer}</span>
                              )}
                            </td>
                            <td className="py-2 px-4">
                              <span className={`text-xs px-2 py-0.5 rounded ${device === 'Mobile' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                {os}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-gray-600">{browser}</td>
                            <td className="py-2 px-4 text-gray-400 text-xs">{v.screenWidth}x{v.screenHeight}</td>
                            <td className="py-2 px-4 text-gray-400 text-xs">{v.language}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 留言 */}
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

export default AdminPage

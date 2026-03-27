import { useState, useEffect } from 'react'
import { addGuestMessage, subscribeToMessages } from '../firebase'
import type { GuestMessage } from '../firebase'
import { Timestamp } from 'firebase/firestore'

const MessageBoard = () => {
  const [messages, setMessages] = useState<GuestMessage[]>([])
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsub = subscribeToMessages(
      (m) => setMessages(m),
      (err) => {
        console.error('留言載入失敗:', err)
        setError('留言載入失敗，請重新整理頁面')
      }
    )
    return () => unsub()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !content.trim() || sending) return

    setSending(true)
    setError('')
    try {
      await addGuestMessage(nickname, content)
      setContent('')
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      console.error('留言失敗:', err)
      setError('留言送出失敗，請稍後再試')
      setTimeout(() => setError(''), 5000)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (ts: Timestamp | null) => {
    if (!ts) return ''
    const d = ts.toDate()
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Generate a consistent color from nickname
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-primary-500 to-blue-500',
      'from-accent-500 to-pink-500',
      'from-emerald-500 to-teal-500',
      'from-amber-500 to-orange-500',
      'from-violet-500 to-purple-500',
      'from-rose-500 to-red-500',
      'from-cyan-500 to-sky-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return gradients[Math.abs(hash) % gradients.length]
  }

  const maxContentLength = 500

  return (
    <section id="messages" className="py-20 lg:py-32 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-bento-card border border-bento-border text-sm text-bento-text-secondary mb-6">
            <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            即時互動
          </div>
          <h2 className="section-title">
            <span className="gradient-text">留言板</span>
          </h2>
          <p className="text-bento-text-secondary text-lg max-w-2xl mx-auto">
            想說什麼都可以，課程問題、合作邀約、或是單純打個招呼
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 lg:gap-12">
          {/* 留言表單 - 2 cols */}
          <div className="md:col-span-2">
            <div className="bg-bento-card rounded-bento-lg p-6 lg:p-8 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-bento-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-bento-text">留個言吧</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nickname" className="block text-sm text-bento-text-secondary mb-1.5">暱稱</label>
                  <input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="你的名字"
                    maxLength={20}
                    className="w-full px-4 py-3 bg-white border border-bento-border rounded-bento text-bento-text placeholder-bento-text-secondary/50 focus:outline-none focus:border-primary-500  transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="msg-content" className="block text-sm text-bento-text-secondary">留言內容</label>
                    <span className={`text-xs transition-colors ${content.length > maxContentLength * 0.8 ? 'text-amber-500' : 'text-bento-text-secondary'}`}>
                      {content.length}/{maxContentLength}
                    </span>
                  </div>
                  <textarea
                    id="msg-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="想說什麼..."
                    rows={4}
                    maxLength={maxContentLength}
                    className="w-full px-4 py-3 bg-white border border-bento-border rounded-bento text-bento-text placeholder-bento-text-secondary/50 focus:outline-none focus:border-primary-500  transition-all duration-200 resize-none"
                    required
                  />
                </div>

                {/* Status Messages */}
                <div className="min-h-[24px]">
                  {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}
                  {sent && (
                    <div className="flex items-center gap-2 text-emerald-500 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      留言送出成功！
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sending || !nickname.trim() || !content.trim()}
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-bento-text font-medium rounded-xl hover:from-primary-400 hover:to-accent-400 hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      送出中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      送出留言
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* 留言列表 - 3 cols */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-bento-text font-medium flex items-center gap-2">
                <span className="text-bento-text-secondary">所有留言</span>
                {messages.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-white/10 rounded-full text-bento-text-secondary">
                    {messages.length}
                  </span>
                )}
              </h3>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className="group relative bg-bento-card hover:bg-bento-card-hover border border-bento-border hover:border-bento-border rounded-2xl p-5 transition-all duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Top row: avatar + name + time */}
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(msg.nickname)} flex items-center justify-center text-bento-text text-sm font-bold flex-shrink-0 shadow-lg`}>
                        {msg.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-bento-text text-sm font-medium truncate">
                            {msg.nickname}
                          </span>
                          <span className="text-bento-text-secondary text-xs flex-shrink-0">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-bento-text-secondary text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bento-card flex items-center justify-center">
                    <svg className="w-8 h-8 text-bento-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-bento-text-secondary text-sm mb-1">還沒有留言</p>
                  <p className="text-bento-text-secondary text-xs">來當第一個留言的人吧</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MessageBoard

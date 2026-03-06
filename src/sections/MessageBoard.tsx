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

  useEffect(() => {
    const unsub = subscribeToMessages((m) => setMessages(m))
    return () => unsub()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !content.trim() || sending) return

    setSending(true)
    try {
      await addGuestMessage(nickname, content)
      setContent('')
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  const formatTime = (ts: Timestamp | null) => {
    if (!ts) return ''
    const d = ts.toDate()
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
  }

  return (
    <section id="messages" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-title">
            <span className="gradient-text">留言板</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            想說什麼都可以，課程問題、合作邀約、或是單純打個招呼
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 留言表單 */}
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold text-white mb-6">留個言吧</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nickname" className="block text-sm text-gray-400 mb-1">暱稱</label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="你的名字"
                  maxLength={20}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label htmlFor="msg-content" className="block text-sm text-gray-400 mb-1">留言內容</label>
                <textarea
                  id="msg-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="想說什麼..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sending || !nickname.trim() || !content.trim()}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-xl hover:from-primary-400 hover:to-accent-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? '送出中...' : sent ? '已送出！' : '送出留言'}
              </button>
            </form>
          </div>

          {/* 留言列表 */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {msg.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{msg.nickname}</span>
                      <span className="text-gray-500 text-xs">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm pl-11 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            ) : (
              <div className="glass-card p-8 text-center">
                <p className="text-gray-500">還沒有留言，來當第一個吧</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MessageBoard

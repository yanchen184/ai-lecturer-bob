import { useState, useEffect } from 'react'
import { addGuestMessage, subscribeToMessages } from '../firebase'
import type { GuestMessage } from '../firebase'
import { Timestamp } from 'firebase/firestore'

/** Neubrutalism-native 留言板：紙色底、粗黑邊、黃色強調、hard shadow。
 *  替代 theme.css override 的補丁做法，視覺更貼合 swiss-modernism 主題。*/
const MessageBoardNeub = () => {
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
    return ts.toDate().toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const maxContentLength = 500

  // Neubrutalism palette — 每則留言用不同強調色，取決於暱稱 hash
  const cardTints = ['#ffff00', '#ff6ec7', '#00ffd1', '#ffb347', '#a78bfa', '#7dd3fc']
  const tintFor = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return cardTints[Math.abs(hash) % cardTints.length]
  }

  return (
    <section
      id="messages"
      className="relative py-24 lg:py-32 font-mono"
      style={{ background: '#fafaf7', color: '#0a0a0a', borderTop: '2px solid #0a0a0a' }}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <div
            className="inline-block px-3 py-1 mb-4 text-[11px] uppercase tracking-widest border-2 border-black"
            style={{ background: '#ffff00' }}
          >
            // guestbook
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none">
            留個言
            <br />
            吧
          </h2>
          <p className="mt-4 text-sm md:text-base max-w-xl">
            想說什麼都可以——課程問題、合作邀約、或是單純打個招呼。
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 lg:gap-8">
          {/* 留言表單 */}
          <div className="md:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="p-5 md:p-6"
              style={{
                background: '#ffffff',
                border: '2px solid #0a0a0a',
                boxShadow: '6px 6px 0 #0a0a0a',
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="w-7 h-7 flex items-center justify-center text-sm font-black"
                  style={{ background: '#ffff00', border: '2px solid #0a0a0a' }}
                >
                  ✎
                </span>
                <span className="text-xs uppercase tracking-widest font-black">
                  new.entry()
                </span>
              </div>

              <label className="block mb-4">
                <span className="block text-[11px] uppercase tracking-wider mb-1.5 font-bold">
                  暱稱 *
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="你的名字"
                  maxLength={20}
                  required
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    background: '#fafaf7',
                    border: '2px solid #0a0a0a',
                    color: '#0a0a0a',
                  }}
                />
              </label>

              <label className="block mb-4">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold">
                    留言內容 *
                  </span>
                  <span
                    className="text-[10px] font-mono"
                    style={{
                      color: content.length > maxContentLength * 0.8 ? '#c2410c' : '#6b7280',
                    }}
                  >
                    {content.length}/{maxContentLength}
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="想說什麼..."
                  rows={5}
                  maxLength={maxContentLength}
                  required
                  className="w-full px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{
                    background: '#fafaf7',
                    border: '2px solid #0a0a0a',
                    color: '#0a0a0a',
                  }}
                />
              </label>

              {/* Status */}
              <div className="min-h-[24px] mb-3 text-xs">
                {error && (
                  <div
                    className="px-2 py-1 inline-block font-bold"
                    style={{ background: '#fecaca', border: '2px solid #0a0a0a' }}
                  >
                    ✕ {error}
                  </div>
                )}
                {sent && (
                  <div
                    className="px-2 py-1 inline-block font-bold"
                    style={{ background: '#bbf7d0', border: '2px solid #0a0a0a' }}
                  >
                    ✓ 留言送出成功！
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={sending || !nickname.trim() || !content.trim()}
                className="w-full py-3 text-sm uppercase tracking-widest font-black transition-transform active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: '#ffff00',
                  border: '2px solid #0a0a0a',
                  color: '#0a0a0a',
                  boxShadow: '4px 4px 0 #0a0a0a',
                }}
              >
                {sending ? 'sending...' : '→ submit'}
              </button>
            </form>
          </div>

          {/* 留言列表 */}
          <div className="md:col-span-3">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-xs uppercase tracking-widest font-black">
                all.messages
              </h3>
              {messages.length > 0 && (
                <span
                  className="text-[10px] font-mono px-2 py-0.5"
                  style={{ background: '#0a0a0a', color: '#fafaf7' }}
                >
                  {messages.length} 則
                </span>
              )}
            </div>

            {messages.length > 0 ? (
              <ul className="space-y-4 max-h-[600px] overflow-y-auto pr-2 neub-scrollbar">
                {messages.map((msg) => {
                  const tint = tintFor(msg.nickname)
                  return (
                    <li
                      key={msg.id}
                      className="p-4 transition-transform hover:-translate-y-0.5"
                      style={{
                        background: '#ffffff',
                        border: '2px solid #0a0a0a',
                        boxShadow: '4px 4px 0 #0a0a0a',
                      }}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div
                          className="w-8 h-8 flex items-center justify-center text-sm font-black"
                          style={{ background: tint, border: '2px solid #0a0a0a' }}
                        >
                          {msg.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">{msg.nickname}</div>
                          <div className="text-[10px] font-mono opacity-60">
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pl-11">
                        {msg.content}
                      </p>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div
                className="p-8 text-center"
                style={{
                  background: '#ffffff',
                  border: '2px dashed #0a0a0a',
                }}
              >
                <div className="text-5xl mb-3">¯\_(ツ)_/¯</div>
                <p className="text-sm font-bold">還沒人留言</p>
                <p className="text-xs opacity-60 mt-1">來當第一個留言的人吧</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 捲軸 */}
      <style>{`
        .neub-scrollbar::-webkit-scrollbar { width: 8px; }
        .neub-scrollbar::-webkit-scrollbar-track { background: #fafaf7; border-left: 2px solid #0a0a0a; }
        .neub-scrollbar::-webkit-scrollbar-thumb { background: #0a0a0a; }
      `}</style>
    </section>
  )
}

export default MessageBoardNeub

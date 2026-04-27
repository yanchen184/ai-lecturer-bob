import { useEffect, useState, type FormEvent } from 'react';
import {
  addGuestMessage,
  subscribeToMessages,
  type GuestMessage,
} from '../lib/firebase-client';

/** 留言板 — Firebase 實時訂閱
 *  - 用 client:visible 延遲載入（Firebase bundle 只在捲到此區才下載）
 *  - Neub 風格，Anti 覆寫走 global.css [data-theme="anti"] .message-board
 */
const MAX_NICKNAME = 20;
const MAX_CONTENT = 500;

const cardTints = ['#ffeb3b', '#ff6ec7', '#00ffd1', '#ffb347', '#a78bfa', '#7dd3fc'];
const tintFor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return cardTints[Math.abs(hash) % cardTints.length];
};

function formatTime(ts: GuestMessage['createdAt']): string {
  if (!ts) return '';
  return ts.toDate().toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessageBoard() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = subscribeToMessages(
      (m) => {
        setMessages(m);
        setLoaded(true);
      },
      () => {
        setError('留言載入失敗，請重新整理頁面');
        setLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nickname.trim() || !content.trim() || sending) return;

    setSending(true);
    setError('');
    try {
      await addGuestMessage(nickname, content);
      setContent('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      setError('留言送出失敗，請稍後再試');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      id="messages"
      className="message-board px-6 md:px-10 py-20 border-b-[3px] border-black"
      style={{ background: '#fafaf7' }}
      aria-labelledby="messages-title"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-xs uppercase tracking-widest opacity-60 mb-3 font-mono">
          guestbook
        </div>
        <h2
          id="messages-title"
          className="text-3xl md:text-4xl font-black tracking-tight mb-3"
        >
          留個言吧
        </h2>
        <p className="text-sm md:text-base opacity-70 mb-10 max-w-2xl">
          想說什麼都可以 — 課程問題、合作邀約，或單純打個招呼。
        </p>

        <div className="grid gap-6 lg:gap-8 md:grid-cols-5">
          {/* Form */}
          <div className="md:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="message-form border-2 border-black bg-white p-5 md:p-6"
              style={{ boxShadow: '5px 5px 0 #0a0a0a' }}
            >
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="w-7 h-7 flex items-center justify-center text-sm font-black border-2 border-black"
                  style={{ background: 'var(--color-neub-yellow)' }}
                  aria-hidden="true"
                >
                  ✎
                </span>
                <span className="text-xs uppercase tracking-widest font-black font-mono">
                  new.entry()
                </span>
              </div>

              <label className="block mb-4">
                <span className="block text-[11px] uppercase tracking-wider mb-1.5 font-bold font-mono">
                  暱稱 *
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="你的名字"
                  maxLength={MAX_NICKNAME}
                  required
                  className="w-full px-3 py-2.5 text-sm border-2 border-black focus:outline-none"
                  style={{ background: '#fafaf7' }}
                />
              </label>

              <label className="block mb-4">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold font-mono">
                    留言內容 *
                  </span>
                  <span
                    className="text-[10px] font-mono"
                    style={{
                      color: content.length > MAX_CONTENT * 0.8 ? '#c2410c' : '#6b7280',
                    }}
                  >
                    {content.length}/{MAX_CONTENT}
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="想說什麼..."
                  rows={5}
                  maxLength={MAX_CONTENT}
                  required
                  className="w-full px-3 py-2.5 text-sm resize-none border-2 border-black focus:outline-none"
                  style={{ background: '#fafaf7' }}
                />
              </label>

              <div className="min-h-[28px] mb-3 text-xs">
                {error && (
                  <div
                    className="px-2 py-1 inline-block font-bold border-2 border-black"
                    style={{ background: '#fecaca' }}
                    role="alert"
                  >
                    ✕ {error}
                  </div>
                )}
                {sent && (
                  <div
                    className="px-2 py-1 inline-block font-bold border-2 border-black"
                    style={{ background: '#bbf7d0' }}
                    role="status"
                  >
                    ✓ 留言送出成功！
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={sending || !nickname.trim() || !content.trim()}
                className="w-full py-3 text-sm uppercase tracking-widest font-black border-2 border-black transition-transform active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                style={{
                  background: 'var(--color-neub-yellow)',
                  color: '#0a0a0a',
                  boxShadow: '4px 4px 0 #0a0a0a',
                }}
              >
                {sending ? 'sending...' : '→ submit'}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="md:col-span-3">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-xs uppercase tracking-widest font-black font-mono">
                all.messages
              </h3>
              {messages.length > 0 && (
                <span
                  className="text-[10px] font-mono px-2 py-0.5 font-bold"
                  style={{ background: '#0a0a0a', color: '#fafaf7' }}
                >
                  {messages.length} 則
                </span>
              )}
            </div>

            {!loaded ? (
              <div
                className="border-2 border-dashed border-black p-8 text-center text-sm opacity-60 font-mono"
                aria-live="polite"
              >
                loading...
              </div>
            ) : messages.length > 0 ? (
              <ul className="space-y-4 max-h-[640px] overflow-y-auto pr-2 neub-scrollbar">
                {messages.map((msg) => {
                  const tint = tintFor(msg.nickname);
                  return (
                    <li
                      key={msg.id}
                      className="message-item border-2 border-black bg-white p-4 transition-transform hover:-translate-y-0.5"
                      style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div
                          className="avatar w-8 h-8 flex items-center justify-center text-sm font-black border-2 border-black"
                          style={{ background: tint }}
                          aria-hidden="true"
                        >
                          {msg.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">
                            {msg.nickname}
                          </div>
                          <div className="text-[10px] font-mono opacity-60">
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pl-[2.625rem]">
                        {msg.content}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="border-2 border-dashed border-black p-8 text-center bg-white">
                <div className="text-4xl mb-3" aria-hidden="true">
                  ¯\_(ツ)_/¯
                </div>
                <p className="text-sm font-bold">還沒人留言</p>
                <p className="text-xs opacity-60 mt-1 font-mono">
                  來當第一個留言的人吧
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .neub-scrollbar::-webkit-scrollbar { width: 8px; }
        .neub-scrollbar::-webkit-scrollbar-track {
          background: #fafaf7;
          border-left: 2px solid #0a0a0a;
        }
        .neub-scrollbar::-webkit-scrollbar-thumb { background: #0a0a0a; }
      `}</style>
    </section>
  );
}

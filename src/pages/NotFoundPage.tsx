import { Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

/**
 * Neubrutalism 風格的 404 頁。
 * 用在「完全不匹配的路由」與「部落格文章 slug 無效」兩種情境。
 *
 * @param variant  'page' (預設) 顯示完整頁面 hero；'inline' 只顯示卡片，給 BlogPost 等已有 layout 的場景用
 * @param message  可選，覆寫預設「Page not found」訊息，例如用於文章找不到
 */
interface NotFoundPageProps {
  variant?: 'page' | 'inline'
  message?: string
}

const NotFoundPage = ({ variant = 'page', message }: NotFoundPageProps) => {
  const location = useLocation()
  const headline = message ?? 'Page not found'
  const attemptedPath = location.pathname + location.hash

  const inlineCard = (
    <div
      className="p-8 md:p-12 max-w-2xl mx-auto"
      style={{
        background: '#ffffff',
        border: '2px solid #0a0a0a',
        boxShadow: '8px 8px 0 #0a0a0a',
      }}
    >
      <div
        className="inline-block px-2 py-1 mb-6 text-[11px] uppercase tracking-widest border-2 border-black font-black"
        style={{ background: '#ffff00' }}
      >
        // error.status = 404
      </div>

      <h1 className="text-[5rem] md:text-[8rem] font-black leading-none tracking-tighter mb-2 relative inline-block">
        4<span style={{ color: '#ff6ec7' }}>0</span>4
        <span
          className="absolute -top-2 -right-6 text-[10px] font-mono px-1.5 py-0.5 rotate-12 inline-block"
          style={{ background: '#0a0a0a', color: '#ffff00', border: '2px solid #0a0a0a' }}
        >
          oops
        </span>
      </h1>

      <p className="text-lg md:text-xl font-black uppercase tracking-tight mt-6 mb-2">
        {headline}
      </p>
      <p className="text-sm opacity-70 mb-1">
        你要找的頁面可能被搬走、重新命名，或從來沒存在過。
      </p>
      <p className="text-xs font-mono opacity-50 mb-8 break-all">
        <span className="opacity-60">requested:</span> {attemptedPath}
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/"
          className="px-4 py-2.5 text-xs uppercase tracking-widest font-black transition-transform active:translate-x-[2px] active:translate-y-[2px]"
          style={{
            background: '#ffff00',
            border: '2px solid #0a0a0a',
            color: '#0a0a0a',
            boxShadow: '4px 4px 0 #0a0a0a',
          }}
        >
          → 回首頁
        </Link>
        <Link
          to="/blog"
          className="px-4 py-2.5 text-xs uppercase tracking-widest font-black transition-transform active:translate-x-[2px] active:translate-y-[2px]"
          style={{
            background: '#ffffff',
            border: '2px solid #0a0a0a',
            color: '#0a0a0a',
            boxShadow: '4px 4px 0 #0a0a0a',
          }}
        >
          → 逛部落格
        </Link>
      </div>
    </div>
  )

  if (variant === 'inline') {
    return (
      <>
        <Helmet>
          <title>404 — 找不到頁面 | AI講師陳彥彤YC</title>
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <div className="py-12">{inlineCard}</div>
      </>
    )
  }

  // Full page variant — 獨立版，含裝飾與背景
  return (
    <>
      <Helmet>
        <title>404 — 找不到頁面 | AI講師陳彥彤YC</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div
        className="min-h-screen font-mono flex items-center justify-center px-4 relative overflow-hidden"
        style={{ background: '#fafaf7', color: '#0a0a0a' }}
      >
        {/* 裝飾：散落的粗邊方塊 */}
        <div
          className="absolute top-12 left-8 w-20 h-20 rotate-12 hidden md:block"
          style={{ background: '#ff6ec7', border: '2px solid #0a0a0a', boxShadow: '4px 4px 0 #0a0a0a' }}
          aria-hidden
        />
        <div
          className="absolute bottom-16 right-12 w-16 h-16 -rotate-6 hidden md:block"
          style={{ background: '#00ffd1', border: '2px solid #0a0a0a', boxShadow: '4px 4px 0 #0a0a0a' }}
          aria-hidden
        />
        <div
          className="absolute top-1/3 right-10 text-[10px] font-mono rotate-90 tracking-widest opacity-40 hidden lg:block"
          aria-hidden
        >
          // status: 404 not_found
        </div>

        {inlineCard}
      </div>
    </>
  )
}

export default NotFoundPage

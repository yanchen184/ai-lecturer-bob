import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { themes } from '../themes/registry';

const StyleShowcase = () => {
  useEffect(() => {
    document.body.className = '';
    document.body.style.background = '#0A0A0F';
    return () => { document.body.style.background = ''; };
  }, []);

  return (
    <>
      <Helmet>
        <title>風格展示 | 程式講師陳彥彤 — AI 講師個人形象網站</title>
        <meta name="description" content="程式講師陳彥彤的個人形象網站風格展示，包含 6 種不同設計風格：AI-Native UI、Bento Box Grid、Bold Typography、Swiss Modernism、Aurora UI、Liquid Glass。" />
        <meta property="og:title" content="風格展示 | 程式講師陳彥彤" />
        <meta property="og:description" content="6 種設計風格展示 — 從霓虹科技到液態玻璃，探索不同的設計語言" />
        <link rel="canonical" href="https://yanchen184.github.io/ai-lecturer-bob/" />
      </Helmet>

      <div className="min-h-screen text-white" style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #12121F 50%, #0A0A0F 100%)' }}>
        {/* Header */}
        <header className="pt-16 pb-12 px-6 text-center">
          <p className="text-sm font-mono tracking-widest uppercase text-gray-400 mb-4">
            Design Showcase
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="block text-white">AI 講師陳彥彤</span>
            <span
              className="block mt-2 bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #00D2FF, #7A5FFF, #FF6B9D)' }}
            >
              個人形象網站風格展示
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            同一份內容，六種截然不同的設計語言。
            <br className="hidden md:block" />
            點擊任一風格卡片，體驗完整的頁面呈現。
          </p>
        </header>

        {/* Theme Grid */}
        <main className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme, index) => (
              <Link
                key={theme.id}
                to={theme.path}
                className="group block rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Gradient Preview */}
                <div
                  className="h-48 relative overflow-hidden"
                  style={{ background: theme.gradient }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 70%)',
                    }}
                  />
                  {/* Style number */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-sm font-bold text-white/80">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-2 group-hover:text-gray-100 transition-colors">
                    {theme.name}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    {theme.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-500 tracking-wide">
                      {theme.preview}
                    </span>
                    <span className="text-sm text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                      查看風格 &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="pb-12 text-center">
          <p className="text-gray-500 text-sm">
            Built with React + TypeScript + Tailwind CSS
          </p>
        </footer>
      </div>
    </>
  );
};

export default StyleShowcase;

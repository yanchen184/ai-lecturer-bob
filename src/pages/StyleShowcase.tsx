import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { themes } from '../themes/registry';

const StyleShowcase = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    document.body.className = '';
    document.body.style.background = '#08080F';
    return () => { document.body.style.background = ''; };
  }, []);

  return (
    <>
      <Helmet>
        <title>AI講師陳彥彤YC — 風格武器庫</title>
        <meta name="description" content="AI講師陳彥彤YC — 6 種設計風格一鍵切換，展現 UI/UX 設計的無限可能。" />
      </Helmet>

      <div className="min-h-screen text-white relative overflow-hidden" style={{ background: '#08080F' }}>
        {/* Ambient background glow */}
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute w-[800px] h-[800px] rounded-full opacity-[0.07] transition-all duration-1000 blur-[120px]"
            style={{
              background: hoveredIndex !== null ? themes[hoveredIndex].gradient : 'radial-gradient(circle, #7A5FFF, transparent)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        {/* Header */}
        <header className="relative pt-20 pb-16 px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-mono tracking-widest uppercase text-gray-400">6 STYLES • POWERED BY UUPM</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.9] tracking-tight">
            <span className="block text-white/90">DESIGN</span>
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #00D2FF, #7A5FFF, #FF6B9D, #FFEB3B)' }}
            >
              ARSENAL
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            同一位講師，六種截然不同的視覺風格。
            <br />
            每一種都是完整的設計系統。
          </p>
        </header>

        {/* Theme Grid */}
        <main className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {themes.map((theme, index) => (
              <Link
                key={theme.id}
                to={theme.path}
                className="group block rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.04] hover:-translate-y-2"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: hoveredIndex === index ? `0 20px 60px -15px ${getThemeGlow(theme.id)}` : 'none',
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Gradient Preview */}
                <div
                  className="h-52 relative overflow-hidden"
                  style={{ background: theme.gradient }}
                >
                  {/* Animated shimmer */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.05) 55%, transparent 60%)',
                      backgroundSize: '200% 100%',
                      animation: hoveredIndex === index ? 'shimmer 1.5s ease-in-out' : 'none',
                    }}
                  />

                  {/* Number badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-mono font-bold text-white/80 tracking-wider">
                    #{String(index + 1).padStart(2, '0')}
                  </div>

                  {/* Arrow on hover */}
                  <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        background: getThemeColor(theme.id),
                        boxShadow: `0 0 10px ${getThemeColor(theme.id)}60`,
                      }}
                    />
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {theme.name}
                    </h2>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                    {theme.description}
                  </p>
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-[11px] font-mono text-gray-600 tracking-wide uppercase">
                      {theme.preview}
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-white transition-colors duration-300 font-medium">
                      體驗風格 →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="pb-16 text-center">
          <p className="text-gray-600 text-xs font-mono tracking-wider">
            BUILT WITH REACT • TYPESCRIPT • TAILWIND CSS • UUPM DESIGN SYSTEM
          </p>
        </footer>

        {/* Shimmer animation */}
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    </>
  );
};

function getThemeColor(id: string): string {
  const colors: Record<string, string> = {
    'ai-native': '#00FFFF',
    'bento-box': '#007AFF',
    'bold-typography': '#667EEA',
    'swiss-modernism': '#FFEB3B',
    'aurora': '#00D2FF',
    'liquid-glass': '#AF52DE',
  };
  return colors[id] || '#888';
}

function getThemeGlow(id: string): string {
  const glows: Record<string, string> = {
    'ai-native': 'rgba(0,255,255,0.2)',
    'bento-box': 'rgba(0,122,255,0.2)',
    'bold-typography': 'rgba(102,126,234,0.2)',
    'swiss-modernism': 'rgba(255,235,59,0.2)',
    'aurora': 'rgba(0,210,255,0.2)',
    'liquid-glass': 'rgba(175,82,222,0.2)',
  };
  return glows[id] || 'rgba(136,136,136,0.2)';
}

export default StyleShowcase;

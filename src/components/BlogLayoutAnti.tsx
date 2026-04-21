import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useState } from 'react';

/** Anti (liquid-glass) styled layout for /blog* routes.
 *  Paper-white background, dashed kraft-brown borders, Georgia serif body —
 *  tuned for long-form reading (no noise texture, softer hover rotations). */
const BlogLayoutAnti = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: '關於我', section: 'about' },
    { label: '技能', section: 'skills' },
    { label: '課程', section: 'courses' },
    { label: '聯繫我', section: 'contact' },
  ];

  const goToSection = (section: string) => {
    setMenuOpen(false);
    navigate('/', { state: { scrollTo: section } });
  };

  const isOnBlogList = location.pathname === '/blog';

  const navBtnBase =
    'px-3 py-1.5 text-xs tracking-wider transition-all duration-150';
  const navBtnIdle =
    'border border-transparent hover:border-[#C4A77D] hover:bg-[#FFF8DC]';
  const navBtnActive =
    'border border-[#C4A77D] bg-[#FFE066]';

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#FAFAF8',
        color: '#1A1A1A',
        fontFamily: "Georgia, 'Noto Sans TC', 'Times New Roman', serif",
        lineHeight: 1.75,
      }}
    >
      {/* Navbar — paper with dashed bottom line */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(250, 250, 248, 0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px dashed #C4A77D',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span
              className="inline-block w-7 h-7 flex items-center justify-center text-sm"
              style={{
                background: '#FFE066',
                border: '1px dashed #1A1A1A',
                fontFamily: 'Georgia, serif',
                fontWeight: 700,
                transition: 'transform 150ms',
              }}
            >
              陳
            </span>
            <span
              className="tracking-tight text-sm"
              style={{
                fontFamily: "'Courier Prime', 'Courier New', monospace",
                letterSpacing: '0.05em',
              }}
            >
              ai.lecturer / notes
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.section}
                onClick={() => goToSection(item.section)}
                className={`${navBtnBase} ${navBtnIdle}`}
                style={{ fontFamily: "'Courier Prime', monospace" }}
              >
                {item.label}
              </button>
            ))}
            <Link
              to="/blog"
              className={`${navBtnBase} ${isOnBlogList ? navBtnActive : 'border border-[#C4A77D] hover:bg-[#FFF8DC]'}`}
              style={{ fontFamily: "'Courier Prime', monospace" }}
            >
              部落格
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 hover:bg-[#FFF8DC] transition-colors"
            style={{ border: '1px dashed #C4A77D' }}
            aria-label="切換選單"
            aria-expanded={menuOpen}
          >
            <span className="block w-5 h-px mb-1" style={{ background: '#1A1A1A' }} />
            <span className="block w-5 h-px mb-1" style={{ background: '#1A1A1A' }} />
            <span className="block w-5 h-px" style={{ background: '#1A1A1A' }} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden"
            style={{
              background: '#FAFAF8',
              borderTop: '1px dashed #C4A77D',
            }}
          >
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => goToSection(item.section)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#FFF8DC] transition-colors"
                  style={{
                    border: '1px dashed transparent',
                    fontFamily: "'Courier Prime', monospace",
                  }}
                >
                  → {item.label}
                </button>
              ))}
              <Link
                to="/blog"
                onClick={() => setMenuOpen(false)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${isOnBlogList ? 'bg-[#FFE066]' : 'hover:bg-[#FFF8DC]'}`}
                style={{
                  border: '1px dashed #C4A77D',
                  fontFamily: "'Courier Prime', monospace",
                }}
              >
                → 部落格
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="pt-14">{children}</main>

      {/* Footer — warm paper with dashed top */}
      <footer
        className="mt-16"
        style={{
          background: '#FFF8DC',
          color: '#1A1A1A',
          borderTop: '1px dashed #C4A77D',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div
                className="text-xs tracking-widest mb-2"
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  color: '#4A4A4A',
                }}
              >
                ai.lecturer — 陳彥彤
              </div>
              <div className="text-base" style={{ fontFamily: 'Georgia, serif' }}>
                後端工程師 · 技術講師 · 筆記作者
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <a
                href="https://github.com/yanchen184"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 hover:bg-[#FFE066] transition-colors tracking-wider"
                style={{
                  border: '1px dashed #C4A77D',
                  fontFamily: "'Courier Prime', monospace",
                }}
              >
                GitHub
              </a>
              <a
                href="/rss.xml"
                className="px-3 py-1.5 hover:bg-[#FFE066] transition-colors tracking-wider"
                style={{
                  border: '1px dashed #C4A77D',
                  fontFamily: "'Courier Prime', monospace",
                }}
              >
                RSS
              </a>
              <button
                onClick={() => goToSection('contact')}
                className="px-3 py-1.5 hover:bg-[#FFE066] transition-colors tracking-wider"
                style={{
                  border: '1px dashed #C4A77D',
                  fontFamily: "'Courier Prime', monospace",
                }}
              >
                聯繫
              </button>
            </div>
          </div>
          <div
            className="text-[11px] mt-6 tracking-widest"
            style={{
              fontFamily: "'Courier Prime', monospace",
              color: '#4A4A4A',
            }}
          >
            © {new Date().getFullYear()} · handwritten between commits
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogLayoutAnti;

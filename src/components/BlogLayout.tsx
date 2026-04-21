import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useState } from 'react';

/** Neubrutalism-styled layout exclusively for /blog* routes.
 *  Keeps visual consistency with the swiss-modernism home theme. */
const BlogLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: '關於我', section: 'about' },
    { label: '技能', section: 'skills' },
    { label: '課程', section: 'courses' },
    { label: '聯繫我', section: 'contact' },
  ];

  // Cross-route section jump: push scroll target via location state,
  // ThemePage picks it up via useScrollToSection.
  const goToSection = (section: string) => {
    setMenuOpen(false);
    navigate('/', { state: { scrollTo: section } });
  };

  const isOnBlogList = location.pathname === '/blog';

  return (
    <div
      className="min-h-screen font-mono"
      style={{ background: '#fafaf7', color: '#0a0a0a' }}
    >
      {/* Navbar — fixed, paper + thick border */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b-2 border-black"
        style={{ background: '#fafaf7' }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span
              className="inline-block w-7 h-7 flex items-center justify-center text-sm font-black"
              style={{ background: '#ffff00', border: '2px solid #000' }}
            >
              陳
            </span>
            <span className="font-black tracking-tight text-sm uppercase">
              AI.Lecturer
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.section}
                onClick={() => goToSection(item.section)}
                className="px-3 py-1.5 text-xs uppercase tracking-wider border-2 border-transparent hover:border-black hover:bg-[#ffff00] transition-colors"
              >
                {item.label}
              </button>
            ))}
            <Link
              to="/blog"
              className={`px-3 py-1.5 text-xs uppercase tracking-wider border-2 border-black transition-colors ${
                isOnBlogList ? 'bg-black text-white' : 'hover:bg-[#ffff00]'
              }`}
            >
              部落格
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 border-2 border-black hover:bg-[#ffff00] transition-colors"
            aria-label="切換選單"
            aria-expanded={menuOpen}
          >
            <span className="block w-5 h-0.5 bg-black mb-1" />
            <span className="block w-5 h-0.5 bg-black mb-1" />
            <span className="block w-5 h-0.5 bg-black" />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t-2 border-black" style={{ background: '#fafaf7' }}>
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => goToSection(item.section)}
                  className="w-full text-left px-3 py-2 text-sm border-2 border-transparent hover:border-black hover:bg-[#ffff00]"
                >
                  → {item.label}
                </button>
              ))}
              <Link
                to="/blog"
                onClick={() => setMenuOpen(false)}
                className={`w-full text-left px-3 py-2 text-sm border-2 border-black ${
                  isOnBlogList ? 'bg-black text-white' : 'hover:bg-[#ffff00]'
                }`}
              >
                → 部落格
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="pt-14">{children}</main>

      {/* Footer */}
      <footer className="border-t-2 border-black mt-16" style={{ background: '#0a0a0a', color: '#fafaf7' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest opacity-60 mb-1">
                AI.Lecturer / 陳彥彤
              </div>
              <div className="text-sm">
                後端工程師 · 技術講師 · 部落格作者
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <a
                href="https://github.com/yanchen184"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 border-2 border-white hover:bg-[#ffff00] hover:text-black transition-colors uppercase tracking-wider"
              >
                GitHub
              </a>
              <a
                href="/rss.xml"
                className="px-3 py-1.5 border-2 border-white hover:bg-[#ffff00] hover:text-black transition-colors uppercase tracking-wider"
              >
                RSS
              </a>
              <button
                onClick={() => goToSection('contact')}
                className="px-3 py-1.5 border-2 border-white hover:bg-[#ffff00] hover:text-black transition-colors uppercase tracking-wider"
              >
                聯繫
              </button>
            </div>
          </div>
          <div className="text-[11px] opacity-40 mt-4 uppercase tracking-widest">
            © {new Date().getFullYear()} · Made with too much caffeine
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogLayout;

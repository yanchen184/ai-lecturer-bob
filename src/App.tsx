import { useEffect, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BlogLayout from './components/BlogLayout';
import HomePage from './pages/HomePage';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import AdminPage from './pages/AdminPage';
import StyleShowcase from './pages/StyleShowcase';
import StyleSwitcher from './components/StyleSwitcher';
import { themes } from './themes/registry';
import { trackVisitor } from './firebase';

const VERSION = '2.0.0';

/** Resolve which theme is active for the current path */
function resolveCurrentTheme(pathname: string): string | null {
  if (pathname === '/') return 'swiss-modernism';
  const matched = themes.find(t => pathname === t.path);
  return matched ? matched.id : null;
}

function App() {
  const location = useLocation();

  useEffect(() => {
    console.log(
      `%c AI講師陳彥彤 個人網站 v${VERSION}`,
      'color: #00FF88; font-size: 16px; font-weight: bold;'
    );
    console.log('%c 技術棧: React + TypeScript + Tailwind CSS', 'color: #7B61FF;');
    trackVisitor();
  }, []);

  useEffect(() => {
    if (location.hash && (location.pathname === '/' || location.pathname.startsWith('/style/'))) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location]);

  // Admin page - standalone layout
  if (location.pathname === '/admin') {
    return (
      <HelmetProvider>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </HelmetProvider>
    );
  }

  // Style theme pages (including `/` as default AI-Native)
  const currentThemeId = resolveCurrentTheme(location.pathname);
  if (currentThemeId) {
    const themeEntry = themes.find(t => t.id === currentThemeId)!;

    return (
      <HelmetProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
            <div className="text-white text-lg">載入中...</div>
          </div>
        }>
          <StyleSwitcher currentTheme={currentThemeId} />
          <Routes>
            {/* `/` renders the AI-Native ThemePage */}
            <Route path="/" element={<themeEntry.loader />} />
            {themes.map(theme => (
              <Route
                key={theme.id}
                path={theme.path}
                element={<theme.loader />}
              />
            ))}
          </Routes>
        </Suspense>
      </HelmetProvider>
    );
  }

  // Style showcase gallery (optional, kept at /styles)
  if (location.pathname === '/styles') {
    return (
      <HelmetProvider>
        <Routes>
          <Route path="/styles" element={<StyleShowcase />} />
        </Routes>
      </HelmetProvider>
    );
  }

  // Blog routes — Neubrutalism layout (paper bg + thick borders)
  if (location.pathname.startsWith('/blog')) {
    return (
      <HelmetProvider>
        <BlogLayout>
          <Routes>
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </BlogLayout>
      </HelmetProvider>
    );
  }

  // Default layout (any leftover routes like /home)
  return (
    <HelmetProvider>
      <div className="gradient-bg min-h-screen text-white">
        <Navbar />
        <Routes>
          <Route path="/home" element={<HomePage />} />
        </Routes>
        <Footer />
      </div>
    </HelmetProvider>
  );
}

export default App;

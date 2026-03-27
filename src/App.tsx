import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import AdminPage from './pages/AdminPage';
import { trackVisitor } from './firebase';

const VERSION = '1.5.0';

function App() {
  const location = useLocation();

  useEffect(() => {
    console.log(
      `%c AI講師陳彥彤 個人網站 v${VERSION}`,
      'color: #007AFF; font-size: 16px; font-weight: bold;'
    );
    console.log('%c 技術棧: React + TypeScript + Tailwind CSS', 'color: #AF52DE;');
    trackVisitor();
  }, []);

  // Scroll to top on route change, handle hash for sections
  useEffect(() => {
    if (location.hash && location.pathname === '/') {
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

  // Admin 頁面用獨立 layout
  if (location.pathname === '/admin') {
    return (
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    );
  }

  return (
    <div className="gradient-bg min-h-screen text-white relative overflow-hidden">
      {/* Ambient light blobs for Liquid Glass refraction effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/[0.07] rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-accent-400/[0.06] rounded-full blur-[100px] animate-blob" style={{ animationDelay: '-3s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-primary-300/[0.05] rounded-full blur-[100px] animate-blob" style={{ animationDelay: '-6s' }} />
      </div>

      <div className="relative z-10">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
        <Footer />
      </div>
    </div>
  );
}

export default App;

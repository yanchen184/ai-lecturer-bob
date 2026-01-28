import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';

const VERSION = '1.1.0';

function App() {
  const location = useLocation();

  useEffect(() => {
    console.log(
      `%c AI講師陳彥彤 個人網站 v${VERSION}`,
      'color: #0ea5e9; font-size: 16px; font-weight: bold;'
    );
    console.log('%c 技術棧: React + TypeScript + Tailwind CSS', 'color: #d946ef;');
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

  return (
    <div className="gradient-bg min-h-screen text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;

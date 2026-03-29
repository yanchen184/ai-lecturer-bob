import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from './Navbar';
import Hero from './Hero';
import About from './About';
import Skills from './Skills';
import Courses from './Courses';
import Contact from './Contact';
import Portfolio from '../../sections/Portfolio';
import Testimonials from '../../sections/Testimonials';
import MessageBoard from '../../sections/MessageBoard';
import Footer from './Footer';
import './theme.css';

const ThemePage = () => {
  useEffect(() => {
    document.body.className = 'theme-bold-typography';
    return () => { document.body.className = ''; };
  }, []);

  return (
    <>
      <Helmet>
        <title>Bold Typography 風格 | 程式講師陳彥彤 — AI 講師個人形象網站</title>
        <meta name="description" content="Bold Typography 風格展示 — 超大粗體排版，海報級視覺衝擊力。程式講師陳彥彤的個人形象網站風格之一。" />
        <meta property="og:title" content="Bold Typography 風格 | 程式講師陳彥彤" />
        <meta property="og:description" content="超大粗體排版，海報級視覺衝擊力" />
        <link rel="canonical" href="https://yanchen184.github.io/ai-lecturer-bob/style/bold-typography" />
      </Helmet>
      <div className="theme-bold-typography-wrapper">
        <Navbar />
        <Hero />
        <About />
        <Courses />
        <Skills />
        <Portfolio />
        <Testimonials />
        <Contact />
        <MessageBoard />
        <Footer />
      </div>
    </>
  );
};

export default ThemePage;

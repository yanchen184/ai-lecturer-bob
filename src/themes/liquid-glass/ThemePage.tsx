import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from './Navbar';
import Hero from './Hero';
import About from './About';
import Skills from './Skills';
import Courses from './Courses';
import Contact from './Contact';
import Footer from './Footer';
import './theme.css';

const ThemePage = () => {
  useEffect(() => {
    document.body.className = 'theme-liquid-glass';
    return () => { document.body.className = ''; };
  }, []);

  return (
    <>
      <Helmet>
        <title>Liquid Glass 風格 | 程式講師陳彥彤 — AI 講師個人形象網站</title>
        <meta name="description" content="Liquid Glass 風格展示 — Apple 最新設計語言，液態玻璃質感。程式講師陳彥彤的個人形象網站風格之一。" />
        <meta property="og:title" content="Liquid Glass 風格 | 程式講師陳彥彤" />
        <meta property="og:description" content="Apple 最新設計語言，液態玻璃質感" />
        <link rel="canonical" href="https://yanchen184.github.io/ai-lecturer-bob/style/liquid-glass" />
      </Helmet>
      <div className="theme-liquid-glass-wrapper">
        <Navbar />
        <Hero />
        <Skills />
        <Courses />
        <About />
        <Contact />
        <Footer />
      </div>
    </>
  );
};

export default ThemePage;

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
    document.body.className = 'theme-swiss-modernism';
    return () => { document.body.className = ''; };
  }, []);

  return (
    <>
      <Helmet>
        <title>Swiss Modernism 2.0 風格 | 程式講師陳彥彤 — AI 講師個人形象網站</title>
        <meta name="description" content="Swiss Modernism 2.0 風格展示 — 瑞士國際主義設計，極致理性與秩序感。程式講師陳彥彤的個人形象網站風格之一。" />
        <meta property="og:title" content="Swiss Modernism 2.0 風格 | 程式講師陳彥彤" />
        <meta property="og:description" content="瑞士國際主義設計，極致理性與秩序感" />
        <link rel="canonical" href="https://yanchen184.github.io/ai-lecturer-bob/style/swiss-modernism" />
      </Helmet>
      <div className="theme-swiss-modernism-wrapper">
        <Navbar />
        <Hero />
        <About />
        <Skills />
        <Courses />
        <Contact />
        <Footer />
      </div>
    </>
  );
};

export default ThemePage;

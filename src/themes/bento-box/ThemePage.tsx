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
    document.body.className = 'theme-bento-box';
    return () => { document.body.className = ''; };
  }, []);

  return (
    <>
      <Helmet>
        <title>Bento Box Grid 風格 | 程式講師陳彥彤 — AI 講師個人形象網站</title>
        <meta name="description" content="Bento Box Grid 風格展示 — Apple 風格便當格佈局，現代感資訊展示。程式講師陳彥彤的個人形象網站風格之一。" />
        <meta property="og:title" content="Bento Box Grid 風格 | 程式講師陳彥彤" />
        <meta property="og:description" content="Apple 風格便當格佈局，現代感資訊展示" />
        <link rel="canonical" href="https://yanchen184.github.io/ai-lecturer-bob/style/bento-box" />
      </Helmet>
      <div className="theme-bento-box-wrapper">
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

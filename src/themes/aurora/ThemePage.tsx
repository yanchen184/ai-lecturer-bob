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
    document.body.className = 'theme-aurora';
    return () => { document.body.className = ''; };
  }, []);

  return (
    <>
      <Helmet>
        <title>Aurora UI 風格 | 程式講師陳彥彤 — AI 講師個人形象網站</title>
        <meta name="description" content="Aurora UI 風格展示 — 極光般的漸層色彩，夢幻與優雅並存。程式講師陳彥彤的個人形象網站風格之一。" />
        <meta property="og:title" content="Aurora UI 風格 | 程式講師陳彥彤" />
        <meta property="og:description" content="極光般的漸層色彩，夢幻與優雅並存" />
        <link rel="canonical" href="https://yanchen184.github.io/ai-lecturer-bob/style/aurora" />
      </Helmet>
      <div className="theme-aurora-wrapper">
        <Navbar />
        <Hero />
        <Courses />
        <About />
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

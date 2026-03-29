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
    document.body.className = 'theme-ai-native';
    return () => { document.body.className = ''; };
  }, []);

  return (
    <>
      <Helmet>
        <title>AI-Native UI 風格 | 程式講師陳彥彤 — AI 講師個人形象網站</title>
        <meta name="description" content="AI-Native UI 風格展示 — 未來感科技介面，霓虹漸層搭配神經網路粒子效果。程式講師陳彥彤的個人形象網站風格之一。" />
        <meta property="og:title" content="AI-Native UI 風格 | 程式講師陳彥彤" />
        <meta property="og:description" content="未來感科技介面，霓虹漸層搭配神經網路粒子效果" />
        <link rel="canonical" href="https://yanchen184.github.io/ai-lecturer-bob/style/ai-native" />
      </Helmet>
      <div className="theme-ai-native-wrapper">
        <Navbar />
        <Hero />
        <Skills />
        <About />
        <Courses />
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

import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useScrollToSection } from '../../hooks/useScrollToSection';
import Navbar from './Navbar';
import Hero from './Hero';
import About from './About';
import Skills from './Skills';
import Courses from './Courses';
import Contact from './Contact';
import Portfolio from '../../sections/Portfolio';
import Testimonials from '../../sections/Testimonials';
import MessageBoard from '../../sections/MessageBoard';
import LatestPosts from '../../components/LatestPosts';
import ThemeShowcase from '../../components/ThemeShowcase';
import Footer from './Footer';
import './theme.css';

const ThemePage = () => {
  useScrollToSection();

  useEffect(() => {
    document.body.className = 'theme-liquid-glass';
    return () => { document.body.className = ''; };
  }, []);

  return (
    <>
      <Helmet>
        <title>AI講師陳彥彤YC — 個人形象網站</title>
        <meta name="description" content="AI講師陳彥彤YC — 資深後端工程師，專精 Spring Boot、React、全端開發教學。" />
        <meta property="og:title" content="AI講師陳彥彤YC" />
        <meta property="og:description" content="資深後端工程師 / 技術講師" />
      </Helmet>
      <div className="theme-liquid-glass-wrapper">
        <Navbar />
        <Hero />
        <About />
        <LatestPosts />
        <Skills />
        <Courses />
        <Portfolio />
        <Testimonials />
        <Contact />
        <MessageBoard />
        <ThemeShowcase />
        <Footer />
      </div>
    </>
  );
};

export default ThemePage;

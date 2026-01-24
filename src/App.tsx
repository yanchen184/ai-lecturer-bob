import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './sections/Hero';
import About from './sections/About';
import Skills from './sections/Skills';
import Courses from './sections/Courses';
import Portfolio from './sections/Portfolio';
import Testimonials from './sections/Testimonials';
import Contact from './sections/Contact';
import Footer from './components/Footer';

const VERSION = '1.0.0';

function App() {
  useEffect(() => {
    console.log(`%c AI講師陳彥彤 個人網站 v${VERSION}`, 'color: #0ea5e9; font-size: 16px; font-weight: bold;');
    console.log('%c 技術棧: React + TypeScript + Tailwind CSS', 'color: #d946ef;');
  }, []);

  return (
    <div className="gradient-bg min-h-screen text-white">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Courses />
        <Portfolio />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;

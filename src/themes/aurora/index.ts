import Hero from './Hero';
import About from './About';
import Skills from './Skills';
import Courses from './Courses';
import Contact from './Contact';
import Navbar from './Navbar';
import Footer from './Footer';
import './theme.css';

export const theme = {
  id: 'aurora',
  name: 'Parallax Storytelling',
  description: '電影級敘事風格，沉浸式滾動體驗，深邃海軍藍配緋紅點綴',
  preview: '深色 . 敘事 . 電影感',
  bodyClass: 'theme-aurora',
  components: { Hero, About, Skills, Courses, Contact, Navbar, Footer },
};

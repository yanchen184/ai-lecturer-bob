import Hero from './Hero';
import About from './About';
import Skills from './Skills';
import Courses from './Courses';
import Contact from './Contact';
import Navbar from './Navbar';
import Footer from './Footer';
import './theme.css';

export const theme = {
  id: 'liquid-glass',
  name: 'Liquid Glass',
  description: 'Apple 最新設計語言，液態玻璃質感',
  preview: '深色 . 玻璃 . 光澤',
  bodyClass: 'theme-liquid-glass',
  components: { Hero, About, Skills, Courses, Contact, Navbar, Footer },
};

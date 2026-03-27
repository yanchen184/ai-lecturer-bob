import Hero from './Hero';
import About from './About';
import Skills from './Skills';
import Courses from './Courses';
import Contact from './Contact';
import Navbar from './Navbar';
import Footer from './Footer';
import './theme.css';

export const theme = {
  id: 'swiss-modernism',
  name: 'Swiss Modernism 2.0',
  description: '瑞士國際主義設計，極致理性與秩序感',
  preview: '亮色 . 極簡 . 網格系統',
  bodyClass: 'theme-swiss-modernism',
  components: { Hero, About, Skills, Courses, Contact, Navbar, Footer },
};

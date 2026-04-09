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
  name: 'Anti-Polish Raw',
  description: '設計師速寫本風格，手繪感美學',
  preview: '紙白 . 手繪 . 素描',
  bodyClass: 'theme-liquid-glass',
  components: { Hero, About, Skills, Courses, Contact, Navbar, Footer },
};

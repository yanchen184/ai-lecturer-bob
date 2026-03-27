import Hero from './Hero';
import About from './About';
import Skills from './Skills';
import Courses from './Courses';
import Contact from './Contact';
import Navbar from './Navbar';
import Footer from './Footer';
import './theme.css';

export const theme = {
  id: 'bold-typography',
  name: 'Bold Typography',
  description: '超大粗體排版，海報級視覺衝擊力',
  preview: '深色 . 大字 . 海報風',
  bodyClass: 'theme-bold-typography',
  components: { Hero, About, Skills, Courses, Contact, Navbar, Footer },
};

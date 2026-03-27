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
  name: 'Aurora UI',
  description: '極光般的漸層色彩，夢幻與優雅並存',
  preview: '深色 . 極光 . 漸層',
  bodyClass: 'theme-aurora',
  components: { Hero, About, Skills, Courses, Contact, Navbar, Footer },
};

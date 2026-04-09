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
  name: 'Neubrutalism',
  description: '新粗獷主義設計，大膽色彩與硬邊陰影',
  preview: '亮色 . 粗框 . 硬陰影',
  bodyClass: 'theme-swiss-modernism',
  components: { Hero, About, Skills, Courses, Contact, Navbar, Footer },
};

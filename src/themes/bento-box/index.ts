import Hero from './Hero';
import About from './About';
import Skills from './Skills';
import Courses from './Courses';
import Contact from './Contact';
import Navbar from './Navbar';
import Footer from './Footer';
import './theme.css';

export const theme = {
  id: 'bento-box',
  name: 'Bento Box Grid',
  description: 'Apple 風格便當格佈局，現代感資訊展示',
  preview: '亮色 . 圓角 . Apple 風格',
  bodyClass: 'theme-bento-box',
  components: { Hero, About, Skills, Courses, Contact, Navbar, Footer },
};

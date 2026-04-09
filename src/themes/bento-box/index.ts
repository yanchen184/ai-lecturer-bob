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
  name: 'Nature Distilled',
  description: '溫暖有機的手作質感，靈感來自 Aesop、Kinfolk 與日式侘寂美學',
  preview: '暖色 . 手感 . 侘寂風格',
  bodyClass: 'theme-bento-box',
  components: { Hero, About, Skills, Courses, Contact, Navbar, Footer },
};

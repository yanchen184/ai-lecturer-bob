import Hero from './Hero';
import About from './About';
import Skills from './Skills';
import Courses from './Courses';
import Contact from './Contact';
import Navbar from './Navbar';
import Footer from './Footer';
import './theme.css';

export const theme = {
  id: 'ai-native',
  name: 'AI-Native UI',
  description: '未來感科技介面，霓虹漸層搭配神經網路粒子效果',
  preview: '深色 . 霓虹 . 科技感',
  bodyClass: 'theme-ai-native',
  components: { Hero, About, Skills, Courses, Contact, Navbar, Footer },
};

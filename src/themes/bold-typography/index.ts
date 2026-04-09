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
  name: 'Motion-Driven',
  description: '動態驅動深色主題，Stripe/Linear 風格的流暢動效',
  preview: '深色 . 動效 . 高對比',
  bodyClass: 'theme-bold-typography',
  components: { Hero, About, Skills, Courses, Contact, Navbar, Footer },
};

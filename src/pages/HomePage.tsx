import Hero from '../sections/Hero';
import About from '../sections/About';
import Skills from '../sections/Skills';
import Courses from '../sections/Courses';
import Portfolio from '../sections/Portfolio';
import Testimonials from '../sections/Testimonials';
import Contact from '../sections/Contact';

const HomePage = () => {
  return (
    <main>
      <Hero />
      <About />
      <Skills />
      <Courses />
      <Portfolio />
      <Testimonials />
      <Contact />
    </main>
  );
};

export default HomePage;

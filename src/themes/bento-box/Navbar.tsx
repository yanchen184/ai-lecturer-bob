import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

const homeNavItems = [
  { label: '關於我', href: '#about' },
  { label: '技能', href: '#skills' },
  { label: '課程', href: '#courses' },
  { label: '作品集', href: '#portfolio' },
  { label: '學員回饋', href: '#testimonials' },
  { label: '留言板', href: '#messages' },
  { label: '聯繫我', href: '#contact' },
] as const;

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateActiveSection = useCallback(() => {
    if (!isHomePage) return;
    const sectionIds = homeNavItems.map((item) => item.href.replace('#', ''));
    const observers: IntersectionObserver[] = [];
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveSection(id);
          });
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );
      observer.observe(element);
      observers.push(observer);
    });
    return () => { observers.forEach((obs) => obs.disconnect()); };
  }, [isHomePage]);

  useEffect(() => {
    const cleanup = updateActiveSection();
    return () => cleanup?.();
  }, [updateActiveSection]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleHomeNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const sectionId = href.replace('#', '');
    if (isHomePage) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.assign(`/#${sectionId}`);
    }
    setIsMobileMenuOpen(false);
  };

  const isActive = (href: string) => isHomePage && activeSection === href.replace('#', '');

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || !isHomePage
            ? 'bg-white/80 backdrop-blur-xl shadow-bento'
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="主要導覽"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            <Link to="/" className="flex items-center space-x-2 group flex-shrink-0" aria-label="回到首頁">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary-500/20 transition-shadow duration-300">
                <span className="text-white font-bold text-lg">陳</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold gradient-text">AI講師</span>
                <span className="text-bento-text ml-1 text-sm">陳彥彤</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center space-x-0.5">
              {homeNavItems.map((item) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className={`relative px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-bento-text bg-bento-card font-medium'
                      : 'text-bento-text-secondary hover:text-bento-text hover:bg-bento-card'
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" />
                  )}
                </a>
              ))}
              <Link
                to="/blog"
                className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                  location.pathname.startsWith('/blog')
                    ? 'text-bento-text bg-bento-card font-medium'
                    : 'text-bento-text-secondary hover:text-bento-text hover:bg-bento-card'
                }`}
              >
                部落格
              </Link>
              <Link
                to="/#contact"
                className="ml-3 px-5 py-2 text-sm bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-full hover:shadow-lg hover:shadow-primary-500/20 hover:scale-105 transition-all duration-300"
              >
                預約諮詢
              </Link>
            </div>

            <button
              className="lg:hidden relative w-10 h-10 flex items-center justify-center text-bento-text-secondary hover:text-bento-text rounded-full hover:bg-bento-card transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="切換選單"
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 scale-0' : ''}`} />
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      <div className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className={`absolute top-0 right-0 w-72 h-full bg-white/95 backdrop-blur-xl border-l border-bento-border transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full pt-20 pb-8 px-6">
            <div className="flex-1 space-y-1">
              {homeNavItems.map((item, index) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className={`flex items-center px-4 py-3 rounded-bento text-base transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-bento-text bg-bento-card font-medium'
                      : 'text-bento-text-secondary hover:text-bento-text hover:bg-bento-card'
                  }`}
                  style={{
                    transitionDelay: isMobileMenuOpen ? `${index * 30}ms` : '0ms',
                    opacity: isMobileMenuOpen ? 1 : 0,
                    transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(20px)',
                  }}
                >
                  {isActive(item.href) && (
                    <span className="w-1 h-5 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full mr-3" />
                  )}
                  {item.label}
                </a>
              ))}
              <Link
                to="/blog"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-bento text-base transition-all duration-200 ${
                  location.pathname.startsWith('/blog')
                    ? 'text-bento-text bg-bento-card font-medium'
                    : 'text-bento-text-secondary hover:text-bento-text hover:bg-bento-card'
                }`}
              >
                部落格
              </Link>
            </div>
            <div className="pt-4 border-t border-bento-border">
              <Link
                to="/#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-bento text-center hover:shadow-lg transition-all duration-300"
              >
                預約諮詢
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;

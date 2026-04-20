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

  const isHomePage = location.pathname === '/' || location.pathname.startsWith('/style/');

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}
        style={{
          backgroundColor: isScrolled || !isHomePage ? 'rgba(245, 240, 225, 0.9)' : 'transparent',
          backdropFilter: isScrolled || !isHomePage ? 'blur(12px)' : 'none',
          boxShadow: isScrolled || !isHomePage ? '0 1px 3px rgba(61,46,28,0.06)' : 'none',
        }}
        role="navigation"
        aria-label="主要導覽"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            <Link to="/" className="flex items-center space-x-2 group flex-shrink-0" aria-label="回到首頁">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center transition-shadow duration-500"
                style={{ backgroundColor: '#C67B5C' }}
              >
                <span className="text-white font-bold text-lg" style={{ fontFamily: 'Georgia, serif' }}>陳</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold" style={{ color: '#C67B5C' }}>AI講師</span>
                <span className="ml-1 text-sm" style={{ color: '#3D2E1C' }}>陳彥彤</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center space-x-0.5">
              {homeNavItems.map((item) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className="relative px-3 py-1.5 text-sm rounded-full transition-all duration-300"
                  style={{
                    color: isActive(item.href) ? '#3D2E1C' : '#6B6255',
                    backgroundColor: isActive(item.href) ? '#FEFDFB' : 'transparent',
                    fontWeight: isActive(item.href) ? 500 : 400,
                  }}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                      style={{ backgroundColor: '#C67B5C' }}
                    />
                  )}
                </a>
              ))}
              <Link
                to="/blog"
                className="px-3 py-1.5 text-sm rounded-full transition-all duration-300"
                style={{
                  color: location.pathname.startsWith('/blog') ? '#3D2E1C' : '#6B6255',
                  backgroundColor: location.pathname.startsWith('/blog') ? '#FEFDFB' : 'transparent',
                  fontWeight: location.pathname.startsWith('/blog') ? 500 : 400,
                }}
              >
                部落格
              </Link>
              <a
                href="#contact"
                onClick={(e) => handleHomeNavClick(e, '#contact')}
                className="ml-3 px-5 py-2 text-sm font-medium rounded-full transition-all duration-500"
                style={{
                  backgroundColor: '#C67B5C',
                  color: '#FEFDFB',
                  boxShadow: '0 2px 8px rgba(198,123,92,0.2)',
                }}
              >
                預約諮詢
              </a>
            </div>

            <button
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-full transition-all"
              style={{ color: '#6B6255' }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="切換選單"
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className="block h-0.5 rounded-full transition-all duration-300 origin-center"
                  style={{ backgroundColor: '#3D2E1C', transform: isMobileMenuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }}
                />
                <span
                  className="block h-0.5 rounded-full transition-all duration-300"
                  style={{ backgroundColor: '#3D2E1C', opacity: isMobileMenuOpen ? 0 : 1, transform: isMobileMenuOpen ? 'scale(0)' : 'none' }}
                />
                <span
                  className="block h-0.5 rounded-full transition-all duration-300 origin-center"
                  style={{ backgroundColor: '#3D2E1C', transform: isMobileMenuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      <div className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: 'rgba(61,46,28,0.15)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 w-72 h-full transition-transform duration-500 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{
            backgroundColor: 'rgba(245, 240, 225, 0.97)',
            backdropFilter: 'blur(16px)',
            borderLeft: '1px solid #D4C4A8',
          }}
        >
          <div className="flex flex-col h-full pt-20 pb-8 px-6">
            <div className="flex-1 space-y-1">
              {homeNavItems.map((item, index) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className="flex items-center px-4 py-3 rounded-bento text-base transition-all duration-300"
                  style={{
                    color: isActive(item.href) ? '#3D2E1C' : '#6B6255',
                    backgroundColor: isActive(item.href) ? '#FEFDFB' : 'transparent',
                    fontWeight: isActive(item.href) ? 500 : 400,
                    transitionDelay: isMobileMenuOpen ? `${index * 30}ms` : '0ms',
                    opacity: isMobileMenuOpen ? 1 : 0,
                    transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(20px)',
                  }}
                >
                  {isActive(item.href) && (
                    <span
                      className="w-1 h-5 rounded-full mr-3"
                      style={{ backgroundColor: '#C67B5C' }}
                    />
                  )}
                  {item.label}
                </a>
              ))}
              <Link
                to="/blog"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 rounded-bento text-base transition-all duration-300"
                style={{
                  color: location.pathname.startsWith('/blog') ? '#3D2E1C' : '#6B6255',
                  backgroundColor: location.pathname.startsWith('/blog') ? '#FEFDFB' : 'transparent',
                  fontWeight: location.pathname.startsWith('/blog') ? 500 : 400,
                }}
              >
                部落格
              </Link>
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid #D4C4A8' }}>
              <a
                href="#contact"
                onClick={(e) => handleHomeNavClick(e, '#contact')}
                className="block w-full py-3 font-medium rounded-bento text-center transition-all duration-500"
                style={{
                  backgroundColor: '#C67B5C',
                  color: '#FEFDFB',
                  boxShadow: '0 2px 8px rgba(198,123,92,0.2)',
                }}
              >
                預約諮詢
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;

import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const HOME_NAV_ITEMS = [
  { label: '關於我', href: '#about' },
  { label: '文章', href: '#latest-posts' },
  { label: '技能', href: '#skills' },
  { label: '課程', href: '#courses' },
  { label: '作品集', href: '#portfolio' },
  { label: '學員回饋', href: '#testimonials' },
  { label: '聯繫我', href: '#contact' },
] as const;

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/' || location.pathname.startsWith('/style/');

  // Track scroll position for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section via IntersectionObserver
  const setupSectionObservers = useCallback(() => {
    if (!isHomePage) return;

    const sectionIds = HOME_NAV_ITEMS.map((item) => item.href.replace('#', ''));
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );
      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [isHomePage]);

  useEffect(() => {
    const cleanup = setupSectionObservers();
    return () => cleanup?.();
  }, [setupSectionObservers]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleHomeNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const sectionId = href.replace('#', '');
    if (isHomePage) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
    setIsMobileMenuOpen(false);
  };

  const isActive = (href: string) => isHomePage && activeSection === href.replace('#', '');

  const navBgStyle = isScrolled || !isHomePage
    ? {
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1F1F1F',
      }
    : { background: 'transparent' };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={navBgStyle}
        role="navigation"
        aria-label="主要導覽"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2 group flex-shrink-0"
              aria-label="回到首頁"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: '#6366F1' }}
              >
                <span className="text-white font-bold text-lg">陳</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold" style={{ color: '#6366F1' }}>
                  AI講師
                </span>
                <span className="text-white ml-1 text-sm font-medium">陳彥彤</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center space-x-1">
              {HOME_NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : '/'}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className={`relative px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                    isActive(item.href) ? 'text-white font-bold' : 'hover:text-white'
                  }`}
                  style={
                    isActive(item.href)
                      ? { borderBottom: '2px solid #6366F1' }
                      : { color: '#9CA3AF' }
                  }
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/blog"
                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                  location.pathname.startsWith('/blog') ? 'text-white font-bold' : 'hover:text-white'
                }`}
                style={
                  location.pathname.startsWith('/blog')
                    ? { borderBottom: '2px solid #6366F1' }
                    : { color: '#9CA3AF' }
                }
              >
                部落格
              </Link>
              <a
                href="#contact"
                onClick={(e) => handleHomeNavClick(e, '#contact')}
                className="ml-4 px-5 py-2 text-sm rounded-lg text-white font-bold transition-all duration-300"
                style={{
                  background: '#6366F1',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.25)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#818CF8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#6366F1';
                }}
              >
                預約諮詢
              </a>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden relative w-10 h-10 flex items-center justify-center transition-colors duration-200"
              style={{ color: '#9CA3AF' }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="切換選單"
              aria-expanded={isMobileMenuOpen}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; }}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className={`block h-0.5 bg-current transition-all duration-200 origin-center ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-current transition-all duration-200 ${
                    isMobileMenuOpen ? 'opacity-0 scale-0' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-current transition-all duration-200 origin-center ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-200 ${
          isMobileMenuOpen ? 'visible' : 'invisible'
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 w-72 h-full transition-transform duration-200 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            background: 'rgba(10,10,10,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderLeft: '1px solid #1F1F1F',
          }}
        >
          <div className="flex flex-col h-full pt-20 pb-8 px-6">
            <div className="flex-1 space-y-0">
              {HOME_NAV_ITEMS.map((item, index) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : '/'}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className="flex items-center px-4 py-3 text-base transition-all duration-200"
                  style={{
                    borderBottom: '1px solid #1F1F1F',
                    transitionDelay: isMobileMenuOpen ? `${index * 30}ms` : '0ms',
                    opacity: isMobileMenuOpen ? 1 : 0,
                    transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(20px)',
                    color: isActive(item.href) ? '#FFFFFF' : '#9CA3AF',
                    fontWeight: isActive(item.href) ? 700 : 400,
                  }}
                >
                  {isActive(item.href) && (
                    <span
                      className="w-2 h-0.5 mr-3 rounded-full"
                      style={{ background: '#6366F1' }}
                    />
                  )}
                  {item.label}
                </a>
              ))}
              <Link
                to="/blog"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 text-base transition-all duration-200"
                style={{
                  borderBottom: '1px solid #1F1F1F',
                  color: location.pathname.startsWith('/blog') ? '#FFFFFF' : '#9CA3AF',
                  fontWeight: location.pathname.startsWith('/blog') ? 700 : 400,
                }}
              >
                部落格
              </Link>
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid #1F1F1F' }}>
              <a
                href="#contact"
                onClick={(e) => handleHomeNavClick(e, '#contact')}
                className="block w-full py-3 rounded-xl text-white font-bold text-center transition-all duration-300"
                style={{ background: '#6366F1' }}
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

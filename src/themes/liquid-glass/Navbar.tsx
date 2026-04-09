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

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active section tracking via IntersectionObserver
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
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        {
          rootMargin: '-20% 0px -60% 0px',
          threshold: 0,
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [isHomePage]);

  useEffect(() => {
    const cleanup = updateActiveSection();
    return () => cleanup?.();
  }, [updateActiveSection]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleHomeNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    const sectionId = href.replace('#', '');

    if (isHomePage) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.assign(`/#${sectionId}`);
    }

    setIsMobileMenuOpen(false);
  };

  const isActive = (href: string) => {
    const sectionId = href.replace('#', '');
    return isHomePage && activeSection === sectionId;
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 ${
          isScrolled || !isHomePage
            ? ''
            : ''
        }`}
        style={{
          background: isScrolled || !isHomePage ? 'var(--paper-white)' : 'transparent',
          borderBottom: isScrolled || !isHomePage ? '1px dashed var(--pencil-grey)' : 'none',
        }}
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
                className="w-9 h-9 flex items-center justify-center sketch-circle"
                style={{ background: 'var(--paper-white)' }}
              >
                <span className="font-bold text-lg" style={{ color: 'var(--marker-black)' }}>陳</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-semibold" style={{ color: 'var(--marker-black)', fontFamily: "'Courier Prime', monospace" }}>
                  AI講師
                </span>
                <span className="ml-1 text-sm" style={{ color: 'var(--pencil-grey)' }}>陳彥彤</span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-0.5">
              {homeNavItems.map((item) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className="relative px-3 py-1.5 text-sm"
                  style={{
                    fontFamily: "'Courier Prime', monospace",
                    color: isActive(item.href) ? 'var(--marker-black)' : 'var(--pencil-grey)',
                    background: isActive(item.href) ? 'var(--marker-yellow)' : 'transparent',
                    fontWeight: isActive(item.href) ? 700 : 400,
                    borderRadius: '2px',
                    transform: isActive(item.href) ? 'rotate(-1deg)' : 'none',
                  }}
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/blog"
                className="px-3 py-1.5 text-sm"
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  color: location.pathname.startsWith('/blog') ? 'var(--marker-black)' : 'var(--pencil-grey)',
                  background: location.pathname.startsWith('/blog') ? 'var(--marker-yellow)' : 'transparent',
                  borderRadius: '2px',
                }}
              >
                部落格
              </Link>
              <Link
                to="/#contact"
                className="ml-3 px-5 py-2 text-sm font-bold"
                style={{
                  border: '2px dotted var(--marker-black)',
                  borderRadius: '2px',
                  color: 'var(--marker-black)',
                  fontFamily: "'Courier Prime', monospace",
                  background: 'transparent',
                }}
              >
                預約諮詢
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden relative w-10 h-10 flex items-center justify-center"
              style={{ color: 'var(--marker-black)' }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="切換選單"
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className={`block h-0.5 rounded-full transition-all duration-300 origin-center ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}
                  style={{ background: 'var(--marker-black)' }}
                />
                <span
                  className={`block h-0.5 rounded-full transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-0 scale-0' : ''
                  }`}
                  style={{ background: 'var(--marker-black)' }}
                />
                <span
                  className={`block h-0.5 rounded-full transition-all duration-300 origin-center ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}
                  style={{ background: 'var(--marker-black)' }}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: 'rgba(250, 250, 248, 0.8)' }}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`absolute top-0 right-0 w-72 h-full transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            background: 'var(--paper-white)',
            borderLeft: '1px dashed var(--pencil-grey)',
          }}
        >
          <div className="flex flex-col h-full pt-20 pb-8 px-6">
            <div className="flex-1 space-y-1">
              {homeNavItems.map((item, index) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className="flex items-center px-4 py-3 text-base"
                  style={{
                    fontFamily: "'Courier Prime', monospace",
                    color: isActive(item.href) ? 'var(--marker-black)' : 'var(--pencil-grey)',
                    background: isActive(item.href) ? 'var(--marker-yellow)' : 'transparent',
                    fontWeight: isActive(item.href) ? 700 : 400,
                    borderRadius: '2px',
                    transitionDelay: isMobileMenuOpen ? `${index * 30}ms` : '0ms',
                    opacity: isMobileMenuOpen ? 1 : 0,
                    transform: isMobileMenuOpen
                      ? isActive(item.href) ? 'rotate(-0.5deg)' : 'translateX(0)'
                      : 'translateX(20px)',
                    transition: 'opacity 0.3s, transform 0.3s',
                  }}
                >
                  {isActive(item.href) && (
                    <span
                      className="w-1 h-5 mr-3"
                      style={{ background: 'var(--kraft-brown)', borderRadius: '1px' }}
                    />
                  )}
                  {item.label}
                </a>
              ))}
              <Link
                to="/blog"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 text-base"
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  color: location.pathname.startsWith('/blog') ? 'var(--marker-black)' : 'var(--pencil-grey)',
                  background: location.pathname.startsWith('/blog') ? 'var(--marker-yellow)' : 'transparent',
                  borderRadius: '2px',
                }}
              >
                部落格
              </Link>
            </div>

            <div className="pt-4" style={{ borderTop: '1px dashed var(--pencil-grey)' }}>
              <Link
                to="/#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 font-bold text-center"
                style={{
                  border: '2px dotted var(--marker-black)',
                  borderRadius: '2px',
                  color: 'var(--marker-black)',
                  fontFamily: "'Courier Prime', monospace",
                  background: 'transparent',
                }}
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

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled || !isHomePage
            ? 'bg-surface-900/70 backdrop-blur-glass-heavy saturate-[180%] border-b border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
            : 'bg-transparent'
        }`}
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
                className="w-9 h-9 rounded-full flex items-center justify-center transition-shadow duration-500"
                style={{
                  background: 'linear-gradient(135deg, #007AFF, #AF52DE)',
                  boxShadow: '0 4px 16px rgba(175,82,222,0.3)',
                }}
              >
                <span className="text-white font-bold text-lg">陳</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-semibold gradient-text">AI講師</span>
                <span className="text-white/80 ml-1 text-sm font-light">陳彥彤</span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-0.5">
              {homeNavItems.map((item) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className={`relative px-3 py-1.5 text-sm rounded-lg transition-all duration-500 ${
                    isActive(item.href)
                      ? 'text-white/90 bg-white/[0.1] backdrop-blur-glass'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/[0.06]'
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #007AFF, #AF52DE, #34C759)',
                        backgroundSize: '200% 100%',
                        animation: 'iridescentText 4s ease-in-out infinite',
                      }}
                    />
                  )}
                </a>
              ))}
              <Link
                to="/blog"
                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ${
                  location.pathname.startsWith('/blog')
                    ? 'text-white/90 bg-white/[0.1] backdrop-blur-sm'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/[0.06]'
                }`}
              >
                部落格
              </Link>
              <Link
                to="/#contact"
                className="ml-3 px-5 py-2 text-sm font-medium text-white rounded-full transition-all duration-500 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #AF52DE, #007AFF)',
                  boxShadow: '0 4px 16px rgba(175, 82, 222, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                }}
              >
                預約諮詢
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden relative w-10 h-10 flex items-center justify-center text-white/60 hover:text-white/90 rounded-lg hover:bg-white/[0.08] transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="切換選單"
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className={`block h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-0 scale-0' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}
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
          className={`absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel - Liquid Glass */}
        <div
          className={`absolute top-0 right-0 w-72 h-full bg-surface-900/80 backdrop-blur-glass-heavy saturate-[180%] border-l border-white/[0.1] transition-transform duration-500 ease-out shadow-[-8px_0_32px_rgba(0,0,0,0.25)] ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full pt-20 pb-8 px-6">
            <div className="flex-1 space-y-1">
              {homeNavItems.map((item, index) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className={`flex items-center px-4 py-3 rounded-glass-sm text-base transition-all duration-500 ${
                    isActive(item.href)
                      ? 'text-white/90 bg-white/[0.1] font-medium backdrop-blur-glass'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/[0.06]'
                  }`}
                  style={{
                    transitionDelay: isMobileMenuOpen ? `${index * 30}ms` : '0ms',
                    opacity: isMobileMenuOpen ? 1 : 0,
                    transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(20px)',
                  }}
                >
                  {isActive(item.href) && (
                    <span
                      className="w-1 h-5 rounded-full mr-3"
                      style={{
                        background: 'linear-gradient(180deg, #007AFF, #AF52DE, #34C759)',
                      }}
                    />
                  )}
                  {item.label}
                </a>
              ))}
              <Link
                to="/blog"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-glass-sm text-base transition-all duration-300 ${
                  location.pathname.startsWith('/blog')
                    ? 'text-white/90 bg-white/[0.1] font-medium'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/[0.06]'
                }`}
              >
                部落格
              </Link>
            </div>

            <div className="pt-4 border-t border-white/[0.08]">
              <Link
                to="/#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 text-white font-medium rounded-glass-sm text-center transition-all duration-500"
                style={{
                  background: 'linear-gradient(135deg, #AF52DE, #007AFF)',
                  boxShadow: '0 4px 16px rgba(175, 82, 222, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
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

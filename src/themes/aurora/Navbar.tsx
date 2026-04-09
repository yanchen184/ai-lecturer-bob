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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || !isHomePage
            ? 'bg-[#0F0F1A]/95 backdrop-blur-xl shadow-lg shadow-black/30 border-b border-white/[0.06]'
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
              <div className="w-9 h-9 rounded-full flex items-center justify-center transition-shadow duration-300" style={{ background: 'linear-gradient(135deg, #00D2FF, #7A5FFF)', boxShadow: '0 0 12px rgba(0,210,255,0.2)' }}>
                <span className="text-white font-bold text-lg">陳</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold gradient-text">AI講師</span>
                <span className="text-white/90 ml-1 text-sm">陳彥彤</span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-0.5">
              {homeNavItems.map((item) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className={`relative px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-white bg-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #00D2FF, #7A5FFF, #FF6B9D)', boxShadow: '0 0 8px rgba(0,210,255,0.4)' }} />
                  )}
                </a>
              ))}
              <Link
                to="/blog"
                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                  location.pathname.startsWith('/blog')
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                部落格
              </Link>
              <Link
                to="/#contact"
                className="ml-3 px-5 py-2 text-sm text-white font-medium rounded-full hover:scale-105 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #00D2FF, #7A5FFF, #FF6B9D)', boxShadow: '0 0 15px rgba(0,210,255,0.25), 0 0 30px rgba(122,95,255,0.15)' }}
              >
                預約諮詢
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden relative w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-all"
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
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`absolute top-0 right-0 w-72 h-full bg-aurora-dark/[0.98] backdrop-blur-xl border-l border-white/[0.08] transition-transform duration-300 ease-out ${
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
                  className={`flex items-center px-4 py-3 rounded-xl text-base transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-white bg-white/10 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={{
                    transitionDelay: isMobileMenuOpen ? `${index * 30}ms` : '0ms',
                    opacity: isMobileMenuOpen ? 1 : 0,
                    transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(20px)',
                  }}
                >
                  {isActive(item.href) && (
                    <span className="w-1 h-5 rounded-full mr-3" style={{ background: 'linear-gradient(180deg, #00D2FF, #7A5FFF)' }} />
                  )}
                  {item.label}
                </a>
              ))}
              <Link
                to="/blog"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl text-base transition-all duration-200 ${
                  location.pathname.startsWith('/blog')
                    ? 'text-white bg-white/10 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                部落格
              </Link>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Link
                to="/#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 text-white font-medium rounded-xl text-center hover:shadow-lg transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #00D2FF, #7A5FFF, #FF6B9D)', boxShadow: '0 0 15px rgba(0,210,255,0.25), 0 0 30px rgba(122,95,255,0.15)' }}
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

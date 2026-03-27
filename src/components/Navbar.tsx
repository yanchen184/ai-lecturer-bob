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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled || !isHomePage
            ? 'bg-swiss-white border-b border-swiss-gray-200'
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="主要導覽"
      >
        <div className="max-w-grid mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-3 group flex-shrink-0"
              aria-label="回到首頁"
            >
              <span className="text-h3 font-bold text-swiss-black group-hover:text-swiss-red transition-colors">陳彥彤</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              {homeNavItems.map((item) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className={`relative px-3 py-1.5 text-caption transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-swiss-black font-bold'
                      : 'text-swiss-gray-400 hover:text-swiss-black'
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-3 right-3 h-px bg-swiss-red" />
                  )}
                </a>
              ))}
              <Link
                to="/blog"
                className={`px-3 py-1.5 text-caption transition-colors duration-200 ${
                  location.pathname.startsWith('/blog')
                    ? 'text-swiss-black font-bold'
                    : 'text-swiss-gray-400 hover:text-swiss-black'
                }`}
              >
                部落格
              </Link>
              <Link
                to="/#contact"
                className="ml-4 px-6 py-2 text-caption font-bold bg-swiss-black text-swiss-white hover:bg-swiss-red transition-colors duration-200"
              >
                預約諮詢
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden relative w-10 h-10 flex items-center justify-center text-swiss-black"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="切換選單"
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className={`block h-px bg-current transition-all duration-200 origin-center ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-[7.5px]' : ''
                  }`}
                />
                <span
                  className={`block h-px bg-current transition-all duration-200 ${
                    isMobileMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`block h-px bg-current transition-all duration-200 origin-center ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-[7.5px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-200 ${
          isMobileMenuOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-swiss-white/80 transition-opacity duration-200 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`absolute top-0 right-0 w-72 h-full bg-swiss-white border-l border-swiss-gray-200 transition-transform duration-200 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full pt-20 pb-8 px-6">
            <div className="flex-1 space-y-1">
              {homeNavItems.map((item) => (
                <a
                  key={item.href}
                  href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`}
                  onClick={(e) => handleHomeNavClick(e, item.href)}
                  className={`flex items-center px-4 py-3 text-body transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-swiss-black font-bold'
                      : 'text-swiss-gray-400 hover:text-swiss-black'
                  }`}
                >
                  {isActive(item.href) && (
                    <span className="w-4 h-px bg-swiss-red mr-3" />
                  )}
                  {item.label}
                </a>
              ))}
              <Link
                to="/blog"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-body transition-colors duration-200 ${
                  location.pathname.startsWith('/blog')
                    ? 'text-swiss-black font-bold'
                    : 'text-swiss-gray-400 hover:text-swiss-black'
                }`}
              >
                部落格
              </Link>
            </div>

            <div className="pt-4 border-t border-swiss-gray-200">
              <Link
                to="/#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 bg-swiss-black text-swiss-white font-bold text-center hover:bg-swiss-red transition-colors duration-200"
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

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
    const handleScroll = () => { setIsScrolled(window.scrollY > 50); };
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
      const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(id); }); }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
      observer.observe(element);
      observers.push(observer);
    });
    return () => { observers.forEach((obs) => obs.disconnect()); };
  }, [isHomePage]);

  useEffect(() => { const cleanup = updateActiveSection(); return () => cleanup?.(); }, [updateActiveSection]);

  useEffect(() => {
    if (isMobileMenuOpen) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleHomeNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const sectionId = href.replace('#', '');
    if (isHomePage) { const element = document.getElementById(sectionId); if (element) element.scrollIntoView({ behavior: 'smooth' }); } else { window.location.assign(`/#${sectionId}`); }
    setIsMobileMenuOpen(false);
  };

  const isActive = (href: string) => isHomePage && activeSection === href.replace('#', '');

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${isScrolled || !isHomePage ? 'bg-bold-bg/95 backdrop-blur-sm border-b border-bold-border' : 'bg-transparent'}`} role="navigation" aria-label="主要導覽">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            <Link to="/" className="flex items-center space-x-2 group flex-shrink-0" aria-label="回到首頁">
              <div className="w-9 h-9 bg-bold-accent flex items-center justify-center">
                <span className="text-bold-text font-bold text-lg">陳</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold text-bold-accent">AI講師</span>
                <span className="text-bold-text ml-1 text-sm font-medium">陳彥彤</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              {homeNavItems.map((item) => (
                <a key={item.href} href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`} onClick={(e) => handleHomeNavClick(e, item.href)} className={`relative px-3 py-1.5 text-sm transition-all duration-200 ${isActive(item.href) ? 'text-bold-text font-bold' : 'text-bold-muted hover:text-bold-text'}`}>
                  {item.label}
                  {isActive(item.href) && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-bold-accent" />}
                </a>
              ))}
              <Link to="/blog" className={`px-3 py-1.5 text-sm transition-all duration-200 ${location.pathname.startsWith('/blog') ? 'text-bold-text font-bold' : 'text-bold-muted hover:text-bold-text'}`}>部落格</Link>
              <Link to="/#contact" className="ml-4 px-5 py-2 text-sm bg-bold-accent text-bold-text font-bold hover:bg-bold-accent/90 transition-colors duration-200">預約諮詢</Link>
            </div>

            <button className="lg:hidden relative w-10 h-10 flex items-center justify-center text-bold-muted hover:text-bold-text transition-colors duration-200" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="切換選單" aria-expanded={isMobileMenuOpen}>
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-current transition-all duration-200 origin-center ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`block h-0.5 bg-current transition-all duration-200 ${isMobileMenuOpen ? 'opacity-0 scale-0' : ''}`} />
                <span className={`block h-0.5 bg-current transition-all duration-200 origin-center ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      <div className={`fixed inset-0 z-40 lg:hidden transition-all duration-200 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/80 transition-opacity duration-200 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`absolute top-0 right-0 w-72 h-full bg-bold-bg border-l border-bold-border transition-transform duration-200 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full pt-20 pb-8 px-6">
            <div className="flex-1 space-y-0">
              {homeNavItems.map((item, index) => (
                <a key={item.href} href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`} onClick={(e) => handleHomeNavClick(e, item.href)} className={`flex items-center px-4 py-3 text-base transition-all duration-200 border-b border-bold-border ${isActive(item.href) ? 'text-bold-text font-bold' : 'text-bold-muted hover:text-bold-text'}`} style={{ transitionDelay: isMobileMenuOpen ? `${index * 30}ms` : '0ms', opacity: isMobileMenuOpen ? 1 : 0, transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(20px)' }}>
                  {isActive(item.href) && <span className="w-2 h-0.5 bg-bold-accent mr-3" />}
                  {item.label}
                </a>
              ))}
              <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center px-4 py-3 text-base transition-all duration-200 border-b border-bold-border ${location.pathname.startsWith('/blog') ? 'text-bold-text font-bold' : 'text-bold-muted hover:text-bold-text'}`}>部落格</Link>
            </div>
            <div className="pt-4 border-t border-bold-border">
              <Link to="/#contact" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-3 bg-bold-accent text-bold-text font-bold text-center hover:bg-bold-accent/90 transition-colors duration-200">預約諮詢</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;

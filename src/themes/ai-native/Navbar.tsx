import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

const homeNavItems = [
  { label: '關於我', href: '#about' }, { label: '文章', href: '#latest-posts' },
  { label: '技能', href: '#skills' }, { label: '課程', href: '#courses' },
  { label: '作品集', href: '#portfolio' }, { label: '學員回饋', href: '#testimonials' },
  { label: '聯繫我', href: '#contact' },
] as const;

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname.startsWith('/style/');

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
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(id); }); }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
      obs.observe(el);
      observers.push(obs);
    });
    return () => { observers.forEach((o) => o.disconnect()); };
  }, [isHomePage]);

  useEffect(() => { const cleanup = updateActiveSection(); return () => cleanup?.(); }, [updateActiveSection]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleHomeNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const sectionId = href.replace('#', '');
    if (isHomePage) { document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }); } else { window.location.assign(`/#${sectionId}`); }
    setIsMobileMenuOpen(false);
  };

  const isActive = (href: string) => isHomePage && activeSection === href.replace('#', '');

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || !isHomePage ? 'backdrop-blur-xl shadow-lg' : 'bg-transparent'}`} style={isScrolled || !isHomePage ? { background: 'rgba(26,26,46,0.85)', borderBottom: '1px solid rgba(0,255,255,0.08)', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' } : undefined} role="navigation" aria-label="主要導覽">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            <Link to="/" className="flex items-center space-x-2 group flex-shrink-0" aria-label="回到首頁">
              <div className="w-9 h-9 rounded-full flex items-center justify-center transition-shadow duration-300" style={{ background: 'linear-gradient(135deg, #00FFFF, #FF006E)', boxShadow: '0 0 15px rgba(0,255,255,0.3)' }}><span className="text-surface-900 font-bold text-lg">陳</span></div>
              <div className="hidden sm:block"><span className="text-base font-bold gradient-text font-mono">AI.講師</span><span className="text-gray-300 ml-1 text-sm">陳彥彤</span></div>
            </Link>
            <div className="hidden lg:flex items-center space-x-0.5">
              {homeNavItems.map((item) => (
                <a key={item.href} href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`} onClick={(e) => handleHomeNavClick(e, item.href)} className={`relative px-3 py-1.5 text-sm rounded-lg transition-all duration-200 font-mono ${isActive(item.href) ? 'text-[#00FFFF]' : 'text-gray-500 hover:text-gray-200'}`} style={isActive(item.href) ? { background: 'rgba(0,255,255,0.08)' } : undefined}>
                  {item.label}
                  {isActive(item.href) && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #00FFFF, #FF006E)' }} />}
                </a>
              ))}
              <Link to="/blog" className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 font-mono ${location.pathname.startsWith('/blog') ? 'text-[#00FFFF]' : 'text-gray-500 hover:text-gray-200'}`} style={location.pathname.startsWith('/blog') ? { background: 'rgba(0,255,255,0.08)' } : undefined}>部落格</Link>
              <a href="#contact" onClick={(e) => handleHomeNavClick(e, '#contact')} className="ml-3 px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 font-mono" style={{ background: 'linear-gradient(135deg, #00FFFF, #FF006E)', color: '#1A1A2E', boxShadow: '0 0 15px rgba(0,255,255,0.25)' }}>預約諮詢</a>
            </div>
            <button className="lg:hidden relative w-10 h-10 flex items-center justify-center text-gray-300 hover:text-[#00FFFF] rounded-lg transition-all" style={{ background: 'rgba(0,255,255,0.05)' }} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="切換選單" aria-expanded={isMobileMenuOpen}>
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
        <div className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`absolute top-0 right-0 w-72 h-full backdrop-blur-xl transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ background: 'rgba(26,26,46,0.97)', borderLeft: '1px solid rgba(0,255,255,0.1)' }}>
          <div className="flex flex-col h-full pt-20 pb-8 px-6">
            <div className="flex-1 space-y-1">
              {homeNavItems.map((item, index) => (
                <a key={item.href} href={isHomePage ? item.href : `/#${item.href.replace('#', '')}`} onClick={(e) => handleHomeNavClick(e, item.href)} className={`flex items-center px-4 py-3 rounded-xl text-base transition-all duration-200 font-mono ${isActive(item.href) ? 'text-[#00FFFF] font-medium' : 'text-gray-500 hover:text-gray-200'}`} style={{ transitionDelay: isMobileMenuOpen ? `${index * 30}ms` : '0ms', opacity: isMobileMenuOpen ? 1 : 0, transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(20px)', background: isActive(item.href) ? 'rgba(0,255,255,0.08)' : 'transparent' }}>
                  {isActive(item.href) && <span className="w-1 h-5 rounded-full mr-3" style={{ background: 'linear-gradient(180deg, #00FFFF, #FF006E)' }} />}
                  {item.label}
                </a>
              ))}
              <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center px-4 py-3 rounded-xl text-base transition-all duration-200 font-mono ${location.pathname.startsWith('/blog') ? 'text-[#00FFFF] font-medium' : 'text-gray-500 hover:text-gray-200'}`} style={location.pathname.startsWith('/blog') ? { background: 'rgba(0,255,255,0.08)' } : undefined}>部落格</Link>
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid rgba(0,255,255,0.1)' }}>
              <a href="#contact" onClick={(e) => handleHomeNavClick(e, '#contact')} className="block w-full py-3 font-medium rounded-xl text-center transition-all duration-300 font-mono" style={{ background: 'linear-gradient(135deg, #00FFFF, #FF006E)', color: '#1A1A2E', boxShadow: '0 0 20px rgba(0,255,255,0.3)' }}>預約諮詢</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Navbar;

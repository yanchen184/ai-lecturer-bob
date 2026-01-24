import { useState, useEffect } from 'react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: '關於我', href: '#about' },
    { label: '專業技能', href: '#skills' },
    { label: '課程服務', href: '#courses' },
    { label: '作品集', href: '#portfolio' },
    { label: '學員回饋', href: '#testimonials' },
    { label: '聯繫我', href: '#contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-slate-900/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}
      role="navigation"
      aria-label="主要導覽"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center space-x-2 group"
            aria-label="回到首頁"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">陳</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold gradient-text">AI講師</span>
              <span className="text-white ml-1">陳彥彤</span>
            </div>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              className="ml-4 px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-full hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300"
            >
              預約諮詢
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="切換選單"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              className="block mx-4 mt-4 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-full text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              預約諮詢
            </a>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

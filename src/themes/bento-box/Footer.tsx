import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: '關於我', href: '/#about' },
    { label: '課程服務', href: '/#courses' },
    { label: '作品集', href: '/#portfolio' },
    { label: '部落格', to: '/blog' },
    { label: '留言板', href: '/#messages' },
    { label: '聯繫我', href: '/#contact' },
  ];

  const serviceLinks = [
    { label: '企業 AI 培訓', href: '/#courses' },
    { label: 'Spring Boot 課程', href: '/#courses' },
    { label: 'React 前端教學', href: '/#courses' },
    { label: 'AI 顧問服務', href: '/#contact' },
  ];

  const socialLinks = [
    {
      label: 'GitHub',
      href: 'https://github.com/yanchen184',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: 'Email',
      href: 'mailto:bobchen184@gmail.com',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/yanchen184/',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      className="relative"
      style={{
        backgroundColor: '#E8E0CC',
        borderTop: '1px solid #D4C4A8',
      }}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center space-x-2 mb-5 group">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-shadow duration-500"
                style={{ backgroundColor: '#C67B5C' }}
              >
                <span className="text-white font-bold text-xl" style={{ fontFamily: 'Georgia, serif' }}>陳</span>
              </div>
              <div>
                <span className="text-lg font-bold" style={{ color: '#C67B5C' }}>AI講師</span>
                <span className="ml-1" style={{ color: '#3D2E1C' }}>陳彥彤</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-sm" style={{ color: '#6B6255' }}>
              專業人工智慧教育講師，致力於將複雜的 AI 技術轉化為易懂的知識，
              幫助企業與個人掌握 AI 時代的核心競爭力。
            </p>
            <div className="flex items-center space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="w-10 h-10 rounded-bento flex items-center justify-center transition-all duration-500"
                  style={{
                    backgroundColor: '#FEFDFB',
                    border: '1px solid #D4C4A8',
                    color: '#6B6255',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#C67B5C';
                    e.currentTarget.style.borderColor = '#C67B5C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6B6255';
                    e.currentTarget.style.borderColor = '#D4C4A8';
                  }}
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3
              className="font-semibold text-sm uppercase tracking-wider mb-5"
              style={{ color: '#3D2E1C' }}
            >
              快速連結
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  {'to' in item && item.to ? (
                    <Link
                      to={item.to}
                      className="text-sm transition-colors duration-300"
                      style={{ color: '#6B6255' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#C67B5C'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6255'; }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-sm transition-colors duration-300"
                      style={{ color: '#6B6255' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#C67B5C'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6255'; }}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-3">
            <h3
              className="font-semibold text-sm uppercase tracking-wider mb-5"
              style={{ color: '#3D2E1C' }}
            >
              服務項目
            </h3>
            <ul className="space-y-3">
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm transition-colors duration-300"
                    style={{ color: '#6B6255' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#C67B5C'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6255'; }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact CTA */}
          <div className="lg:col-span-3">
            <h3
              className="font-semibold text-sm uppercase tracking-wider mb-5"
              style={{ color: '#3D2E1C' }}
            >
              保持聯繫
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B6255' }}>
              有任何培訓需求或合作想法，歡迎隨時聯繫。
            </p>
            <a
              href="/#contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-bento text-sm transition-all duration-500"
              style={{
                backgroundColor: '#FEFDFB',
                border: '1px solid #D4C4A8',
                color: '#6B6255',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#C67B5C';
                e.currentTarget.style.borderColor = '#C67B5C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B6255';
                e.currentTarget.style.borderColor = '#D4C4A8';
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              bobchen184@gmail.com
            </a>
            <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: '#6B6255' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>台灣全區 / 線上授課</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-14 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid #D4C4A8' }}
        >
          <p className="text-xs" style={{ color: '#6B6255' }}>
            &copy; {currentYear} AI講師陳彥彤. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <p className="text-xs" style={{ color: '#6B6255' }}>Built with React + TypeScript + Tailwind CSS</p>
            <button
              onClick={scrollToTop}
              className="w-9 h-9 rounded-bento flex items-center justify-center transition-all duration-500"
              style={{
                backgroundColor: '#FEFDFB',
                border: '1px solid #D4C4A8',
                color: '#6B6255',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#C67B5C';
                e.currentTarget.style.borderColor = '#C67B5C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B6255';
                e.currentTarget.style.borderColor = '#D4C4A8';
              }}
              aria-label="回到頂部"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-white/10" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">陳</span>
              </div>
              <div>
                <span className="text-lg font-bold gradient-text">AI講師</span>
                <span className="text-white ml-1">陳彥彤</span>
              </div>
            </div>
            <p className="text-gray-400 max-w-md">
              專業人工智慧教育講師，致力於將複雜的 AI 技術轉化為易懂的知識，
              幫助企業與個人掌握 AI 時代的核心競爭力。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">快速連結</h3>
            <ul className="space-y-2">
              <li><a href="#about" className="text-gray-400 hover:text-primary-400 transition-colors">關於我</a></li>
              <li><a href="#courses" className="text-gray-400 hover:text-primary-400 transition-colors">課程服務</a></li>
              <li><a href="#portfolio" className="text-gray-400 hover:text-primary-400 transition-colors">作品集</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-primary-400 transition-colors">聯繫我</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">聯繫資訊</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:bobchen184@gmail.com" className="hover:text-primary-400 transition-colors">
                  bobchen184@gmail.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <a href="https://github.com/yanchen184" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} AI講師陳彥彤. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2 md:mt-0">
            Built with React + TypeScript + Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

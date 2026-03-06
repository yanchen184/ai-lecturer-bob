const Portfolio = () => {
  const projects = [
    {
      title: 'DTM Racing Sport 官方網站',
      category: '前端接案',
      description: '為專業賽車改裝品牌打造的官方網站，負責前端開發與視覺呈現。',
      tech: ['前端開發', '品牌官網', '響應式設計'],
      link: 'https://dtmracingsport.com/',
      image: 'client',
    },
    {
      title: 'iT邦幫忙技術文章',
      category: '技術分享',
      description: '在 iT邦幫忙發表技術文章，分享後端開發經驗、系統架構設計、效能優化技巧等實戰心得。',
      tech: ['Spring Boot', 'MySQL', 'Redis', '系統架構'],
      link: 'https://ithelp.ithome.com.tw/users/20111603',
      image: 'blog',
    },
    {
      title: 'GitHub 開源專案',
      category: '程式開發',
      description: '開源專案與程式碼分享，包含後端 API 範例、前端作品集、實用工具等。',
      tech: ['Java', 'React', 'TypeScript', 'Open Source'],
      link: 'https://github.com/yanchen184',
      image: 'dev',
    },
    {
      title: '遊戲作品集',
      category: '網頁應用',
      description: '集合多款互動小遊戲的作品集平台，展示前端開發與遊戲設計能力。',
      tech: ['React', 'TypeScript', 'Tailwind CSS', 'GSAP'],
      link: 'https://yanchen184.github.io/game-portal',
      image: 'game',
    },
    {
      title: 'Spring Boot 企業培訓',
      category: '教學專案',
      description: '為多家企業設計並執行的後端開發培訓課程，涵蓋系統架構、效能優化、最佳實踐。',
      tech: ['課程設計', 'Spring Boot', 'MySQL', 'Redis'],
      link: '#contact',
      image: 'course',
    },
  ];

  const getGradient = (type: string) => {
    const gradients: Record<string, string> = {
      client: 'from-red-500 to-orange-500',
      blog: 'from-blue-500 to-indigo-500',
      dev: 'from-orange-500 to-red-500',
      game: 'from-green-500 to-emerald-500',
      course: 'from-primary-500 to-accent-500',
    };
    return gradients[type] || 'from-primary-500 to-accent-500';
  };

  const getIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      client: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      blog: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      dev: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      game: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      course: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    };
    return icons[type] || icons.dev;
  };

  return (
    <section
      id="portfolio"
      className="py-20 lg:py-32 relative bg-slate-800/50"
      aria-labelledby="portfolio-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 id="portfolio-title" className="section-title">
            <span className="gradient-text">作品集</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            程式講師陳彥彤的專案作品與教學成果展示，涵蓋技術文章、開源專案、教學課程等
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <article
              key={index}
              className="glass-card overflow-hidden group hover:transform hover:scale-[1.02] transition-all duration-300"
            >
              {/* Project Image/Icon Area */}
              <div className={`h-48 bg-gradient-to-br ${getGradient(project.image)} flex items-center justify-center text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                  {getIcon(project.image)}
                </div>
                {/* Category Badge */}
                <span className="absolute top-4 left-4 px-3 py-1 bg-black/30 backdrop-blur-sm text-white text-xs rounded-full">
                  {project.category}
                </span>
              </div>

              {/* Project Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                <p className="text-gray-400 mb-4">{project.description}</p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tech.map((tech, tIndex) => (
                    <span
                      key={tIndex}
                      className="px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Link */}
                <a
                  href={project.link}
                  target={project.link.startsWith('http') ? '_blank' : undefined}
                  rel={project.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-2 text-primary-400 font-medium hover:text-primary-300 transition-colors"
                >
                  {project.link.startsWith('http') ? '查看專案' : '了解更多'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* External Links */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <a
            href="https://github.com/yanchen184"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 text-gray-300 rounded-full hover:bg-white/20 transition-all"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span>GitHub</span>
          </a>
          <a
            href="https://ithelp.ithome.com.tw/users/20111603"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 text-gray-300 rounded-full hover:bg-white/20 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span>iT邦幫忙</span>
          </a>
          <a
            href="https://yanchen184.github.io/game-portal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 text-gray-300 rounded-full hover:bg-white/20 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>遊戲作品集</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;

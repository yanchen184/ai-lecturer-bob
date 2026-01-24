const Portfolio = () => {
  const projects = [
    {
      title: 'AI 遊戲小站',
      category: '網頁應用',
      description: '集合多款 AI 主題小遊戲的互動平台，展示前端開發與遊戲設計能力。',
      tech: ['React', 'TypeScript', 'Tailwind CSS', 'GSAP'],
      link: 'https://yanchen184.github.io/game-portal',
      image: 'game',
    },
    {
      title: 'ChatGPT 企業培訓課程',
      category: '教學專案',
      description: '為多家企業設計並執行的 AI 應用培訓課程，累積數千名學員。',
      tech: ['課程設計', 'Prompt Engineering', '企業培訓'],
      link: '#contact',
      image: 'course',
    },
    {
      title: '機器學習工作坊',
      category: '技術教學',
      description: '從理論到實作的完整機器學習課程，涵蓋監督式與非監督式學習。',
      tech: ['Python', 'Scikit-learn', 'Pandas', 'Jupyter'],
      link: '#contact',
      image: 'ml',
    },
    {
      title: 'AI 應用開發專案',
      category: '技術開發',
      description: '整合 LLM API 的企業級應用開發，包含 RAG 系統與自動化工作流程。',
      tech: ['LangChain', 'OpenAI API', 'Python', 'FastAPI'],
      link: 'https://github.com/yanchen184',
      image: 'dev',
    },
  ];

  const getGradient = (type: string) => {
    const gradients: Record<string, string> = {
      game: 'from-green-500 to-emerald-500',
      course: 'from-primary-500 to-blue-500',
      ml: 'from-purple-500 to-accent-500',
      dev: 'from-orange-500 to-red-500',
    };
    return gradients[type] || 'from-primary-500 to-accent-500';
  };

  const getIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
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
      ml: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      dev: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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
            AI講師陳彥彤的專案作品與教學成果展示，涵蓋開發、教學、顧問等多元領域
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

        {/* GitHub Link */}
        <div className="mt-12 text-center">
          <a
            href="https://github.com/yanchen184"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 text-gray-300 rounded-full hover:bg-white/20 transition-all"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span>查看更多 GitHub 專案</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;

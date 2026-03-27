const Skills = () => {
  const skillCategories = [
    {
      title: '後端開發',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      skills: [
        { name: 'Java / Spring Boot', level: 95 },
        { name: 'Spring Data JPA / Hibernate', level: 92 },
        { name: 'RESTful API 設計', level: 90 },
        { name: 'RabbitMQ 訊息佇列', level: 85 },
        { name: 'Python / FastAPI', level: 80 },
      ],
    },
    {
      title: '資料庫與快取',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      skills: [
        { name: 'MySQL (Index, Partition)', level: 92 },
        { name: 'Redis 快取策略', level: 90 },
        { name: '分布式鎖 / 樂觀鎖', level: 88 },
        { name: 'DB Housekeeping', level: 85 },
        { name: 'PostgreSQL', level: 78 },
      ],
    },
    {
      title: 'DevOps 與雲端',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      skills: [
        { name: 'Docker / Kubernetes', level: 85 },
        { name: 'GitLab CI/CD / Argo CD', level: 88 },
        { name: 'Azure (AZ-900 認證)', level: 82 },
        { name: 'ELK / Prometheus / Grafana', level: 80 },
        { name: 'Linux 系統管理', level: 78 },
      ],
    },
  ];

  return (
    <section
      id="skills"
      className="py-26 lg:py-30 relative"
      aria-labelledby="skills-title"
    >
      <div className="bold-divider" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-26">
        {/* Header */}
        <div className="mb-18">
          <h2 id="skills-title" className="section-title text-left mb-4">
            專業技能
          </h2>
          <p className="text-bold-muted text-lg max-w-2xl">
            程式講師陳彥彤具備全方位的技術能力，從後端開發到 DevOps，提供最專業的教學服務
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-3 gap-px bg-bold-border">
          {skillCategories.map((category, catIndex) => (
            <div
              key={catIndex}
              className="bg-bold-bg p-8 hover:bg-bold-surface transition-colors duration-200"
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-bold-surface border border-bold-border flex items-center justify-center text-bold-accent">
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold text-bold-text">{category.title}</h3>
              </div>

              {/* Skills List */}
              <div className="space-y-5">
                {category.skills.map((skill, skillIndex) => (
                  <div key={skillIndex}>
                    <div className="flex justify-between mb-2">
                      <span className="text-bold-muted text-sm">{skill.name}</span>
                      <span className="text-bold-accent font-bold text-sm">{skill.level}%</span>
                    </div>
                    <div className="h-1 bg-bold-border overflow-hidden">
                      <div
                        className="h-full bg-bold-accent transition-all duration-200"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Frontend Skills */}
        <div className="mt-px bg-bold-surface border border-bold-border p-8">
          <h3 className="text-xl font-bold text-bold-text mb-8">前端開發技能</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'React / TypeScript', level: 88 },
              { name: 'Tailwind CSS', level: 85 },
              { name: 'JavaScript / ES6+', level: 90 },
            ].map((skill, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-bold-muted text-sm">{skill.name}</span>
                  <span className="text-bold-accent font-bold text-sm">{skill.level}%</span>
                </div>
                <div className="h-1 bg-bold-border overflow-hidden">
                  <div
                    className="h-full bg-bold-text transition-all duration-200"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Tags */}
        <div className="mt-18">
          <h3 className="text-bold-text font-bold mb-6 uppercase tracking-wider text-sm">其他專業領域</h3>
          <div className="flex flex-wrap gap-2">
            {[
              'NLP / NER 分析',
              'Hugging Face',
              'API 設計',
              '事件驅動架構',
              '高併發系統設計',
              '技術文件撰寫',
              '簡報技巧',
              '課程設計',
              '企業顧問',
              'ChatGPT 輔助開發',
              'Git Flow',
              'Agile / Scrum',
            ].map((tag, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-bold-surface border border-bold-border text-bold-muted text-sm hover:text-bold-text hover:border-bold-accent transition-colors duration-200 cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;

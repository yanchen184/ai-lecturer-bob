import { useEffect, useRef, useState } from 'react';

const Skills = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleBars, setVisibleBars] = useState(false);
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Animate skill bars when section enters viewport
  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleBars(true);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

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
      ref={sectionRef}
      id="skills"
      className="py-32 lg:py-40 relative"
      aria-labelledby="skills-title"
      style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)' }}
    >
      <hr className="chapter-divider" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        {/* Header */}
        <div
          ref={(el) => { revealRefs.current[0] = el; }}
          className="scroll-reveal text-center mb-16"
        >
          <span className="chapter-label">02 — 技能</span>
          <h2 id="skills-title" className="section-title">
            <span className="gradient-text">專業技能</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#8892b0' }}>
            程式講師陳彥彤具備全方位的技術能力，從後端開發到 DevOps，提供最專業的教學服務
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {skillCategories.map((category, catIndex) => (
            <div
              key={catIndex}
              ref={(el) => { revealRefs.current[catIndex + 1] = el; }}
              className="scroll-reveal glass-card p-6"
              style={{ transitionDelay: `${catIndex * 150}ms` }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                  style={{ background: '#e94560', boxShadow: '0 0 20px rgba(233,69,96,0.2)' }}
                >
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{category.title}</h3>
              </div>

              {/* Skills List */}
              <div className="space-y-4">
                {category.skills.map((skill, skillIndex) => (
                  <div key={skillIndex}>
                    <div className="flex justify-between mb-1">
                      <span style={{ color: '#8892b0' }}>{skill.name}</span>
                      <span style={{ color: '#e94560' }}>{skill.level}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(15,52,96,0.5)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: visibleBars ? `${skill.level}%` : '0%',
                          background: 'linear-gradient(90deg, #e94560, #0f3460)',
                          boxShadow: '0 0 8px rgba(233,69,96,0.3)',
                          transition: 'width 1.2s ease',
                          transitionDelay: `${skillIndex * 100 + catIndex * 200}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Frontend Skills */}
        <div
          ref={(el) => { revealRefs.current[4] = el; }}
          className="scroll-reveal mt-12 glass-card p-8"
        >
          <h3 className="text-xl font-bold text-white text-center mb-6">前端開發技能</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'React / TypeScript', level: 88 },
              { name: 'Tailwind CSS', level: 85 },
              { name: 'JavaScript / ES6+', level: 90 },
            ].map((skill, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span style={{ color: '#8892b0' }}>{skill.name}</span>
                  <span style={{ color: '#e94560' }}>{skill.level}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(15,52,96,0.5)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: visibleBars ? `${skill.level}%` : '0%',
                      background: 'linear-gradient(90deg, #e94560, #0f3460)',
                      boxShadow: '0 0 8px rgba(233,69,96,0.3)',
                      transition: 'width 1.2s ease',
                      transitionDelay: `${index * 100 + 600}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Tags */}
        <div
          ref={(el) => { revealRefs.current[5] = el; }}
          className="scroll-reveal mt-16 text-center"
        >
          <h3 className="text-white font-semibold mb-6">其他專業領域</h3>
          <div className="flex flex-wrap justify-center gap-3">
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
                className="px-4 py-2 rounded-full text-sm cursor-default transition-all duration-600"
                style={{
                  background: 'rgba(22,33,62,0.6)',
                  color: '#8892b0',
                  border: '1px solid rgba(15,52,96,0.6)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(233,69,96,0.4)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(15,52,96,0.6)';
                  e.currentTarget.style.color = '#8892b0';
                }}
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

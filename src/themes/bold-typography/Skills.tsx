import { useEffect, useRef } from 'react';

const SKILL_CATEGORIES = [
  {
    title: '後端開發',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    color: '#6366F1',
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
    color: '#EC4899',
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
    color: '#F59E0B',
    skills: [
      { name: 'Docker / Kubernetes', level: 85 },
      { name: 'GitLab CI/CD / Argo CD', level: 88 },
      { name: 'Azure (AZ-900 認證)', level: 82 },
      { name: 'ELK / Prometheus / Grafana', level: 80 },
      { name: 'Linux 系統管理', level: 78 },
    ],
  },
] as const;

const FRONTEND_SKILLS = [
  { name: 'React / TypeScript', level: 88 },
  { name: 'Tailwind CSS', level: 85 },
  { name: 'JavaScript / ES6+', level: 90 },
] as const;

const OTHER_SKILLS = [
  'NLP / NER 分析', 'Hugging Face', 'API 設計', '事件驅動架構',
  '高併發系統設計', '技術文件撰寫', '簡報技巧', '課程設計',
  '企業顧問', 'ChatGPT 輔助開發', 'Git Flow', 'Agile / Scrum',
] as const;

const Skills = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const revealEls = section.querySelectorAll('.scroll-reveal');
    const skillBarEls = section.querySelectorAll('.skill-bar-fill');

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const barObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const targetWidth = target.getAttribute('data-width');
            if (targetWidth) {
              target.style.width = targetWidth;
            }
            barObserver.unobserve(target);
          }
        });
      },
      { threshold: 0.1 }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
    skillBarEls.forEach((el) => barObserver.observe(el));

    return () => {
      revealObserver.disconnect();
      barObserver.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="skills"
      className="py-20 lg:py-32 relative"
      aria-labelledby="skills-title"
    >
      <div className="section-divider" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 scroll-reveal">
          <div className="font-mono text-sm mb-2" style={{ color: '#6B7280' }}>
            {'$ analyze --skills --verbose'}
          </div>
          <h2 id="skills-title" className="section-title">
            <span className="gradient-text">專業技能</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
            程式講師陳彥彤具備全方位的技術能力，從後端開發到 DevOps，提供最專業的教學服務
          </p>
        </div>

        {/* Skill category cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {SKILL_CATEGORIES.map((category, catIndex) => (
            <div
              key={category.title}
              className={`scroll-reveal stagger-${catIndex + 1} motion-card p-6`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${category.color}12`,
                    border: `1px solid ${category.color}30`,
                    color: category.color,
                  }}
                >
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold text-white font-mono">
                  {category.title}
                </h3>
              </div>

              <div className="space-y-4">
                {category.skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-mono" style={{ color: '#9CA3AF' }}>
                        {skill.name}
                      </span>
                      <span className="text-sm font-mono" style={{ color: category.color }}>
                        {skill.level}%
                      </span>
                    </div>
                    <div className="skill-bar">
                      <div
                        className="skill-bar-fill"
                        data-width={`${skill.level}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Frontend skills */}
        <div className="mt-12 scroll-reveal motion-card p-8">
          <h3 className="text-xl font-bold text-white text-center mb-6 font-mono">
            <span style={{ color: '#6366F1' }}>{'<'}</span>
            前端開發技能
            <span style={{ color: '#6366F1' }}>{' />'}</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {FRONTEND_SKILLS.map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-mono" style={{ color: '#9CA3AF' }}>
                    {skill.name}
                  </span>
                  <span className="text-sm font-mono" style={{ color: '#EC4899' }}>
                    {skill.level}%
                  </span>
                </div>
                <div className="skill-bar">
                  <div
                    className="skill-bar-fill"
                    data-width={`${skill.level}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other skills tags */}
        <div className="mt-16 text-center scroll-reveal">
          <h3 className="font-semibold mb-6 font-mono" style={{ color: '#6366F1' }}>
            // 其他專業領域
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {OTHER_SKILLS.map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 rounded-full text-sm font-mono transition-all duration-300 cursor-default"
                style={{
                  background: '#111111',
                  border: '1px solid #1F1F1F',
                  color: '#6B7280',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366F1';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1F1F1F';
                  e.currentTarget.style.color = '#6B7280';
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

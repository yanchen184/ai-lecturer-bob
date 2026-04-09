const Skills = () => {
  const skillCategories = [
    {
      title: '後端開發',
      icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>),
      colorHex: '#00FFFF',
      skills: [{ name: 'Java / Spring Boot', level: 95 }, { name: 'Spring Data JPA / Hibernate', level: 92 }, { name: 'RESTful API 設計', level: 90 }, { name: 'RabbitMQ 訊息佇列', level: 85 }, { name: 'Python / FastAPI', level: 80 }],
    },
    {
      title: '資料庫與快取',
      icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>),
      colorHex: '#5D34D0',
      skills: [{ name: 'MySQL (Index, Partition)', level: 92 }, { name: 'Redis 快取策略', level: 90 }, { name: '分布式鎖 / 樂觀鎖', level: 88 }, { name: 'DB Housekeeping', level: 85 }, { name: 'PostgreSQL', level: 78 }],
    },
    {
      title: 'DevOps 與雲端',
      icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>),
      colorHex: '#FF006E',
      skills: [{ name: 'Docker / Kubernetes', level: 85 }, { name: 'GitLab CI/CD / Argo CD', level: 88 }, { name: 'Azure (AZ-900 認證)', level: 82 }, { name: 'ELK / Prometheus / Grafana', level: 80 }, { name: 'Linux 系統管理', level: 78 }],
    },
  ];

  return (
    <section id="skills" className="py-20 lg:py-32 relative" aria-labelledby="skills-title" style={{ background: 'linear-gradient(180deg, rgba(26,26,46,0.5) 0%, rgba(26,26,46,1) 100%)' }}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5D34D0]/20 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="font-mono text-[#00FFFF]/50 text-sm mb-2">{'$ analyze --skills --verbose'}</div>
          <h2 id="skills-title" className="section-title"><span className="gradient-text">專業技能</span></h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">程式講師陳彥彤具備全方位的技術能力，從後端開發到 DevOps，提供最專業的教學服務</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {skillCategories.map((category, catIndex) => (
            <div key={catIndex} className="glass-card p-6 hover:border-[#00FFFF]/25 transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${category.colorHex}15`, border: `1px solid ${category.colorHex}33`, color: category.colorHex }}>{category.icon}</div>
                <h3 className="text-xl font-bold text-white font-mono">{category.title}</h3>
              </div>
              <div className="space-y-4">
                {category.skills.map((skill, skillIndex) => (
                  <div key={skillIndex}>
                    <div className="flex justify-between mb-1"><span className="text-gray-400 text-sm font-mono">{skill.name}</span><span className="text-[#00FFFF] text-sm font-mono">{skill.level}%</span></div>
                    <div className="skill-bar"><div className="skill-bar-fill" style={{ width: `${skill.level}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 glass-card p-8">
          <h3 className="text-xl font-bold text-white text-center mb-6 font-mono"><span className="text-neon-blue">{'<'}</span>前端開發技能<span className="text-neon-blue">{' />'}</span></h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[{ name: 'React / TypeScript', level: 88 }, { name: 'Tailwind CSS', level: 85 }, { name: 'JavaScript / ES6+', level: 90 }].map((skill, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1"><span className="text-gray-400 text-sm font-mono">{skill.name}</span><span className="text-[#FF006E] text-sm font-mono">{skill.level}%</span></div>
                <div className="skill-bar"><div className="skill-bar-fill" style={{ width: `${skill.level}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 text-center">
          <h3 className="text-white font-semibold mb-6 font-mono text-[#00FFFF]/80">// 其他專業領域</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {['NLP / NER 分析', 'Hugging Face', 'API 設計', '事件驅動架構', '高併發系統設計', '技術文件撰寫', '簡報技巧', '課程設計', '企業顧問', 'ChatGPT 輔助開發', 'Git Flow', 'Agile / Scrum'].map((tag, index) => (
              <span key={index} className="px-4 py-2 text-gray-400 rounded-full text-sm font-mono hover:text-[#00FFFF] transition-all duration-300 cursor-default" style={{ background: 'rgba(0,255,255,0.03)', border: '1px solid rgba(0,255,255,0.1)' }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
export default Skills;

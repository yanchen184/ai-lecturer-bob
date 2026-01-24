const Skills = () => {
  const skillCategories = [
    {
      title: 'AI 與機器學習',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      skills: [
        { name: 'ChatGPT / GPT-4', level: 98 },
        { name: 'Prompt Engineering', level: 95 },
        { name: '機器學習 (ML)', level: 90 },
        { name: '深度學習 (DL)', level: 88 },
        { name: 'LangChain / RAG', level: 85 },
      ],
    },
    {
      title: '程式語言',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      skills: [
        { name: 'Python', level: 95 },
        { name: 'TypeScript / JavaScript', level: 92 },
        { name: 'Java / Spring Boot', level: 88 },
        { name: 'SQL / NoSQL', level: 85 },
        { name: 'React / Vue', level: 90 },
      ],
    },
    {
      title: '工具與框架',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      skills: [
        { name: 'PyTorch / TensorFlow', level: 88 },
        { name: 'Hugging Face', level: 85 },
        { name: 'Docker / K8s', level: 82 },
        { name: 'AWS / GCP', level: 80 },
        { name: 'Git / CI/CD', level: 90 },
      ],
    },
  ];

  return (
    <section
      id="skills"
      className="py-20 lg:py-32 relative bg-slate-800/50"
      aria-labelledby="skills-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 id="skills-title" className="section-title">
            <span className="gradient-text">專業技能</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI講師陳彥彤具備全方位的技術能力，從人工智慧到全端開發，提供最專業的教學服務
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {skillCategories.map((category, catIndex) => (
            <div
              key={catIndex}
              className="glass-card p-6 hover:bg-white/15 transition-all duration-300"
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white">
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{category.title}</h3>
              </div>

              {/* Skills List */}
              <div className="space-y-4">
                {category.skills.map((skill, skillIndex) => (
                  <div key={skillIndex}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">{skill.name}</span>
                      <span className="text-primary-400">{skill.level}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-1000"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tech Tags */}
        <div className="mt-16 text-center">
          <h3 className="text-white font-semibold mb-6">其他專業領域</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              '自然語言處理 (NLP)',
              '電腦視覺',
              'API 設計',
              '資料分析',
              '敏捷開發',
              '技術寫作',
              '簡報技巧',
              '課程設計',
              '企業顧問',
              'Claude AI',
              'Midjourney',
              'Stable Diffusion',
            ].map((tag, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-white/10 text-gray-300 rounded-full text-sm hover:bg-white/20 transition-colors cursor-default"
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

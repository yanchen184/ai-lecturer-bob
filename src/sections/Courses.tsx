const Courses = () => {
  const courses = [
    {
      title: 'Spring Boot 後端開發實戰',
      subtitle: '主力課程',
      description: '從零開始建立企業級後端系統，涵蓋 Spring Boot、Spring Data JPA、MySQL、Redis 等核心技術。',
      features: [
        'Spring Boot 專案架構設計',
        'RESTful API 設計與實作',
        'MySQL 效能優化與 Index 設計',
        'Redis 快取策略與分布式鎖',
        '實際電商系統案例分析',
      ],
      duration: '18-36 小時',
      level: '需基礎程式概念',
      popular: true,
    },
    {
      title: 'React + TypeScript 前端開發',
      subtitle: '現代前端',
      description: '學習 React 18 最新特性，掌握 TypeScript 型別系統，建立可維護的前端應用程式。',
      features: [
        'React Hooks 與狀態管理',
        'TypeScript 型別系統精通',
        'Tailwind CSS 快速開發',
        '前端效能優化技巧',
        '與後端 API 整合實作',
      ],
      duration: '12-24 小時',
      level: '需 JavaScript 基礎',
      popular: false,
    },
    {
      title: '全端專案實作班',
      subtitle: '完整專案',
      description: '從前端到後端，完整專案開發流程。結合 React + Spring Boot，打造真實可用的全端應用。',
      features: [
        '系統架構設計與規劃',
        '前後端分離開發模式',
        'JWT 認證與權限管理',
        'Docker 容器化部署',
        'CI/CD 自動化流程',
      ],
      duration: '24-48 小時',
      level: '需前後端基礎',
      popular: false,
    },
    {
      title: 'AI 輔助開發工作坊',
      subtitle: '效率提升',
      description: '學習如何使用 ChatGPT、GitHub Copilot 等 AI 工具輔助程式開發，提升 3 倍以上開發效率。',
      features: [
        'ChatGPT 輔助程式開發',
        'Prompt Engineering 技巧',
        'AI 程式碼審查與優化',
        'AI 輔助文件撰寫',
        '實際工作流程整合',
      ],
      duration: '6-12 小時',
      level: '需程式開發經驗',
      popular: false,
    },
  ];

  return (
    <section
      id="courses"
      className="py-20 lg:py-32 relative"
      aria-labelledby="courses-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 id="courses-title" className="section-title">
            <span className="gradient-text">課程服務</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            程式講師陳彥彤提供專業的後端開發、前端開發、全端專案與 AI 輔助開發課程
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {courses.map((course, index) => (
            <article
              key={index}
              className={`glass-card p-8 relative overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 ${
                course.popular ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              {/* Popular Badge */}
              {course.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                    熱門推薦
                  </div>
                </div>
              )}

              {/* Course Header */}
              <div className="mb-6">
                <span className="text-primary-400 text-sm font-medium">{course.subtitle}</span>
                <h3 className="text-2xl font-bold text-white mt-1">{course.title}</h3>
              </div>

              {/* Description */}
              <p className="text-gray-400 mb-6">{course.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {course.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>{course.level}</span>
                </div>
              </div>

              {/* CTA */}
              <a
                href="#contact"
                className="inline-flex items-center gap-2 text-primary-400 font-medium hover:text-primary-300 transition-colors"
              >
                了解更多
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-6">
            需要客製化課程或企業內訓？歡迎與我聯繫討論您的需求
          </p>
          <a href="#contact" className="btn-primary inline-flex items-center gap-2">
            <span>預約免費諮詢</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Courses;

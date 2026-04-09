const Courses = () => {
  const courses = [
    {
      title: 'Kubernetes 容器編排實戰教材',
      subtitle: '線上教材',
      description:
        '完整的 Kubernetes 課程教材，從 Linux 基礎到 K8s 叢集部署，含互動式 PPT 簡報。',
      features: [
        'Linux 基礎指令與檔案系統',
        'Docker 容器化技術',
        'Kubernetes 核心概念',
        'Pod / Deployment / Service',
        '互動式簡報教學',
      ],
      duration: '24-48 小時',
      level: '需基礎 Linux 概念',
      popular: false,
      hasMaterial: true,
      materialLink: 'https://yanchen184.github.io/k8s-course-site/',
      rotate: '-0.7deg',
    },
    {
      title: 'Kubernetes 入門到叢集管理員實務班',
      subtitle: '產業人才投資方案',
      description:
        '從 Linux 基礎到容器化技術，一路到 Kubernetes 叢集管理與部署實務，47 小時完整帶你走過一遍。',
      features: [
        'Linux 基礎與容器化技術',
        'Docker 容器操作與管理',
        'Kubernetes Pod / Deployment 管理',
        'Service 與持久化儲存',
        '叢集管理與故障排除',
      ],
      duration: '47 小時',
      level: '需基礎 Linux 概念',
      popular: false,
      official: true,
      officialMeta: {
        period: '2026/03 - 2026/04',
        location: '大同大學，台北',
        source: '勞動部勞動力發展署',
      },
      link: 'https://ojt.wda.gov.tw/ClassSearch/Detail?OCID=170153&plantype=1',
      rotate: '0.5deg',
    },
    {
      title: 'Spring Boot 後端開發實戰',
      subtitle: '主力課程',
      description:
        '從零開始建立企業級後端系統，涵蓋 Spring Boot、Spring Data JPA、MySQL、Redis 等核心技術。',
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
      rotate: '0.8deg',
    },
    {
      title: 'React + TypeScript 前端開發',
      subtitle: '現代前端',
      description:
        '學習 React 18 最新特性，掌握 TypeScript 型別系統，建立可維護的前端應用程式。',
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
      rotate: '-1.2deg',
    },
    {
      title: '全端專案實作班',
      subtitle: '完整專案',
      description:
        '從前端到後端，完整專案開發流程。結合 React + Spring Boot，打造真實可用的全端應用。',
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
      rotate: '0.4deg',
    },
    {
      title: 'AI 輔助開發工作坊',
      subtitle: '效率提升',
      description:
        '學習如何使用 ChatGPT、GitHub Copilot 等 AI 工具輔助程式開發，提升 3 倍以上開發效率。',
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
      rotate: '-0.6deg',
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
          <p className="mono-label mb-3" style={{ transform: 'rotate(-0.4deg)' }}>
            {'/* courses */'}
          </p>
          <h2 id="courses-title" className="section-title">
            <span className="gradient-text">課程服務</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--pencil-grey)' }}>
            程式講師陳彥彤提供專業的後端開發、前端開發、全端專案與 AI 輔助開發課程
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {courses.map((course, index) => (
            <article
              key={index}
              className={`glass-card p-8 relative overflow-visible ${
                course.official ? 'md:col-span-2' : ''
              }`}
              style={{
                transform: `rotate(${course.rotate})`,
                borderStyle: course.popular ? 'dotted' : 'dashed',
                borderWidth: course.popular ? '2px' : '1px',
              }}
            >
              {/* Popular Badge — marker highlight style */}
              {course.popular && (
                <div className="absolute top-0 right-0">
                  <div
                    className="marker-highlight text-xs font-bold px-4 py-1.5"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      transform: 'rotate(2deg)',
                    }}
                  >
                    熱門推薦
                  </div>
                </div>
              )}
              {/* Official Badge */}
              {course.official && (
                <div className="absolute top-0 right-0">
                  <div
                    className="text-xs font-bold px-3 py-1.5"
                    style={{
                      background: 'var(--kraft-brown)',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-mono)',
                      transform: 'rotate(1deg)',
                    }}
                  >
                    實際開課紀錄
                  </div>
                </div>
              )}

              <div className={course.official ? 'grid md:grid-cols-2 gap-8' : ''}>
                <div>
                  {/* Course Header */}
                  <div className="mb-6">
                    <span
                      className="mono-label"
                      style={{ color: course.official ? 'var(--kraft-brown)' : 'var(--pencil-grey)' }}
                    >
                      {course.subtitle}
                    </span>
                    <h3
                      className="text-2xl font-semibold mt-1 tracking-tight"
                      style={{ color: 'var(--marker-black)' }}
                    >
                      {course.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="mb-6" style={{ color: 'var(--pencil-grey)' }}>
                    {course.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {course.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-3">
                        <span
                          className="mt-1 flex-shrink-0"
                          style={{
                            color: 'var(--kraft-brown)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {'>'}
                        </span>
                        <span style={{ color: 'var(--pencil-grey)' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={course.official ? 'flex flex-col justify-between' : ''}>
                  {/* Official course extra info */}
                  {course.official && course.officialMeta && (
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--pencil-grey)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--kraft-brown)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{course.officialMeta.period}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--pencil-grey)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--kraft-brown)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span>{course.officialMeta.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--pencil-grey)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--kraft-brown)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{course.officialMeta.source}</span>
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 mb-6 text-sm" style={{ color: 'var(--pencil-grey)' }}>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--kraft-brown)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--kraft-brown)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span>{course.level}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  {course.hasMaterial ? (
                    <a
                      href={course.materialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
                      style={{
                        border: '1px dashed var(--kraft-brown)',
                        borderRadius: '2px',
                        color: 'var(--marker-black)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      查看教材
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : course.link ? (
                    <a
                      href={course.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-bold mono-label"
                      style={{ color: 'var(--kraft-brown)' }}
                    >
                      課程資訊頁面
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <button
                      onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                      className="inline-flex items-center gap-2 font-bold mono-label cursor-pointer"
                      style={{ color: 'var(--kraft-brown)' }}
                    >
                      聯繫諮詢
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="mb-6" style={{ color: 'var(--pencil-grey)' }}>
            需要客製化課程或企業內訓？歡迎與我聯繫討論您的需求
          </p>
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-primary inline-flex items-center gap-2"
          >
            <span>預約免費諮詢</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Courses;

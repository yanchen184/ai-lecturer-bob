const Courses = () => {
  const courses = [
    {
      title: 'ChatGPT 與 AI 應用實戰',
      subtitle: '企業最熱門課程',
      description: '從零開始學習 ChatGPT，掌握 Prompt Engineering 技巧，將 AI 應用於實際工作場景中。',
      features: [
        'ChatGPT 基礎與進階應用',
        'Prompt Engineering 系統化教學',
        'AI 輔助工作流程設計',
        '實際案例演練與討論',
      ],
      duration: '6-12 小時',
      level: '初學者友善',
      popular: true,
    },
    {
      title: 'Python 程式設計入門',
      subtitle: '程式新手必修',
      description: '專為零基礎學員設計的 Python 課程，從基礎語法到實際專案開發，循序漸進建立程式思維。',
      features: [
        'Python 基礎語法與觀念',
        '資料處理與分析',
        '網頁爬蟲實作',
        '小專案實戰練習',
      ],
      duration: '12-24 小時',
      level: '零基礎可學',
      popular: false,
    },
    {
      title: '機器學習實戰班',
      subtitle: '進階 AI 課程',
      description: '深入了解機器學習核心概念，從監督式學習到非監督式學習，建立完整的 ML 知識體系。',
      features: [
        '機器學習理論基礎',
        'Scikit-learn 實戰應用',
        '特徵工程與模型調校',
        '真實數據集專案練習',
      ],
      duration: '18-36 小時',
      level: '需程式基礎',
      popular: false,
    },
    {
      title: '企業 AI 轉型顧問',
      subtitle: '客製化服務',
      description: '為企業量身打造 AI 導入策略，從需求評估到實際落地，協助企業在 AI 時代取得競爭優勢。',
      features: [
        'AI 應用場景評估',
        '員工 AI 素養培訓',
        '工具導入與流程優化',
        '持續追蹤與優化',
      ],
      duration: '依需求客製',
      level: '企業專屬',
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
            AI講師陳彥彤提供多元化的人工智慧與程式教學課程，滿足不同程度學員的學習需求
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

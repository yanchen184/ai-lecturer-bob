const Hero = () => {
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 bg-white"
      aria-label="首頁橫幅"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Main Content */}
        <div className="animate-fade-in text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-bento-card mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
            <span className="text-sm text-bento-text-secondary">目前開放企業培訓與程式教學諮詢</span>
          </div>

          {/* Title - SEO H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-bento-text-secondary">你好，我是</span>
            <br />
            <span className="gradient-text">程式講師陳彥彤</span>
          </h1>

          {/* Subtitle - SEO keywords */}
          <p className="text-xl sm:text-2xl text-bento-text-secondary mb-4 max-w-3xl mx-auto">
            <strong className="text-bento-text">資深後端工程師</strong> / <strong className="text-bento-text">技術講師</strong>
          </p>

          {/* Description with keywords */}
          <p className="text-lg text-bento-text-secondary mb-8 max-w-2xl mx-auto">
            專精於 <span className="text-primary-500 font-medium">Spring Boot</span>、
            <span className="text-accent-500 font-medium">React</span>、
            <span className="text-primary-500 font-medium">MySQL</span>、
            <span className="text-accent-500 font-medium">Redis</span> 開發教學
            <br />
            <strong className="text-bento-text">5-6 年</strong>電商核心系統開發經驗，
            <strong className="text-bento-text">10-50 場</strong>企業授課經歷
          </p>

          {/* Quote */}
          <div className="mb-8 text-bento-text-secondary italic text-lg">
            <span className="text-primary-500">&ldquo;</span>
            工程師不是寫 code 的人，是解決問題的人。
            <span className="text-primary-500">&rdquo;</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#contact"
              className="btn-primary inline-flex items-center gap-2"
            >
              <span>預約課程諮詢</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#courses"
              className="px-8 py-4 bg-bento-card text-bento-text font-medium rounded-full hover:bg-bento-card-hover transition-all duration-300"
            >
              瀏覽課程內容
            </a>
          </div>
        </div>

        {/* Stats - Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[
            { number: '5-6 年', label: 'Java 後端開發經驗' },
            { number: '10-50 場', label: '企業授課經歷' },
            { number: 'AZ-900', label: 'Azure 雲端認證' },
            { number: '98%', label: '學員滿意度' },
          ].map((stat, index) => (
            <div key={index} className="bento-card text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.number}</div>
              <div className="text-bento-text-secondary text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#about" aria-label="向下滾動">
          <svg className="w-6 h-6 text-bento-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default Hero;

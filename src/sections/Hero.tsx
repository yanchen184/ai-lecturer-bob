const Hero = () => {
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center relative overflow-hidden pt-20"
      aria-label="首頁橫幅"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="animate-fade-in">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 mb-10 border-b border-bold-border pb-2">
            <span className="w-2 h-2 bg-bold-accent" />
            <span className="text-sm text-bold-muted uppercase tracking-widest font-medium">目前開放企業培訓與程式教學諮詢</span>
          </div>

          {/* Title - SEO H1, poster-style oversized type */}
          <h1 className="text-display-xl font-bold tracking-ultra-tight mb-8 leading-[0.9]">
            <span className="text-bold-muted block text-display-sm font-medium tracking-tight-bold mb-4">你好，我是</span>
            <span className="text-bold-text block">程式講師</span>
            <span className="text-bold-accent block">陳彥彤</span>
          </h1>

          {/* Subtitle */}
          <p className="text-display-sm text-bold-muted mb-6 max-w-3xl font-medium">
            <strong className="text-bold-text">資深後端工程師</strong> / <strong className="text-bold-text">技術講師</strong>
          </p>

          {/* Description */}
          <p className="text-lg text-bold-muted mb-10 max-w-2xl leading-relaxed">
            專精於 Spring Boot、React、MySQL、Redis 開發教學
            <br />
            <strong className="text-bold-text">5-6 年</strong>電商核心系統開發經驗，
            <strong className="text-bold-text">10-50 場</strong>企業授課經歷
          </p>

          {/* Quote */}
          <div className="mb-12 text-bold-muted italic text-xl border-l-2 border-bold-accent pl-6">
            工程師不是寫 code 的人，是解決問題的人。
          </div>

          {/* CTA — underline style */}
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <a
              href="#contact"
              className="btn-primary"
            >
              <span>預約課程諮詢</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#courses"
              className="inline-flex items-center gap-2 text-bold-muted font-bold text-lg border-b-2 border-bold-border pb-1 hover:border-bold-text hover:text-bold-text transition-all duration-200"
            >
              瀏覽課程內容
            </a>
          </div>
        </div>

        {/* Stats — flat grid with 1px gap */}
        <div className="mt-22 grid grid-cols-2 md:grid-cols-4 gap-px bg-bold-border animate-slide-up">
          {[
            { number: '5-6 年', label: 'Java 後端開發經驗' },
            { number: '10-50 場', label: '企業授課經歷' },
            { number: 'AZ-900', label: 'Azure 雲端認證' },
            { number: '98%', label: '學員滿意度' },
          ].map((stat, index) => (
            <div key={index} className="bg-bold-bg p-8">
              <div className="text-3xl md:text-4xl font-bold text-bold-accent tracking-tight-bold mb-2">{stat.number}</div>
              <div className="text-bold-muted text-sm uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <a href="#about" aria-label="向下滾動">
          <svg className="w-6 h-6 text-bold-muted hover:text-bold-accent transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default Hero;

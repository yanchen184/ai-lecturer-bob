const Hero = () => {
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center relative overflow-hidden pt-20"
      style={{ backgroundColor: '#FAFAFA' }}
      aria-label="首頁橫幅"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="animate-fade-in">
          {/* Status Badge */}
          <div
            className="inline-flex items-center gap-2 mb-10 px-4 py-2"
            style={{ border: '3px solid #000', boxShadow: '3px 3px 0 #000', backgroundColor: '#FFEB3B' }}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4CAF50' }} />
            <span className="text-sm text-black uppercase tracking-widest font-bold">目前開放企業培訓與程式教學諮詢</span>
          </div>

          {/* Title - SEO H1 */}
          <h1 className="text-display-xl font-black tracking-ultra-tight mb-8 leading-[0.9]">
            <span className="text-bold-muted block text-display-sm font-bold tracking-tight-bold mb-4">你好，我是</span>
            <span className="text-black block">程式講師</span>
            <span className="block relative inline-block">
              <span className="relative z-10">陳彥彤</span>
              <span
                className="absolute bottom-1 left-0 w-full h-5 -z-0"
                style={{ backgroundColor: '#FFEB3B' }}
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-display-sm text-bold-muted mb-6 max-w-3xl font-bold">
            <strong className="text-black">資深後端工程師</strong> / <strong className="text-black">技術講師</strong>
          </p>

          {/* Description */}
          <p className="text-lg text-bold-muted mb-10 max-w-2xl leading-relaxed">
            專精於 Spring Boot、React、MySQL、Redis 開發教學
            <br />
            <strong className="text-black">5-6 年</strong>電商核心系統開發經驗，
            <strong className="text-black">10-50 場</strong>企業授課經歷
          </p>

          {/* Quote */}
          <div
            className="mb-12 text-black font-bold text-xl pl-6"
            style={{ borderLeft: '6px solid #2196F3' }}
          >
            工程師不是寫 code 的人，是解決問題的人。
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-8 py-4 font-black text-lg text-black uppercase tracking-wider transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-0"
              style={{
                backgroundColor: '#FFEB3B',
                border: '3px solid #000',
                boxShadow: '5px 5px 0 #000',
              }}
            >
              <span>預約課程諮詢</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#courses"
              className="inline-flex items-center gap-2 px-8 py-4 font-black text-lg text-black uppercase tracking-wider transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-0"
              style={{
                backgroundColor: '#FFFFFF',
                border: '3px solid #000',
                boxShadow: '5px 5px 0 #000',
              }}
            >
              瀏覽課程內容
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-22 grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          {[
            { number: '5-6 年', label: 'Java 後端開發經驗', color: '#FFEB3B' },
            { number: '10-50 場', label: '企業授課經歷', color: '#2196F3' },
            { number: 'AZ-900', label: 'Azure 雲端認證', color: '#FF5252' },
            { number: '98%', label: '學員滿意度', color: '#4CAF50' },
          ].map((stat, index) => (
            <div
              key={index}
              className="p-6"
              style={{
                backgroundColor: stat.color,
                border: '3px solid #000',
                boxShadow: '5px 5px 0 #000',
              }}
            >
              <div className="text-3xl md:text-4xl font-black text-black tracking-tight-bold mb-2">{stat.number}</div>
              <div className="text-black text-sm uppercase tracking-wider font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <a href="#about" aria-label="向下滾動">
          <svg className="w-6 h-6 text-black hover:text-bold-muted transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default Hero;

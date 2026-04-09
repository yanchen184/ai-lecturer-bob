const Hero = () => {
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20"
      style={{ backgroundColor: '#F5F0E1' }}
      aria-label="首頁橫幅"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Main Content */}
        <div className="animate-fade-in text-center mb-16">
          {/* Badge */}
          <div
            className="inline-flex items-center px-4 py-2 rounded-full mb-8"
            style={{ backgroundColor: '#FEFDFB', boxShadow: '0 1px 3px rgba(61,46,28,0.06)' }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse mr-2"
              style={{ backgroundColor: '#6B7B3C' }}
            />
            <span className="text-sm" style={{ color: '#6B6255' }}>
              目前開放企業培訓與程式教學諮詢
            </span>
          </div>

          {/* Title - SEO H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span style={{ color: '#6B6255', fontFamily: 'Inter, sans-serif' }}>你好，我是</span>
            <br />
            <span
              style={{
                color: '#C67B5C',
                fontFamily: 'Georgia, "Noto Sans TC", serif',
                fontWeight: 700,
              }}
            >
              程式講師陳彥彤
            </span>
          </h1>

          {/* Subtitle - SEO keywords */}
          <p className="text-xl sm:text-2xl mb-4 max-w-3xl mx-auto" style={{ color: '#6B6255' }}>
            <strong style={{ color: '#3D2E1C' }}>資深後端工程師</strong> /{' '}
            <strong style={{ color: '#3D2E1C' }}>技術講師</strong>
          </p>

          {/* Description with keywords */}
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#6B6255' }}>
            專精於 <span style={{ color: '#C67B5C' }} className="font-medium">Spring Boot</span>、
            <span style={{ color: '#6B7B3C' }} className="font-medium">React</span>、
            <span style={{ color: '#C67B5C' }} className="font-medium">MySQL</span>、
            <span style={{ color: '#6B7B3C' }} className="font-medium">Redis</span> 開發教學
            <br />
            <strong style={{ color: '#3D2E1C' }}>5-6 年</strong>電商核心系統開發經驗，
            <strong style={{ color: '#3D2E1C' }}>10-50 場</strong>企業授課經歷
          </p>

          {/* Quote */}
          <div className="mb-8 italic text-lg" style={{ color: '#6B6255' }}>
            <span style={{ color: '#C67B5C', fontFamily: 'Georgia, serif', fontSize: '1.5em' }}>
              &ldquo;
            </span>
            <span style={{ fontFamily: 'Georgia, "Noto Sans TC", serif' }}>
              工程師不是寫 code 的人，是解決問題的人。
            </span>
            <span style={{ color: '#C67B5C', fontFamily: 'Georgia, serif', fontSize: '1.5em' }}>
              &rdquo;
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#contact"
              className="btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-full font-medium text-base"
            >
              <span>預約課程諮詢</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#courses"
              className="px-8 py-4 font-medium rounded-full transition-all duration-500"
              style={{
                backgroundColor: 'transparent',
                color: '#6B7B3C',
                border: '1.5px solid #6B7B3C',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6B7B3C';
                e.currentTarget.style.color = '#FEFDFB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6B7B3C';
              }}
            >
              瀏覽課程內容
            </a>
          </div>
        </div>

        {/* Stats - Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[
            { number: '5-6 年', label: 'Java 後端開發經驗' },
            { number: '10-50 場', label: '企業授課經歷' },
            { number: 'AZ-900', label: 'Azure 雲端認證' },
            { number: '98%', label: '學員滿意度' },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-bento-lg transition-all duration-500"
              style={{
                backgroundColor: '#FEFDFB',
                boxShadow: '0 1px 3px rgba(61,46,28,0.06), 0 4px 16px rgba(61,46,28,0.04)',
              }}
            >
              <div
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ color: '#C67B5C', fontFamily: 'Georgia, serif' }}
              >
                {stat.number}
              </div>
              <div className="text-sm" style={{ color: '#6B6255' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#about" aria-label="向下滾動">
          <svg className="w-6 h-6" style={{ color: '#B5651D' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default Hero;

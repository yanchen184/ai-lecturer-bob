const Hero = () => {
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20"
      aria-label="首頁橫幅"
    >
      {/* Floating Iridescent Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large blue orb */}
        <div
          className="absolute w-[420px] h-[420px] rounded-full blur-[100px] opacity-40"
          style={{
            top: '15%',
            left: '10%',
            background: 'radial-gradient(circle, rgba(0,122,255,0.3) 0%, rgba(0,122,255,0.05) 70%, transparent 100%)',
            animation: 'orbFloat 10s ease-in-out infinite',
          }}
        />
        {/* Large purple orb */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-35"
          style={{
            bottom: '20%',
            right: '10%',
            background: 'radial-gradient(circle, rgba(175,82,222,0.25) 0%, rgba(175,82,222,0.05) 70%, transparent 100%)',
            animation: 'orbFloat 12s ease-in-out infinite 2s',
          }}
        />
        {/* Medium green orb */}
        <div
          className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-30"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(52,199,89,0.2) 0%, rgba(52,199,89,0.03) 70%, transparent 100%)',
            animation: 'orbFloat 14s ease-in-out infinite 4s',
          }}
        />
        {/* Small pink accent orb */}
        <div
          className="absolute w-[200px] h-[200px] rounded-full blur-[60px] opacity-25"
          style={{
            top: '10%',
            right: '25%',
            background: 'radial-gradient(circle, rgba(255,107,157,0.2) 0%, transparent 70%)',
            animation: 'orbFloat 8s ease-in-out infinite 1s',
          }}
        />
        {/* Cyan accent orb */}
        <div
          className="absolute w-[250px] h-[250px] rounded-full blur-[70px] opacity-25"
          style={{
            bottom: '30%',
            left: '30%',
            background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)',
            animation: 'orbFloat 11s ease-in-out infinite 3s',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Content */}
        <div className="animate-fade-in">
          {/* Badge - Liquid Glass pill */}
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-white/[0.06] backdrop-blur-glass border border-white/[0.15] mb-8 shadow-[0_4px_16px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.25)]">
            <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse mr-2.5" />
            <span className="text-sm text-white/70 font-light tracking-wide">目前開放企業培訓與程式教學諮詢</span>
          </div>

          {/* Title - SEO H1 with chromatic aberration */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-white/90 font-light">你好，我是</span>
            <br />
            <span
              className="gradient-text font-bold"
              style={{ animation: 'chromaticAberration 8s ease-in-out infinite, iridescentText 6s ease-in-out infinite' }}
            >
              程式講師陳彥彤
            </span>
          </h1>

          {/* Subtitle - SEO keywords */}
          <p className="text-xl sm:text-2xl text-white/60 mb-4 max-w-3xl mx-auto font-light">
            <strong className="text-primary-400 font-semibold">資深後端工程師</strong> / <strong className="text-accent-400 font-semibold">技術講師</strong>
          </p>

          {/* Description with keywords */}
          <p className="text-lg text-white/40 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            專精於 <span className="text-primary-300/80">Spring Boot</span>、
            <span className="text-accent-300/80">React</span>、
            <span className="text-primary-300/80">MySQL</span>、
            <span className="text-accent-300/80">Redis</span> 開發教學
            <br />
            <strong className="text-white/70 font-medium">5-6 年</strong>電商核心系統開發經驗，
            <strong className="text-white/70 font-medium">10-50 場</strong>企業授課經歷
          </p>

          {/* Quote - Liquid Glass style */}
          <div className="mb-10 text-white/50 italic font-light text-lg">
            <span className="text-primary-400/80">&ldquo;</span>
            工程師不是寫 code 的人，是解決問題的人。
            <span className="text-primary-400/80">&rdquo;</span>
          </div>

          {/* CTA Buttons - Liquid Glass */}
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
              className="px-8 py-4 bg-white/[0.06] backdrop-blur-glass border border-white/[0.15] text-white/80 font-medium rounded-glass hover:bg-white/[0.12] hover:border-white/[0.25] transition-all duration-500 shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)]"
            >
              瀏覽課程內容
            </a>
          </div>
        </div>

        {/* Stats - Liquid Glass cards with iridescent borders */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[
            { number: '5-6 年', label: 'Java 後端開發經驗' },
            { number: '10-50 場', label: '企業授課經歷' },
            { number: 'AZ-900', label: 'Azure 雲端認證' },
            { number: '98%', label: '學員滿意度' },
          ].map((stat, index) => (
            <div
              key={index}
              className="glass-card p-6"
              style={{ animation: `glowPulseIridescent 6s ease-in-out infinite ${index * 1.5}s` }}
            >
              <div className="text-2xl md:text-3xl font-bold gradient-text mb-2">{stat.number}</div>
              <div className="text-white/40 text-sm font-light">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-soft">
        <a href="#about" aria-label="向下滾動">
          <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default Hero;

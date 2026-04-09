const Hero = () => {
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20"
      aria-label="首頁橫幅"
    >
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl glass-orb" style={{ background: 'rgba(102,126,234,0.15)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl glass-orb-reverse" style={{ background: 'rgba(118,75,162,0.15)', animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(102,126,234,0.08), rgba(118,75,162,0.05))' }} />
        <div className="absolute top-[10%] right-[15%] w-64 h-64 rounded-full blur-3xl glass-orb" style={{ background: 'rgba(139,156,247,0.1)', animationDelay: '-5s' }} />
        <div className="absolute bottom-[15%] left-[10%] w-72 h-72 rounded-full blur-3xl glass-orb-reverse" style={{ background: 'rgba(118,75,162,0.1)', animationDelay: '-7s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          {/* Frosted Glass Badge */}
          <div className="inline-flex items-center px-5 py-2.5 rounded-full mb-8" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse mr-2" style={{ background: '#667EEA' }} />
            <span className="text-sm text-white/80">目前開放企業培訓與程式教學諮詢</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white/90">你好，我是</span>
            <br />
            <span className="gradient-text">程式講師陳彥彤</span>
          </h1>

          <p className="text-xl sm:text-2xl mb-4 max-w-3xl mx-auto">
            <strong style={{ color: '#667EEA' }}>資深後端工程師</strong>
            <span className="text-white/40 mx-2">/</span>
            <strong style={{ color: '#764BA2' }}>技術講師</strong>
          </p>

          <p className="text-white/60 mb-8 max-w-2xl mx-auto font-mono text-sm leading-relaxed">
            <span className="text-white/40">{'>'}</span> 專精於{' '}
            <span style={{ color: '#667EEA' }}>Spring Boot</span>、
            <span style={{ color: '#764BA2' }}>React</span>、
            <span style={{ color: '#8B9CF7' }}>MySQL</span>、
            <span style={{ color: '#667EEA' }}>Redis</span> 開發教學
            <br />
            <span className="text-white/40">{'>'}</span>{' '}
            <strong className="text-white">5-6 年</strong>電商核心系統開發經驗，
            <strong className="text-white">10-50 場</strong>企業授課經歷
          </p>

          <div className="mb-8 text-white/60 italic font-mono">
            <span style={{ color: '#667EEA' }}>{'//'}</span>{' '}
            工程師不是寫 code 的人，是解決問題的人。
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="#contact" className="btn-primary inline-flex items-center gap-2">
              <span>預約課程諮詢</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#courses"
              className="px-8 py-4 font-medium rounded-full transition-all duration-300"
              style={{ border: '1px solid rgba(102,126,234,0.4)', color: '#667EEA', background: 'rgba(102,126,234,0.05)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(102,126,234,0.15)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(102,126,234,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(102,126,234,0.05)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              瀏覽課程內容
            </a>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[
            { number: '5-6 年', label: 'Java 後端開發經驗' },
            { number: '10-50 場', label: '企業授課經歷' },
            { number: 'AZ-900', label: 'Azure 雲端認證' },
            { number: '98%', label: '學員滿意度' },
          ].map((stat, index) => (
            <div key={index} className="glass-card p-6 group transition-all duration-300">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2 font-mono">{stat.number}</div>
              <div className="text-white/50 text-sm group-hover:text-white/70 transition-colors">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#about" aria-label="向下滾動">
          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default Hero;

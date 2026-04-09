const Hero = () => {
  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20" aria-label="首頁橫幅">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00FFFF]/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF006E]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#00FFFF]/5 via-[#FF006E]/5 to-[#0080FF]/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#00FFFF]/20 to-transparent animate-scan-line" />
        </div>
      </div>
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (<div key={i} className="absolute w-1 h-1 bg-[#00FFFF]/30 rounded-full animate-circuit-pulse" style={{ top: `${15 + i * 15}%`, left: `${10 + i * 12}%`, animationDelay: `${i * 0.7}s` }} />))}
        {[...Array(6)].map((_, i) => (<div key={`r-${i}`} className="absolute w-1 h-1 bg-[#FF006E]/30 rounded-full animate-circuit-pulse" style={{ top: `${20 + i * 12}%`, right: `${8 + i * 10}%`, animationDelay: `${i * 0.5 + 0.3}s` }} />))}
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#00FFFF]/5 backdrop-blur-lg border border-[#00FFFF]/20 mb-8">
            <span className="w-2 h-2 bg-[#00FFFF] rounded-full animate-pulse mr-2" />
            <span className="text-sm text-[#00FFFF]/80 font-mono">SYSTEM_ONLINE: 目前開放企業培訓與程式教學諮詢</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gray-200">你好，我是</span><br />
            <span className="glitch-text gradient-text text-glow-green">程式講師陳彥彤</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            <strong className="text-[#00FFFF]">資深後端工程師</strong>
            <span className="text-neon-blue mx-2">/</span>
            <strong className="text-[#FF006E]">技術講師</strong>
          </p>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto font-mono text-sm leading-relaxed">
            <span className="text-[#00FFFF]/60">{'>'}</span> 專精於 <span className="text-[#00FFFF]">Spring Boot</span>、<span className="text-[#FF006E]">React</span>、<span className="text-[#0080FF]">MySQL</span>、<span className="text-[#00FFFF]">Redis</span> 開發教學<br />
            <span className="text-[#00FFFF]/60">{'>'}</span> <strong className="text-white">5-6 年</strong>電商核心系統開發經驗，<strong className="text-white">10-50 場</strong>企業授課經歷
          </p>
          <div className="mb-8 text-gray-300 italic font-mono">
            <span className="text-[#00FFFF]">{'//'}</span> 工程師不是寫 code 的人，是解決問題的人。
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="#contact" className="btn-primary inline-flex items-center gap-2">
              <span>預約課程諮詢</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
            <a href="#courses" className="px-8 py-4 border border-[#00FFFF]/30 text-[#00FFFF] font-medium rounded-full hover:bg-[#00FFFF]/10 hover:border-[#00FFFF]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.15)]">瀏覽課程內容</a>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[{ number: '5-6 年', label: 'Java 後端開發經驗' }, { number: '10-50 場', label: '企業授課經歷' }, { number: 'AZ-900', label: 'Azure 雲端認證' }, { number: '98%', label: '學員滿意度' }].map((stat, index) => (
            <div key={index} className="glass-card p-6 group hover:border-[#00FFFF]/30 transition-all duration-300">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2 font-mono">{stat.number}</div>
              <div className="text-gray-500 text-sm group-hover:text-gray-400 transition-colors">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#about" aria-label="向下滾動"><svg className="w-6 h-6 text-[#00FFFF]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg></a>
      </div>
    </section>
  );
};
export default Hero;

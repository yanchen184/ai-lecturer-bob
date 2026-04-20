import { useEffect, useRef } from 'react';

const scrollTo = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const Hero = () => {
  const revealRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-center relative overflow-hidden"
      aria-label="首頁橫幅"
      style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)' }}
    >
      {/* Cinematic dark overlay grain */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />

      {/* Subtle radial glow from center */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(15,52,96,0.4) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 pb-16">
        {/* Main Content */}
        <div
          ref={(el) => { revealRefs.current[0] = el; }}
          className="scroll-reveal"
        >
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full border mb-10" style={{ background: 'rgba(22,33,62,0.6)', borderColor: 'rgba(15,52,96,0.6)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse mr-2" style={{ background: '#e94560' }} />
            <span className="text-sm" style={{ color: '#8892b0' }}>目前開放企業培訓與程式教學諮詢</span>
          </div>

          {/* Title - SEO H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">你好，我是</span>
            <br />
            <span className="gradient-text">程式講師陳彥彤</span>
          </h1>

          {/* Subtitle - SEO keywords */}
          <p className="text-xl sm:text-2xl mb-4 max-w-3xl mx-auto" style={{ color: '#8892b0' }}>
            <strong className="text-white">資深後端工程師</strong> / <strong style={{ color: '#e94560' }}>技術講師</strong>
          </p>

          {/* Description with keywords */}
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#8892b0' }}>
            專精於 <span className="text-white">Spring Boot</span>、
            <span className="text-white">React</span>、
            <span className="text-white">MySQL</span>、
            <span className="text-white">Redis</span> 開發教學
            <br />
            <strong className="text-white">5-6 年</strong>電商核心系統開發經驗，
            <strong className="text-white">10-50 場</strong>企業授課經歷
          </p>

          {/* Quote */}
          <div className="mb-10 italic" style={{ color: '#8892b0' }}>
            <span style={{ color: '#e94560' }}>"</span>
            工程師不是寫 code 的人，是解決問題的人。
            <span style={{ color: '#e94560' }}>"</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#contact" onClick={scrollTo('contact')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <span>預約課程諮詢</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#courses" onClick={scrollTo('courses')}
              className="px-8 py-4 border font-medium rounded-full transition-all duration-600"
              style={{ borderColor: 'rgba(15,52,96,0.8)', color: '#8892b0' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e94560'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(15,52,96,0.8)'; e.currentTarget.style.color = '#8892b0'; }}
            >
              瀏覽課程內容
            </a>
          </div>
        </div>

        {/* Stats — horizontal strip */}
        <div
          ref={(el) => { revealRefs.current[1] = el; }}
          className="scroll-reveal mt-24"
        >
          <hr className="chapter-divider mb-12" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: '5-6 年', label: 'Java 後端開發經驗' },
              { number: '10-50 場', label: '企業授課經歷' },
              { number: 'AZ-900', label: 'Azure 雲端認證' },
              { number: '98%', label: '學員滿意度' },
            ].map((stat, index) => (
              <div key={index} className="glass-card p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#e94560' }}>{stat.number}</div>
                <div className="text-sm" style={{ color: '#8892b0' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#about" onClick={scrollTo('about')} aria-label="向下滾動">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(233,69,96,0.6)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default Hero;

import { useEffect, useRef } from 'react';

const STATS = [
  { number: '5-6 年', label: 'Java 後端開發經驗' },
  { number: '10-50 場', label: '企業授課經歷' },
  { number: 'AZ-900', label: 'Azure 雲端認證' },
  { number: '98%', label: '學員滿意度' },
] as const;

const scrollTo = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const revealEls = section.querySelectorAll('.scroll-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    revealEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20"
      aria-label="首頁橫幅"
    >
      {/* Subtle radial glow behind title — indigo/pink, very low opacity */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(236,72,153,0.04) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div
          className="scroll-reveal stagger-1 inline-flex items-center px-5 py-2.5 rounded-full mb-8"
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse mr-2.5"
            style={{ background: '#6366F1' }}
          />
          <span className="text-sm font-mono" style={{ color: '#9CA3AF' }}>
            目前開放企業培訓與程式教學諮詢
          </span>
        </div>

        {/* Title */}
        <h1
          className="scroll-reveal stagger-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
          style={{ letterSpacing: '-0.03em' }}
        >
          <span className="text-white">你好，我是</span>
          <br />
          <span className="gradient-text">程式講師陳彥彤</span>
        </h1>

        {/* Role */}
        <p className="scroll-reveal stagger-3 text-xl sm:text-2xl mb-4 max-w-3xl mx-auto">
          <strong style={{ color: '#6366F1' }}>資深後端工程師</strong>
          <span className="mx-2" style={{ color: '#374151' }}>/</span>
          <strong style={{ color: '#EC4899' }}>技術講師</strong>
        </p>

        {/* Tech stack description */}
        <p
          className="scroll-reveal stagger-4 mb-8 max-w-2xl mx-auto font-mono text-sm leading-relaxed"
          style={{ color: '#6B7280' }}
        >
          <span style={{ color: '#374151' }}>{'>'}</span> 專精於{' '}
          <span style={{ color: '#6366F1' }}>Spring Boot</span>、
          <span style={{ color: '#EC4899' }}>React</span>、
          <span style={{ color: '#818CF8' }}>MySQL</span>、
          <span style={{ color: '#F59E0B' }}>Redis</span> 開發教學
          <br />
          <span style={{ color: '#374151' }}>{'>'}</span>{' '}
          <strong className="text-white">5-6 年</strong>電商核心系統開發經驗，
          <strong className="text-white">10-50 場</strong>企業授課經歷
        </p>

        {/* Quote */}
        <div
          className="scroll-reveal stagger-5 mb-8 italic font-mono"
          style={{ color: '#6B7280' }}
        >
          <span style={{ color: '#6366F1' }}>{'//'}</span>{' '}
          工程師不是寫 code 的人，是解決問題的人。
        </div>

        {/* CTA Buttons */}
        <div className="scroll-reveal stagger-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href="#contact" onClick={scrollTo('contact')} className="btn-primary inline-flex items-center gap-2">
            <span>預約課程諮詢</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a
            href="#courses" onClick={scrollTo('courses')}
            className="px-8 py-4 font-medium rounded-xl transition-all duration-300"
            style={{
              border: '1px solid #1F1F1F',
              color: '#9CA3AF',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366F1';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1F1F1F';
              e.currentTarget.style.color = '#9CA3AF';
            }}
          >
            瀏覽課程內容
          </a>
        </div>

        {/* Stats grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={`scroll-reveal stagger-${index + 1} motion-card p-6`}
            >
              <div
                className="text-3xl md:text-4xl font-extrabold gradient-text mb-2 font-mono"
                style={{ letterSpacing: '-0.02em' }}
              >
                {stat.number}
              </div>
              <div className="text-sm" style={{ color: '#6B7280' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#about" onClick={scrollTo('about')} aria-label="向下滾動">
          <svg
            className="w-6 h-6"
            style={{ color: '#374151' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default Hero;

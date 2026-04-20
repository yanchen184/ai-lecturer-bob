const scrollTo = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const Hero = () => {
  const stats = [
    { number: '5-6 年', label: 'Java 後端開發經驗', rotate: '-1.5deg' },
    { number: '10-50 場', label: '企業授課經歷', rotate: '0.8deg' },
    { number: 'AZ-900', label: 'Azure 雲端認證', rotate: '-0.5deg' },
    { number: '98%', label: '學員滿意度', rotate: '1.2deg' },
  ];

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20"
      aria-label="首頁橫幅"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div>
          {/* Developer comment annotation */}
          <p className="mono-label mb-4" style={{ transform: 'rotate(-0.5deg)' }}>
            {'// hello world'}
          </p>

          {/* Badge - sketch pill */}
          <div
            className="inline-flex items-center px-5 py-2.5 mb-8"
            style={{
              border: '1px dashed var(--kraft-brown)',
              borderRadius: '2px',
            }}
          >
            <span
              className="w-2 h-2 rounded-full mr-2.5"
              style={{ background: 'var(--kraft-brown)' }}
            />
            <span className="mono-label">目前開放企業培訓與程式教學諮詢</span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <span style={{ color: 'var(--pencil-grey)', fontWeight: 400 }}>你好，我是</span>
            <br />
            <span className="marker-highlight" style={{ transform: 'rotate(-1deg)' }}>
              程式講師陳彥彤
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-xl sm:text-2xl mb-4 max-w-3xl mx-auto"
            style={{ color: 'var(--pencil-grey)' }}
          >
            <strong
              className="hand-underline"
              style={{ color: 'var(--marker-black)', fontWeight: 600 }}
            >
              資深後端工程師
            </strong>
            {' / '}
            <strong
              className="hand-underline"
              style={{ color: 'var(--marker-black)', fontWeight: 600 }}
            >
              技術講師
            </strong>
          </p>

          {/* Description */}
          <p
            className="text-lg mb-8 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--pencil-grey)' }}
          >
            專精於{' '}
            <span style={{ color: 'var(--marker-black)', fontWeight: 600 }}>Spring Boot</span>、
            <span style={{ color: 'var(--marker-black)', fontWeight: 600 }}>React</span>、
            <span style={{ color: 'var(--marker-black)', fontWeight: 600 }}>MySQL</span>、
            <span style={{ color: 'var(--marker-black)', fontWeight: 600 }}>Redis</span> 開發教學
            <br />
            <strong style={{ color: 'var(--marker-black)' }}>5-6 年</strong>電商核心系統開發經驗，
            <strong style={{ color: 'var(--marker-black)' }}>10-50 場</strong>企業授課經歷
          </p>

          {/* Quote */}
          <div
            className="mb-10 italic text-lg"
            style={{ color: 'var(--pencil-grey)', fontFamily: 'var(--font-body)' }}
          >
            <span style={{ color: 'var(--kraft-brown)' }}>&ldquo;</span>
            工程師不是寫 code 的人，是解決問題的人。
            <span style={{ color: 'var(--kraft-brown)' }}>&rdquo;</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="#contact" onClick={scrollTo('contact')} className="btn-primary inline-flex items-center gap-2">
              <span>預約課程諮詢</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
            <a
              href="#courses" onClick={scrollTo('courses')}
              className="px-8 py-4 font-medium"
              style={{
                border: '1px dashed var(--kraft-brown)',
                borderRadius: '2px',
                color: 'var(--marker-black)',
                fontFamily: 'var(--font-mono)',
                background: 'transparent',
              }}
            >
              瀏覽課程內容
            </a>
          </div>
        </div>

        {/* Stats - sketch cards with varied rotation */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass-card p-6"
              style={{ transform: `rotate(${stat.rotate})` }}
            >
              <div
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color: 'var(--kraft-brown)', fontFamily: 'var(--font-mono)' }}
              >
                {stat.number}
              </div>
              <div
                className="text-sm"
                style={{ color: 'var(--pencil-grey)', fontFamily: 'var(--font-mono)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <a href="#about" onClick={scrollTo('about')} aria-label="向下滾動">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--pencil-grey)' }}
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

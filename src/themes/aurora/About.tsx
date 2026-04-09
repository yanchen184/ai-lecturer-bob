import { useEffect, useRef } from 'react';

const About = () => {
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.15 }
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      className="py-32 lg:py-40 relative"
      aria-labelledby="about-title"
      style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)' }}
    >
      <hr className="chapter-divider" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        {/* Chapter Label */}
        <div
          ref={(el) => { revealRefs.current[0] = el; }}
          className="scroll-reveal mb-16"
        >
          <span className="chapter-label">01 — 關於</span>
          <h2 id="about-title" className="section-title text-left">
            <span className="gradient-text">關於我</span>
          </h2>
          <p className="text-lg" style={{ color: '#8892b0' }}>About Me - 程式講師陳彥彤</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Profile Card */}
          <div
            ref={(el) => { revealRefs.current[1] = el; }}
            className="scroll-reveal"
          >
            <div className="glass-card p-8 md:p-12">
              <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full p-[3px] mb-6" style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}>
                <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: '#1a1a2e' }}>
                  <span className="text-5xl md:text-6xl font-bold" style={{ color: '#e94560' }}>彥</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-center text-white mb-2">陳彥彤</h3>
              <p className="text-center mb-4" style={{ color: '#e94560' }}>資深後端工程師 / 程式講師</p>

              {/* Quote */}
              <div className="text-center mb-6 px-4">
                <p className="italic text-lg" style={{ color: '#8892b0' }}>
                  <span style={{ color: '#e94560' }}>"</span>
                  工程師不是寫 code 的人，是解決問題的人。
                  <span style={{ color: '#e94560' }}>"</span>
                </p>
              </div>

              {/* Quick Info */}
              <div className="space-y-3" style={{ color: '#8892b0' }}>
                {[
                  { icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', text: '5-6 年 Java 後端開發經驗' },
                  { icon: 'M12 14l9-5-9-5-9 5 9 5z', text: '輔仁大學 統計資訊系', extra: 'M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
                  { icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', text: 'Microsoft AZ-900 認證' },
                  { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', text: '台北市 / 遠端授課', extra: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#e94560' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      {item.extra && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.extra} />}
                    </svg>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div
            ref={(el) => { revealRefs.current[2] = el; }}
            className="scroll-reveal"
          >
            <div className="space-y-6 leading-relaxed" style={{ color: '#8892b0' }}>
              <p>
                大家好，我是<strong className="text-white">陳彥彤</strong>，
                一位<strong className="text-white">資深後端工程師</strong>兼<strong style={{ color: '#e94560' }}>程式講師</strong>。
                擁有 <strong className="text-white">5-6 年</strong>的 Java 後端開發經驗，
                專精於<strong className="text-white">企業級系統架構</strong>與<strong className="text-white">高併發解決方案</strong>。
              </p>

              <p>
                曾任職於電商核心系統團隊，主責
                <strong className="text-white">智能倉儲系統(WMS)</strong>、
                <strong className="text-white">訂單管理系統(MOX)</strong>、
                <strong className="text-white">貨品管理系統(MIX)</strong>的開發與維護。
                系統每日處理上萬筆 API 請求，平均延遲維持低於 200ms。
              </p>

              <p>
                在技術專長方面，我專精於
                <strong className="text-white">Spring Boot</strong>、
                <strong className="text-white">MySQL</strong>、
                <strong className="text-white">Redis</strong>、
                <strong className="text-white">RabbitMQ</strong> 等後端技術，
                同時具備 <strong className="text-white">React</strong> 前端開發能力，
                能夠進行完整的全端專案開發與教學。
              </p>

              <p>
                現在，我將這些年累積的<strong style={{ color: '#e94560' }}>實戰經驗</strong>
                轉化為系統化的教學內容，
                幫助想要成為後端工程師或提升技術能力的學員，
                用最有效率的方式掌握程式開發技能。
              </p>
            </div>

            {/* Highlights */}
            <div
              ref={(el) => { revealRefs.current[3] = el; }}
              className="mt-10 grid grid-cols-2 gap-4 scroll-reveal scroll-reveal-stagger"
            >
              {[
                { icon: '💻', title: '後端專精', desc: 'Spring Boot 企業級開發' },
                { icon: '🏢', title: '電商經驗', desc: '核心系統實戰經歷' },
                { icon: '🔧', title: '實戰導向', desc: '即學即用的技能' },
                { icon: '🌐', title: '全端能力', desc: '前後端整合開發' },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`scroll-reveal-item glass-card p-4 transition-all duration-600 stagger-${index + 1}`}
                >
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <h4 className="text-white font-semibold">{item.title}</h4>
                  <p className="text-sm" style={{ color: '#8892b0' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

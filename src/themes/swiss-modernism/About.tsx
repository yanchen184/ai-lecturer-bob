const About = () => {
  return (
    <section
      id="about"
      className="py-26 lg:py-30 relative"
      aria-labelledby="about-title"
    >
      {/* Top divider */}
      <div className="bold-divider" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-26">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-22 items-start">
          {/* Profile Side */}
          <div className="relative">
            <div className="bold-card p-8 md:p-12">
              <div className="w-32 h-32 md:w-40 md:h-40 mx-auto bg-bold-border flex items-center justify-center mb-6">
                <span className="text-5xl md:text-6xl font-bold text-bold-accent">彥</span>
              </div>

              <h3 className="text-2xl font-bold text-center text-bold-text mb-2">陳彥彤</h3>
              <p className="text-bold-accent text-center font-medium mb-6">資深後端工程師 / 程式講師</p>

              {/* Quote */}
              <div className="text-center mb-8 px-4">
                <p className="text-bold-muted italic text-lg border-l-2 border-bold-accent pl-4 text-left">
                  工程師不是寫 code 的人，是解決問題的人。
                </p>
              </div>

              {/* Quick Info */}
              <div className="space-y-4 text-bold-muted">
                <div className="flex items-center gap-3 border-b border-bold-border pb-3">
                  <svg className="w-5 h-5 text-bold-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>5-6 年 Java 後端開發經驗</span>
                </div>
                <div className="flex items-center gap-3 border-b border-bold-border pb-3">
                  <svg className="w-5 h-5 text-bold-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <span>輔仁大學 統計資訊系</span>
                </div>
                <div className="flex items-center gap-3 border-b border-bold-border pb-3">
                  <svg className="w-5 h-5 text-bold-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>Microsoft AZ-900 認證</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-bold-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>台北市 / 遠端授課</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div>
            <h2 id="about-title" className="section-title text-left mb-4">
              關於我
            </h2>
            <p className="text-bold-accent text-lg font-medium mb-8 uppercase tracking-wider">About Me</p>

            <div className="space-y-6 text-bold-muted leading-relaxed text-lg">
              <p>
                大家好，我是<strong className="text-bold-text">陳彥彤</strong>，
                一位<strong className="text-bold-accent">資深後端工程師</strong>兼<strong className="text-bold-text">程式講師</strong>。
                擁有 <strong className="text-bold-text">5-6 年</strong>的 Java 後端開發經驗，
                專精於<strong className="text-bold-text">企業級系統架構</strong>與<strong className="text-bold-text">高併發解決方案</strong>。
              </p>

              <p>
                曾任職於電商核心系統團隊，主責
                <strong className="text-bold-text">智能倉儲系統(WMS)</strong>、
                <strong className="text-bold-text">訂單管理系統(MOX)</strong>、
                <strong className="text-bold-text">貨品管理系統(MIX)</strong>的開發與維護。
                系統每日處理上萬筆 API 請求，平均延遲維持低於 200ms。
              </p>

              <p>
                在技術專長方面，我專精於
                Spring Boot、MySQL、Redis、RabbitMQ 等後端技術，
                同時具備 <strong className="text-bold-text">React</strong> 前端開發能力，
                能夠進行完整的全端專案開發與教學。
              </p>

              <p>
                現在，我將這些年累積的<strong className="text-bold-accent">實戰經驗</strong>
                轉化為系統化的教學內容，
                幫助想要成為後端工程師或提升技術能力的學員，
                用最有效率的方式掌握程式開發技能。
              </p>
            </div>

            {/* Highlights — sharp flat cards */}
            <div className="mt-10 grid grid-cols-2 gap-px bg-bold-border">
              {[
                { icon: '//01', title: '後端專精', desc: 'Spring Boot 企業級開發' },
                { icon: '//02', title: '電商經驗', desc: '核心系統實戰經歷' },
                { icon: '//03', title: '實戰導向', desc: '即學即用的技能' },
                { icon: '//04', title: '全端能力', desc: '前後端整合開發' },
              ].map((item, index) => (
                <div key={index} className="bg-bold-bg p-6 hover:bg-bold-surface transition-colors duration-200">
                  <span className="text-bold-accent font-bold text-sm tracking-widest block mb-2">{item.icon}</span>
                  <h4 className="text-bold-text font-bold text-lg mb-1">{item.title}</h4>
                  <p className="text-bold-muted text-sm">{item.desc}</p>
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

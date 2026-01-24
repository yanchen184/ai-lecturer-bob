const About = () => {
  return (
    <section
      id="about"
      className="py-20 lg:py-32 relative"
      aria-labelledby="about-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image Side */}
          <div className="relative">
            <div className="relative z-10">
              {/* Profile Card */}
              <div className="glass-card p-8 md:p-12">
                <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full bg-gradient-to-r from-primary-500 to-accent-500 p-1 mb-6">
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                    <span className="text-5xl md:text-6xl font-bold gradient-text">彥</span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-center text-white mb-2">陳彥彤</h3>
                <p className="text-primary-400 text-center mb-6">AI講師 / 人工智慧教育專家</p>

                {/* Quick Info */}
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>專職 AI 講師與顧問</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>台灣 / 遠端授課</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>10+ 年程式開發經驗</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent-500/20 rounded-full blur-2xl" />
          </div>

          {/* Content Side */}
          <div>
            <h2 id="about-title" className="section-title text-left">
              <span className="gradient-text">關於我</span>
            </h2>
            <p className="text-primary-400 text-lg mb-6">About Me - AI講師陳彥彤</p>

            <div className="space-y-6 text-gray-300 leading-relaxed">
              <p>
                大家好，我是<strong className="text-white">陳彥彤</strong>，
                一位專注於<strong className="text-primary-400">人工智慧教育</strong>的專業講師。
                我的使命是將複雜的 AI 技術轉化為易懂、實用的知識，
                幫助每個人都能在 AI 時代找到自己的競爭優勢。
              </p>

              <p>
                擁有超過 <strong className="text-white">10 年</strong>的程式開發經驗，
                從全端開發到<strong className="text-accent-400">機器學習</strong>、
                <strong className="text-accent-400">深度學習</strong>，
                我親身經歷了軟體產業的快速變遷，深刻理解技術學習者面臨的挑戰。
              </p>

              <p>
                目前專注於 <strong className="text-primary-400">ChatGPT 應用</strong>、
                <strong className="text-primary-400">Prompt Engineering</strong>、
                <strong className="text-accent-400">生成式 AI</strong> 等前沿領域的教學，
                幫助企業員工與個人學習者快速掌握 AI 工具，提升工作效率與創新能力。
              </p>
            </div>

            {/* Highlights */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { icon: '🎓', title: '專業教學', desc: '系統化課程設計' },
                { icon: '💼', title: '企業培訓', desc: '客製化解決方案' },
                { icon: '🔧', title: '實戰導向', desc: '即學即用的技能' },
                { icon: '🌟', title: '持續更新', desc: '掌握最新趨勢' },
              ].map((item, index) => (
                <div key={index} className="glass-card p-4 hover:bg-white/20 transition-all duration-300">
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <h4 className="text-white font-semibold">{item.title}</h4>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
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

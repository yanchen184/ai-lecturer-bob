const Testimonials = () => {
  const testimonials = [
    {
      name: '王經理',
      role: '科技公司 產品部門主管',
      content: '陳老師的 ChatGPT 課程非常實用！課程內容深入淺出，讓我們團隊快速掌握 AI 工具的應用方式，大幅提升了工作效率。',
      rating: 5,
    },
    {
      name: '林小姐',
      role: '金融業 數位轉型專員',
      content: '參加過很多 AI 培訓，陳彥彤老師的教學是最有系統的。不只教工具使用，更重要的是培養了我們的 AI 思維。',
      rating: 5,
    },
    {
      name: '張先生',
      role: '行銷公司 創意總監',
      content: 'Prompt Engineering 課程讓我眼界大開！現在我們團隊產出內容的效率提升了三倍，品質也更穩定。',
      rating: 5,
    },
    {
      name: '陳總監',
      role: '製造業 IT 部門主管',
      content: '企業 AI 顧問服務非常專業，幫助我們找到最適合的 AI 應用場景，落地執行也很順利。強力推薦！',
      rating: 5,
    },
    {
      name: '李工程師',
      role: '軟體公司 後端工程師',
      content: 'Python 和機器學習的課程內容很紮實，陳老師會用很多實際案例來講解，學習起來特別容易理解。',
      rating: 5,
    },
    {
      name: '黃經理',
      role: '教育機構 課程規劃主管',
      content: '邀請陳彥彤老師來進行師資培訓，老師們都收穫滿滿。課程設計專業，互動性強，反饋都非常正面。',
      rating: 5,
    },
  ];

  return (
    <section
      id="testimonials"
      className="py-20 lg:py-32 relative"
      aria-labelledby="testimonials-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 id="testimonials-title" className="section-title">
            <span className="gradient-text">學員回饋</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            來自不同產業的學員與企業客戶，分享他們與AI講師陳彥彤的學習經驗
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <article
              key={index}
              className="glass-card p-6 hover:bg-white/15 transition-all duration-300"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-gray-300 mb-6 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                  <span className="text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-white font-semibold">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 glass-card p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '98%', label: '學員滿意度' },
              { value: '4.9/5', label: '平均課程評分' },
              { value: '95%', label: '課程完成率' },
              { value: '88%', label: '推薦給朋友' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

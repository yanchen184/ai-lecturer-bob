import { useState, type FormEvent } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 模擬表單提交 - 實際使用時可以接入後端 API 或 Email 服務
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 使用 mailto 作為備用方案
    const mailtoLink = `mailto:bobchen184@gmail.com?subject=${encodeURIComponent(
      `[網站諮詢] ${formData.subject}`
    )}&body=${encodeURIComponent(
      `姓名：${formData.name}\n公司：${formData.company}\nEmail：${formData.email}\n\n訊息內容：\n${formData.message}`
    )}`;

    window.location.href = mailtoLink;

    setIsSubmitting(false);
    setSubmitStatus('success');
    setFormData({ name: '', email: '', company: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Email',
      value: 'bobchen184@gmail.com',
      link: 'mailto:bobchen184@gmail.com',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      ),
      label: 'GitHub',
      value: 'github.com/yanchen184',
      link: 'https://github.com/yanchen184',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: '服務地區',
      value: '台灣全區 / 線上授課',
      link: null,
    },
  ];

  return (
    <section
      id="contact"
      className="py-20 lg:py-32 relative bg-slate-800/50"
      aria-labelledby="contact-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 id="contact-title" className="section-title">
            <span className="gradient-text">聯繫我</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            想了解更多課程資訊或企業培訓方案？歡迎與AI講師陳彥彤聯繫
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">聯繫方式</h3>
            <p className="text-gray-400 mb-8">
              無論是企業培訓、個人課程諮詢，或是 AI 導入顧問服務，
              都歡迎透過以下方式與我聯繫。我會在 24 小時內回覆您的訊息。
            </p>

            {/* Contact Cards */}
            <div className="space-y-4 mb-8">
              {contactInfo.map((info, index) => (
                <div key={index} className="glass-card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white">
                    {info.icon}
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">{info.label}</div>
                    {info.link ? (
                      <a
                        href={info.link}
                        target={info.link.startsWith('http') ? '_blank' : undefined}
                        rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-white hover:text-primary-400 transition-colors"
                      >
                        {info.value}
                      </a>
                    ) : (
                      <span className="text-white">{info.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Response */}
            <div className="glass-card p-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white font-semibold">目前狀態</span>
              </div>
              <p className="text-gray-300">
                開放企業培訓與顧問諮詢預約中，線上課程隨時可以開始學習。
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-white mb-6">填寫諮詢表單</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-gray-300 text-sm mb-2">
                    姓名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="您的姓名"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-300 text-sm mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-gray-300 text-sm mb-2">
                  公司名稱
                </label>
                <input
                  type="text"
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="您的公司或組織名稱"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-gray-300 text-sm mb-2">
                  諮詢主題 <span className="text-red-400">*</span>
                </label>
                <select
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                >
                  <option value="" className="bg-slate-800">請選擇諮詢主題</option>
                  <option value="企業培訓" className="bg-slate-800">企業培訓</option>
                  <option value="個人課程" className="bg-slate-800">個人課程</option>
                  <option value="AI顧問" className="bg-slate-800">AI 顧問服務</option>
                  <option value="合作邀約" className="bg-slate-800">合作邀約</option>
                  <option value="其他" className="bg-slate-800">其他</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-gray-300 text-sm mb-2">
                  訊息內容 <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                  placeholder="請描述您的需求或問題..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>發送中...</span>
                  </>
                ) : (
                  <>
                    <span>送出諮詢</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>

              {submitStatus === 'success' && (
                <p className="text-green-400 text-center">
                  訊息已準備好，即將開啟您的郵件客戶端！
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

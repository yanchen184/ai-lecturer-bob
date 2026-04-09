import { useState, useRef, type FormEvent } from 'react';

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
  const [emailCopied, setEmailCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const mailtoLink = `mailto:bobchen184@gmail.com?subject=${encodeURIComponent(
        `[網站諮詢] ${formData.subject}`
      )}&body=${encodeURIComponent(
        `姓名：${formData.name}\n公司：${formData.company || '(未填寫)'}\nEmail：${formData.email}\n\n訊息內容：\n${formData.message}`
      )}`;

      window.open(mailtoLink, '_blank');

      setSubmitStatus('success');
      setFormData({ name: '', email: '', company: '', subject: '', message: '' });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('bobchen184@gmail.com');
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = 'bobchen184@gmail.com';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    }
  };

  const contactInfo = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Email',
      value: 'bobchen184@gmail.com',
      action: copyEmail,
      actionLabel: emailCopied ? '已複製' : '點擊複製',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      ),
      label: 'GitHub',
      value: 'github.com/yanchen184',
      link: 'https://github.com/yanchen184',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: '服務地區',
      value: '台灣全區 / 線上授課',
    },
  ];

  const inputStyle = {
    backgroundColor: '#FAF7F0',
    border: '1px solid #D4C4A8',
    color: '#3D2E1C',
    borderRadius: '0.75rem',
  };

  const inputFocusClass =
    'w-full px-4 py-3 transition-all duration-400 placeholder:text-[#B5A68C] focus:outline-none focus:border-[#C67B5C] focus:ring-1 focus:ring-[#C67B5C]/20';

  return (
    <section
      id="contact"
      className="py-20 lg:py-32 relative"
      style={{ backgroundColor: '#F5F0E1' }}
      aria-labelledby="contact-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center px-4 py-1.5 rounded-full text-sm mb-6"
            style={{ backgroundColor: '#FEFDFB', color: '#6B6255', boxShadow: '0 1px 3px rgba(61,46,28,0.06)' }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse mr-2" style={{ backgroundColor: '#6B7B3C' }} />
            目前開放諮詢預約
          </div>
          <h2
            id="contact-title"
            className="section-title text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: '#C67B5C', fontFamily: 'Georgia, "Noto Sans TC", serif' }}
          >
            聯繫我
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#6B6255' }}>
            想了解更多課程資訊或企業培訓方案？歡迎與AI講師陳彥彤聯繫
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Info - 2 cols */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-3" style={{ color: '#3D2E1C' }}>聯繫方式</h3>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: '#6B6255' }}>
              無論是企業培訓、個人課程諮詢，或是 AI 導入顧問服務，
              都歡迎透過以下方式與我聯繫。我會在 24 小時內回覆您的訊息。
            </p>

            {/* Contact Cards */}
            <div className="space-y-3 mb-8">
              {contactInfo.map((info, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-4 p-4 rounded-bento transition-all duration-500"
                  style={{ backgroundColor: '#FEFDFB', boxShadow: '0 1px 3px rgba(61,46,28,0.04)' }}
                >
                  <div
                    className="w-11 h-11 rounded-bento flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ backgroundColor: '#F5F0E1', color: '#6B7B3C' }}
                  >
                    {info.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs mb-0.5" style={{ color: '#B5A68C' }}>{info.label}</div>
                    {'action' in info && info.action ? (
                      <button
                        onClick={info.action}
                        className="text-sm font-medium flex items-center gap-2 transition-colors duration-300"
                        style={{ color: '#3D2E1C' }}
                      >
                        <span className="truncate">{info.value}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full transition-all duration-200 flex-shrink-0"
                          style={{
                            backgroundColor: emailCopied ? '#e8f5e9' : '#F5F0E1',
                            color: emailCopied ? '#6B7B3C' : '#6B6255',
                          }}
                        >
                          {info.actionLabel}
                        </span>
                      </button>
                    ) : 'link' in info && info.link ? (
                      <a
                        href={info.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium transition-colors duration-300"
                        style={{ color: '#3D2E1C' }}
                      >
                        {info.value}
                      </a>
                    ) : (
                      <span className="text-sm font-medium" style={{ color: '#3D2E1C' }}>{info.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Response Status */}
            <div
              className="p-5 rounded-bento-lg"
              style={{
                backgroundColor: '#FEFDFB',
                border: '1px solid #D4C4A8',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#6B7B3C' }} />
                  <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: '#6B7B3C' }} />
                </span>
                <span className="font-semibold text-sm" style={{ color: '#3D2E1C' }}>目前狀態</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#6B6255' }}>
                開放企業培訓與顧問諮詢預約中，線上課程隨時可以開始學習。
              </p>
            </div>
          </div>

          {/* Contact Form - 3 cols */}
          <div className="lg:col-span-3">
            <div
              className="rounded-bento-lg p-6 lg:p-8"
              style={{
                backgroundColor: '#FEFDFB',
                boxShadow: '0 1px 3px rgba(61,46,28,0.06), 0 4px 16px rgba(61,46,28,0.04)',
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-bento flex items-center justify-center"
                  style={{ backgroundColor: '#C67B5C' }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#3D2E1C' }}>填寫諮詢表單</h3>
                  <p className="text-xs" style={{ color: '#6B6255' }}>會開啟您的郵件客戶端發送</p>
                </div>
              </div>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm mb-1.5" style={{ color: '#6B6255' }}>
                      姓名 <span style={{ color: '#C67B5C' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={inputFocusClass}
                      style={inputStyle}
                      placeholder="您的姓名"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm mb-1.5" style={{ color: '#6B6255' }}>
                      Email <span style={{ color: '#C67B5C' }}>*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputFocusClass}
                      style={inputStyle}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company" className="block text-sm mb-1.5" style={{ color: '#6B6255' }}>
                      公司名稱
                    </label>
                    <input
                      type="text"
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className={inputFocusClass}
                      style={inputStyle}
                      placeholder="您的公司或組織"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm mb-1.5" style={{ color: '#6B6255' }}>
                      諮詢主題 <span style={{ color: '#C67B5C' }}>*</span>
                    </label>
                    <select
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className={inputFocusClass + ' appearance-none'}
                      style={{
                        ...inputStyle,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236B6255' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                      }}
                    >
                      <option value="">請選擇諮詢主題</option>
                      <option value="企業培訓">企業培訓</option>
                      <option value="個人課程">個人課程</option>
                      <option value="AI顧問">AI 顧問服務</option>
                      <option value="合作邀約">合作邀約</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm mb-1.5" style={{ color: '#6B6255' }}>
                    訊息內容 <span style={{ color: '#C67B5C' }}>*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={inputFocusClass + ' resize-none'}
                    style={inputStyle}
                    placeholder="請描述您的需求或問題..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 font-bold rounded-bento transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: '#C67B5C',
                    color: '#FEFDFB',
                    boxShadow: '0 2px 8px rgba(198,123,92,0.2)',
                  }}
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
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>送出諮詢</span>
                    </>
                  )}
                </button>

                {submitStatus === 'success' && (
                  <div
                    className="flex items-center gap-2 justify-center p-3 rounded-bento"
                    style={{ backgroundColor: '#f0f5e9', border: '1px solid #c5d6a8' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#6B7B3C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm" style={{ color: '#6B7B3C' }}>郵件客戶端已開啟，請在郵件中確認送出！</span>
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div
                    className="flex items-center gap-2 justify-center p-3 rounded-bento"
                    style={{ backgroundColor: '#fdf2f0', border: '1px solid #e8c4bc' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#C67B5C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm" style={{ color: '#C67B5C' }}>
                      發送失敗，請直接寄信至
                      <button onClick={copyEmail} className="underline ml-1" style={{ color: '#B5651D' }}>
                        bobchen184@gmail.com
                      </button>
                    </span>
                  </div>
                )}

                <p className="text-xs text-center" style={{ color: '#B5A68C' }}>
                  點擊送出後會開啟您的郵件客戶端，表單內容會自動填入信件中
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

import { useState, useRef, useEffect, type FormEvent } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailCopied, setEmailCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const mailtoLink = `mailto:bobchen184@gmail.com?subject=${encodeURIComponent(`[網站諮詢] ${formData.subject}`)}&body=${encodeURIComponent(`姓名：${formData.name}\n公司：${formData.company || '(未填寫)'}\nEmail：${formData.email}\n\n訊息內容：\n${formData.message}`)}`;
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
    { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>), label: 'Email', value: 'bobchen184@gmail.com', action: copyEmail, actionLabel: emailCopied ? '已複製' : '點擊複製' },
    { icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>), label: 'GitHub', value: 'github.com/yanchen184', link: 'https://github.com/yanchen184' },
    { icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>), label: '服務地區', value: '台灣全區 / 線上授課' },
  ];

  return (
    <section ref={sectionRef} id="contact" className="py-26 lg:py-30 relative" aria-labelledby="contact-title">
      <div className="section-divider" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-26 relative">
        <div className="mb-18 scroll-reveal">
          <div className="inline-flex items-center gap-2 mb-6 pb-2" style={{ borderBottom: '1px solid #1F1F1F' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#6366F1' }} />
            <span className="text-sm uppercase tracking-widest font-medium" style={{ color: '#6B7280' }}>目前開放諮詢預約</span>
          </div>
          <h2 id="contact-title" className="section-title text-left mb-4 text-white">聯繫我</h2>
          <p className="text-lg max-w-2xl" style={{ color: '#9CA3AF' }}>想了解更多課程資訊或企業培訓方案？歡迎與AI講師陳彥彤聯繫</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 scroll-reveal stagger-1">
            <h3 className="text-xl font-bold text-white mb-3">聯繫方式</h3>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: '#6B7280' }}>無論是企業培訓、個人課程諮詢，或是 AI 導入顧問服務，都歡迎透過以下方式與我聯繫。我會在 24 小時內回覆您的訊息。</p>

            <div className="space-y-3 mb-8">
              {contactInfo.map((info, index) => (
                <div key={index} className="group flex items-center gap-4 p-4 rounded-xl transition-all duration-300" style={{ background: '#111111', border: '1px solid #1F1F1F' }}>
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366F1' }}>{info.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: '#6B7280' }}>{info.label}</div>
                    {'action' in info && info.action ? (
                      <button onClick={info.action} className="text-white hover:text-white transition-colors duration-200 text-sm font-bold flex items-center gap-2">
                        <span className="truncate">{info.value}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md transition-all duration-200 flex-shrink-0" style={{ border: `1px solid ${emailCopied ? '#6366F1' : '#1F1F1F'}`, color: emailCopied ? '#6366F1' : '#6B7280' }}>{info.actionLabel}</span>
                      </button>
                    ) : 'link' in info && info.link ? (
                      <a href={info.link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold transition-colors duration-200" style={{ color: '#6366F1' }}>{info.value}</a>
                    ) : (
                      <span className="text-white text-sm font-bold">{info.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-xl" style={{ background: '#111111', border: '1px solid #1F1F1F' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 rounded-full" style={{ background: '#6366F1' }} />
                <span className="text-white font-bold text-sm uppercase tracking-wider">目前狀態</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>開放企業培訓與顧問諮詢預約中，線上課程隨時可以開始學習。</p>
            </div>
          </div>

          <div className="lg:col-span-3 scroll-reveal stagger-2">
            <div className="motion-card p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#6366F1' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">填寫諮詢表單</h3>
                  <p className="text-xs" style={{ color: '#6B7280' }}>會開啟您的郵件客戶端發送</p>
                </div>
              </div>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm mb-1.5 uppercase tracking-wider font-medium" style={{ color: '#9CA3AF' }}>姓名 <span style={{ color: '#6366F1' }}>*</span></label>
                    <input type="text" id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="glass-input w-full px-4 py-3" placeholder="您的姓名" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm mb-1.5 uppercase tracking-wider font-medium" style={{ color: '#9CA3AF' }}>Email <span style={{ color: '#6366F1' }}>*</span></label>
                    <input type="email" id="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="glass-input w-full px-4 py-3" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company" className="block text-sm mb-1.5 uppercase tracking-wider font-medium" style={{ color: '#9CA3AF' }}>公司名稱</label>
                    <input type="text" id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="glass-input w-full px-4 py-3" placeholder="您的公司或組織" />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm mb-1.5 uppercase tracking-wider font-medium" style={{ color: '#9CA3AF' }}>諮詢主題 <span style={{ color: '#6366F1' }}>*</span></label>
                    <select id="subject" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="glass-input w-full px-4 py-3 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236B7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                      <option value="" style={{ background: '#111111' }}>請選擇諮詢主題</option>
                      <option value="企業培訓" style={{ background: '#111111' }}>企業培訓</option>
                      <option value="個人課程" style={{ background: '#111111' }}>個人課程</option>
                      <option value="AI顧問" style={{ background: '#111111' }}>AI 顧問服務</option>
                      <option value="合作邀約" style={{ background: '#111111' }}>合作邀約</option>
                      <option value="其他" style={{ background: '#111111' }}>其他</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm mb-1.5 uppercase tracking-wider font-medium" style={{ color: '#9CA3AF' }}>訊息內容 <span style={{ color: '#6366F1' }}>*</span></label>
                  <textarea id="message" required rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="glass-input w-full px-4 py-3 resize-none" placeholder="請描述您的需求或問題..." />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-4 font-bold text-lg rounded-xl text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" style={{ background: '#6366F1', boxShadow: '0 4px 20px rgba(99,102,241,0.25)' }}>
                  {isSubmitting ? (
                    <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg><span>發送中...</span></>
                  ) : (
                    <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg><span>送出諮詢</span></>
                  )}
                </button>

                {submitStatus === 'success' && (
                  <div className="flex items-center gap-2 justify-center p-3 rounded-lg" style={{ border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.08)' }}>
                    <svg className="w-5 h-5" style={{ color: '#6366F1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm" style={{ color: '#818CF8' }}>郵件客戶端已開啟，請在郵件中確認送出！</span>
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="flex items-center gap-2 justify-center p-3 rounded-lg" style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)' }}>
                    <svg className="w-5 h-5" style={{ color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm" style={{ color: '#EF4444' }}>發送失敗，請直接寄信至<button onClick={copyEmail} className="underline ml-1 hover:text-white">bobchen184@gmail.com</button></span>
                  </div>
                )}
                <p className="text-xs text-center" style={{ color: '#374151' }}>點擊送出後會開啟您的郵件客戶端，表單內容會自動填入信件中</p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

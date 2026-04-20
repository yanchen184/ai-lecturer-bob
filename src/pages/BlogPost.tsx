import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { getBlogPostBySlug, blogPosts } from '../data/blogPosts';
import type { BlogPost as BlogPostType } from '../data/blogPosts';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const post = useMemo(() => {
    if (!slug) return null;
    return getBlogPostBySlug(slug);
  }, [slug]);

  // Get related posts
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return blogPosts
      .filter((p) => p.id !== post.id && p.category === post.category)
      .slice(0, 3);
  }, [post]);

  useEffect(() => {
    if (!post) {
      navigate('/blog', { replace: true });
    }
  }, [post, navigate]);

  useEffect(() => {
    // Scroll to top when post changes
    window.scrollTo(0, 0);
  }, [slug]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Parse markdown-like content to HTML
  const parseContent = (content: string): string => {
    return content
      // Headers
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-white mt-8 mb-4">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-white mt-6 mb-3">$1</h3>')
      // Bold text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-slate-700 px-2 py-1 rounded text-primary-300">$1</code>')
      // Code blocks
      .replace(/```[\s\S]*?```/g, (match) => {
        const code = match.replace(/```\w*\n?/g, '').replace(/```/g, '');
        return `<pre class="bg-slate-800 p-4 rounded-lg overflow-x-auto my-4"><code class="text-gray-300 text-sm">${code}</code></pre>`;
      })
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary-500 pl-4 my-4 text-gray-300 italic">$1</blockquote>')
      // Unordered lists
      .replace(/^- (.+)$/gm, '<li class="text-gray-300 ml-4 mb-2">$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="text-gray-300 ml-4 mb-2 list-decimal">$1</li>')
      // Tables
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(cell => cell.trim());
        if (cells.every(cell => cell.trim().match(/^-+$/))) {
          return '';
        }
        const isHeader = match.includes('---|');
        if (isHeader) return '';
        const cellHtml = cells.map(cell =>
          `<td class="border border-slate-600 px-4 py-2 text-gray-300">${cell.trim()}</td>`
        ).join('');
        return `<tr>${cellHtml}</tr>`;
      })
      // Paragraphs (double newline)
      .replace(/\n\n/g, '</p><p class="text-gray-300 mb-4 leading-relaxed">')
      // Single newlines within paragraphs
      .replace(/\n/g, '<br/>')
      // Wrap in paragraph
      .replace(/^(.+)/, '<p class="text-gray-300 mb-4 leading-relaxed">$1')
      .replace(/(.+)$/, '$1</p>');
  };

  if (!post) {
    return null;
  }

  return (
    <div className="gradient-bg min-h-screen text-white pt-24">
      {/* Breadcrumb */}
      <nav className="max-w-4xl mx-auto px-4 py-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors">
              首頁
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link to="/blog" className="text-gray-400 hover:text-primary-400 transition-colors">
              部落格
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-primary-400 truncate max-w-[200px]">{post.title}</li>
        </ol>
      </nav>

      {/* Article Header */}
      <header className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <span className="px-4 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm">
            {post.category}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">陳</span>
            </div>
            <span>{post.author}</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <time dateTime={post.publishDate}>{formatDate(post.publishDate)}</time>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{post.readingTime} 分鐘閱讀</span>
          </div>
        </div>
        <p className="text-lg text-gray-300 leading-relaxed">{post.excerpt}</p>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 pb-16">
        <div
          className="prose prose-invert prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: parseContent(post.content) }}
        />

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">標籤</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 bg-white/10 text-gray-300 rounded-full text-sm hover:bg-white/20 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* Author Info */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="glass-card p-8">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl">陳</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-lg font-bold text-white">陳彥彤</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300">程式講師</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                資深後端工程師，5-6 年電商核心系統開發經驗。專精 Spring Boot、React、MySQL、Redis，
                提供企業培訓與個人課程。把工作中累積的實戰經驗，轉化成你學得會的教學內容。
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-medium rounded-full hover:shadow-lg hover:shadow-primary-500/25 hover:scale-105 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  查看課程
                </Link>
                <a
                  href="https://github.com/yanchen184"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 text-gray-300 text-sm rounded-full hover:bg-white/20 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donate Card */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="glass-card p-8 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-accent-500/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="text-4xl mb-3">☕</div>
            <h3 className="text-xl font-bold text-white mb-2">覺得這篇文章有幫助？</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              如果這篇文章幫你解決了問題或學到了新知識，歡迎請我喝杯咖啡支持繼續創作！
            </p>

            {/* Amount options */}
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              {[
                { label: '☕ 一杯咖啡', amount: 'NT$50' },
                { label: '🍱 一個便當', amount: 'NT$100' },
                { label: '🎉 大力支持', amount: 'NT$300' },
              ].map((option) => (
                <div
                  key={option.amount}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400"
                >
                  <span>{option.label}</span>
                  <span className="ml-2 text-white font-medium">{option.amount}</span>
                </div>
              ))}
            </div>

            <a
              href="https://ko-fi.com/TODO_填入你的Ko-fi帳號"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold rounded-full hover:shadow-lg hover:shadow-primary-500/25 hover:scale-105 transition-all duration-300"
            >
              <span>☕</span>
              <span>請我喝咖啡</span>
            </a>
            <p className="text-gray-600 text-xs mt-4">金額隨意，你的支持是最大的鼓勵</p>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <h3 className="text-2xl font-bold text-white mb-8">相關文章</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost: BlogPostType) => (
              <article
                key={relatedPost.id}
                className="glass-card p-6 group hover:scale-[1.02] transition-all duration-300"
              >
                <h4 className="text-lg font-bold text-white mb-3 group-hover:text-primary-300 transition-colors line-clamp-2">
                  <Link to={`/blog/${relatedPost.slug}`}>{relatedPost.title}</Link>
                </h4>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{relatedPost.excerpt}</p>
                <Link
                  to={`/blog/${relatedPost.slug}`}
                  className="text-primary-400 hover:text-primary-300 text-sm inline-flex items-center"
                >
                  閱讀更多
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Back to Blog */}
      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <Link
          to="/blog"
          className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all duration-300"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
          返回部落格列表
        </Link>
      </section>
    </div>
  );
};

export default BlogPost;

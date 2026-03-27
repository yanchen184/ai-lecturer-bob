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
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-bento-text mt-8 mb-4">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-bento-text mt-6 mb-3">$1</h3>')
      // Bold text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-bento-text font-semibold">$1</strong>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-bento-card px-2 py-1 rounded text-primary-600">$1</code>')
      // Code blocks
      .replace(/```[\s\S]*?```/g, (match) => {
        const code = match.replace(/```\w*\n?/g, '').replace(/```/g, '');
        return `<pre class="bg-bento-card p-4 rounded-lg overflow-x-auto my-4"><code class="text-bento-text-secondary text-sm">${code}</code></pre>`;
      })
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary-500 pl-4 my-4 text-bento-text-secondary italic">$1</blockquote>')
      // Unordered lists
      .replace(/^- (.+)$/gm, '<li class="text-bento-text-secondary ml-4 mb-2">$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="text-bento-text-secondary ml-4 mb-2 list-decimal">$1</li>')
      // Tables
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(cell => cell.trim());
        if (cells.every(cell => cell.trim().match(/^-+$/))) {
          return '';
        }
        const isHeader = match.includes('---|');
        if (isHeader) return '';
        const cellHtml = cells.map(cell =>
          `<td class="border border-slate-600 px-4 py-2 text-bento-text-secondary">${cell.trim()}</td>`
        ).join('');
        return `<tr>${cellHtml}</tr>`;
      })
      // Paragraphs (double newline)
      .replace(/\n\n/g, '</p><p class="text-bento-text-secondary mb-4 leading-relaxed">')
      // Single newlines within paragraphs
      .replace(/\n/g, '<br/>')
      // Wrap in paragraph
      .replace(/^(.+)/, '<p class="text-bento-text-secondary mb-4 leading-relaxed">$1')
      .replace(/(.+)$/, '$1</p>');
  };

  if (!post) {
    return null;
  }

  return (
    <div className="bg-white min-h-screen text-bento-text pt-24">
      {/* Breadcrumb */}
      <nav className="max-w-4xl mx-auto px-4 py-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link to="/" className="text-bento-text-secondary hover:text-primary-500 transition-colors">
              首頁
            </Link>
          </li>
          <li className="text-bento-text-secondary">/</li>
          <li>
            <Link to="/blog" className="text-bento-text-secondary hover:text-primary-500 transition-colors">
              部落格
            </Link>
          </li>
          <li className="text-bento-text-secondary">/</li>
          <li className="text-primary-500 truncate max-w-[200px]">{post.title}</li>
        </ol>
      </nav>

      {/* Article Header */}
      <header className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <span className="px-4 py-1 bg-primary-500/20 text-primary-600 rounded-full text-sm">
            {post.category}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-bento-text mb-6 leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-bento-text-secondary text-sm mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
              <span className="text-bento-text font-bold text-sm">陳</span>
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
        <p className="text-lg text-bento-text-secondary leading-relaxed">{post.excerpt}</p>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 pb-16">
        <div
          className="prose prose-invert prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: parseContent(post.content) }}
        />

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-bento-border">
          <h3 className="text-lg font-semibold text-bento-text mb-4">標籤</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 bg-bento-card text-bento-text-secondary rounded-full text-sm hover:bg-bento-card-hover transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* Author Info */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-bento-card rounded-bento-lg p-8">
          <h3 className="text-xl font-bold text-bento-text mb-4">關於作者</h3>
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
              <span className="text-bento-text font-bold text-2xl">陳</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-bento-text">AI講師陳彥彤</h4>
              <p className="text-bento-text-secondary mt-2">
                專業人工智慧教育講師，專精於 ChatGPT 應用、Prompt Engineering、
                機器學習、深度學習教學。超過 500+ 場企業授課經驗，學員累積 10,000+ 人。
              </p>
              <Link
                to="/#contact"
                className="inline-flex items-center mt-4 text-primary-500 hover:text-primary-600 transition-colors"
              >
                <span>預約課程諮詢</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <h3 className="text-2xl font-bold text-bento-text mb-8">相關文章</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost: BlogPostType) => (
              <article
                key={relatedPost.id}
                className="bg-bento-card rounded-bento-lg p-6 group hover:scale-[1.02] transition-all duration-300"
              >
                <h4 className="text-lg font-bold text-bento-text mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                  <Link to={`/blog/${relatedPost.slug}`}>{relatedPost.title}</Link>
                </h4>
                <p className="text-bento-text-secondary text-sm mb-4 line-clamp-2">{relatedPost.excerpt}</p>
                <Link
                  to={`/blog/${relatedPost.slug}`}
                  className="text-primary-500 hover:text-primary-600 text-sm inline-flex items-center"
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
          className="inline-flex items-center px-8 py-4 bg-bento-card text-bento-text font-medium rounded-full hover:bg-bento-card-hover transition-all duration-300"
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

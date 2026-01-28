import { Link } from 'react-router-dom';
import { blogPosts, getAllCategories } from '../data/blogPosts';
import type { BlogPost } from '../data/blogPosts';
import { useState, useMemo } from 'react';

const BlogList = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = useMemo(() => getAllCategories(), []);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') {
      return blogPosts;
    }
    return blogPosts.filter((post) => post.category === selectedCategory);
  }, [selectedCategory]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="gradient-bg min-h-screen text-white pt-24">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">AI講師</span>部落格
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            AI講師陳彥彤分享人工智慧教學心得、ChatGPT 實戰技巧、企業培訓經驗，
            幫助你掌握 AI 時代的核心競爭力。
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              全部文章
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post: BlogPost) => (
              <article
                key={post.id}
                className="glass-card overflow-hidden group hover:scale-[1.02] transition-all duration-300"
              >
                {/* Featured Badge */}
                {post.featured && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold rounded-full">
                      精選
                    </span>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6 relative">
                  {/* Category */}
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-primary-500/20 text-primary-300 text-sm rounded-full">
                      {post.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-white mb-3 group-hover:text-primary-300 transition-colors line-clamp-2">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  {/* Excerpt */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{formatDate(post.publishDate)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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

                  {/* Read More Link */}
                  <Link
                    to={`/blog/${post.slug}`}
                    className="mt-4 inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <span>閱讀全文</span>
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Empty State */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">
                目前沒有此分類的文章
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto glass-card p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            關於 AI講師陳彥彤的部落格
          </h2>
          <p className="text-gray-300 mb-4">
            歡迎來到 AI講師陳彥彤的專業部落格。這裡分享人工智慧教學的第一手經驗，
            包含 ChatGPT 應用技巧、Prompt Engineering 實戰、機器學習入門教學、
            企業 AI 培訓規劃等豐富內容。
          </p>
          <p className="text-gray-300">
            作為專業的 AI 講師，陳彥彤致力於讓複雜的人工智慧技術變得平易近人，
            無論你是想學習 AI 的初學者，還是尋求企業培訓的主管，都能在這裡找到實用的知識。
          </p>
        </div>
      </section>
    </div>
  );
};

export default BlogList;

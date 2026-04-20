import { Link } from 'react-router-dom';
import type { BlogPost } from '../data/blogPosts';
import { useState, useMemo } from 'react';
import { useBlogPosts } from '../hooks/useBlogPosts';

const BlogList = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { posts, isLoading } = useBlogPosts();

  const categories = useMemo(
    () => [...new Set(posts.map((post) => post.category))],
    [posts]
  );
  const tags = useMemo(
    () => [...new Set(posts.flatMap((post) => post.tags))],
    [posts]
  );

  const featuredPosts = useMemo(
    () => posts.filter((post) => post.featured),
    [posts]
  );

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'all' || post.category === selectedCategory;
      const matchesTag =
        selectedTag === 'all' || post.tags.includes(selectedTag);
      const matchesSearch =
        query === '' ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query);

      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [posts, selectedCategory, selectedTag, searchQuery]);

  const hasActiveFilter =
    selectedCategory !== 'all' || selectedTag !== 'all' || searchQuery !== '';

  const resetFilters = (): void => {
    setSelectedCategory('all');
    setSelectedTag('all');
    setSearchQuery('');
  };

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

      {/* Search Box */}
      <section className="px-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <label htmlFor="blog-search" className="sr-only">
            搜尋文章
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </span>
            <input
              id="blog-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜尋文章標題或摘要..."
              className="w-full pl-12 pr-10 py-3 rounded-full bg-white/10 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary-400 focus:bg-white/15 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label="清除搜尋"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-4 pb-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-sm text-gray-400 mb-3 text-center md:text-left">
            分類
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
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

      {/* Tag Filter */}
      <section className="px-4 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-sm text-gray-400 mb-3 text-center md:text-left">
            標籤
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedTag === 'all'
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/15 hover:text-gray-200'
              }`}
            >
              全部標籤
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedTag === tag
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/15 hover:text-gray-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && !hasActiveFilter && (
        <section className="px-4 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl" aria-hidden="true">
                ⭐
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                精選文章
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map((post: BlogPost) => (
                <article
                  key={post.id}
                  className="glass-card overflow-hidden group hover:scale-[1.01] transition-all duration-300 relative"
                >
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold rounded-full shadow-lg">
                      精選
                    </span>
                  </div>
                  <div className="p-6 md:p-8 flex flex-col h-full">
                    <div className="mb-3">
                      <span className="px-3 py-1 bg-primary-500/20 text-primary-300 text-sm rounded-full">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-primary-300 transition-colors line-clamp-2">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-gray-300 text-base mb-5 line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-white/10">
                      <span>{formatDate(post.publishDate)}</span>
                      <span>{post.readingTime} 分鐘閱讀</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Result Count */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <p className="text-gray-400 text-sm">
              {hasActiveFilter ? '篩選結果：' : '所有文章：'}
              <span className="text-white font-semibold">
                顯示 {filteredPosts.length} 篇文章
              </span>
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors inline-flex items-center gap-1"
              >
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                重置篩選
              </button>
            )}
          </div>

          {isLoading && (
            <div className="text-center py-8 text-gray-400 text-sm">
              載入文章中...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post: BlogPost) => (
              <article
                key={post.id}
                className="glass-card overflow-hidden group hover:scale-[1.02] transition-all duration-300 relative"
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
              <div className="text-5xl mb-4" aria-hidden="true">
                🔍
              </div>
              <p className="text-gray-300 text-lg mb-2">找不到符合條件的文章</p>
              <p className="text-gray-500 text-sm mb-6">
                試試調整搜尋關鍵字或選擇其他分類 / 標籤
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all"
              >
                重置篩選
              </button>
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

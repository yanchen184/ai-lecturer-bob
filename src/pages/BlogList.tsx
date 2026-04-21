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
    return dateString.replaceAll('-', '/');
  };

  return (
    <div
      className="min-h-screen pt-24 font-mono"
      style={{ background: '#fafaf7', color: '#0a0a0a' }}
    >
      {/* Hero Section */}
      <section className="px-4 py-12 border-b-2 border-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs uppercase tracking-widest mb-4 opacity-60">
            // blog / notes / raw-thoughts
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            BLOG.
          </h1>
          <p className="text-base md:text-lg max-w-2xl leading-relaxed">
            後端工程師的技術筆記。Spring Boot、React、MySQL、Redis。
            <br />
            不包裝、不美化，寫給實戰派看的。
          </p>
          <div className="mt-6 text-xs opacity-60">
            {posts.length.toString().padStart(3, '0')} posts
            &nbsp;·&nbsp;
            {categories.length.toString().padStart(2, '0')} categories
            &nbsp;·&nbsp;
            {tags.length.toString().padStart(2, '0')} tags
          </div>
        </div>
      </section>

      {/* Search + Filters — compact, tags hidden by default */}
      <section className="px-4 py-5 border-b-2 border-black">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Row 1: search + category inline */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <label htmlFor="blog-search" className="sr-only">
                搜尋文章
              </label>
              <input
                id="blog-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="> grep 標題或摘要..."
                className="w-full px-3 py-2 bg-white border-2 border-black font-mono text-sm focus:outline-none focus:bg-[#ffff00] placeholder:opacity-50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 hover:bg-black hover:text-white transition-colors"
                  aria-label="清除搜尋"
                >
                  [×]
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 text-xs uppercase tracking-wider border-2 border-black transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-black text-white'
                    : 'bg-white hover:bg-[#ffff00]'
                }`}
              >
                [all]
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-2.5 py-1 text-xs uppercase tracking-wider border-2 border-black transition-colors ${
                    selectedCategory === category
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-[#ffff00]'
                  }`}
                >
                  [{category}]
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: collapsible tags */}
          {tags.length > 0 && (
            <details
              className="group"
              open={selectedTag !== 'all'}
            >
              <summary className="cursor-pointer text-xs uppercase tracking-widest opacity-60 hover:opacity-100 select-none inline-flex items-center gap-2 list-none">
                <span className="transition-transform group-open:rotate-90">›</span>
                <span>
                  tags
                  {selectedTag !== 'all' && (
                    <span className="ml-2 px-1.5 py-0.5 bg-black text-white text-[10px]">
                      #{selectedTag}
                    </span>
                  )}
                  <span className="ml-2 opacity-50">
                    ({tags.length.toString().padStart(2, '0')})
                  </span>
                </span>
              </summary>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-2 py-0.5 text-xs border border-black transition-colors ${
                    selectedTag === 'all'
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-[#ffff00]'
                  }`}
                >
                  *
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-2 py-0.5 text-xs border border-black transition-colors ${
                      selectedTag === tag
                        ? 'bg-black text-white'
                        : 'bg-white hover:bg-[#ffff00]'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && !hasActiveFilter && (
        <section className="px-4 py-10 border-b-2 border-black">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight">
                /// FEATURED
              </h2>
              <span className="text-xs opacity-60">
                精選 {featuredPosts.length.toString().padStart(2, '0')} 篇
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map((post: BlogPost) => (
                <article
                  key={post.id}
                  className="relative border-2 border-black bg-white p-6 transition-transform hover:-translate-x-1 hover:-translate-y-1"
                  style={{ boxShadow: '6px 6px 0 #0a0a0a' }}
                >
                  <div
                    className="absolute -top-3 -right-3 px-2 py-0.5 text-xs font-black uppercase border-2 border-black"
                    style={{ background: '#ffff00' }}
                  >
                    ★ FEATURED
                  </div>
                  <div className="text-xs uppercase tracking-widest mb-3 opacity-70">
                    [{post.category}] · {formatDate(post.publishDate)} ·{' '}
                    {post.readingTime}min
                  </div>
                  <h3 className="text-xl md:text-2xl font-black leading-tight mb-3">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="hover:bg-[#ffff00] transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-sm leading-relaxed line-clamp-3 mb-4 opacity-80">
                    {post.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs opacity-60 border border-black px-1.5"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Result Count */}
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tight">
              /// {hasActiveFilter ? 'RESULTS' : 'ALL POSTS'}
            </h2>
            <div className="flex items-baseline gap-3 text-xs">
              <span className="opacity-60">
                [{filteredPosts.length.toString().padStart(3, '0')} found]
              </span>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="uppercase tracking-widest underline hover:bg-[#ffff00] transition-colors"
                >
                  reset →
                </button>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="text-center py-8 text-xs opacity-60 tracking-widest">
              loading posts...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t-2 border-black">
            {filteredPosts.map((post: BlogPost, index: number) => (
              <article
                key={post.id}
                className={`p-6 border-b-2 border-black group hover:bg-[#ffff00] transition-colors ${
                  index % 2 === 0 ? 'md:border-r-2' : ''
                }`}
              >
                <div className="text-xs uppercase tracking-widest mb-3 opacity-70 flex items-center gap-2">
                  <span className="font-black">
                    #{(index + 1).toString().padStart(3, '0')}
                  </span>
                  <span>·</span>
                  <span>[{post.category}]</span>
                  {post.featured && (
                    <>
                      <span>·</span>
                      <span className="font-black">★</span>
                    </>
                  )}
                </div>

                <h3 className="text-xl md:text-2xl font-black leading-tight mb-3">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>

                <p className="text-sm leading-relaxed line-clamp-2 mb-4 opacity-80">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs opacity-70">
                  <div className="flex items-baseline gap-2">
                    <time dateTime={post.publishDate}>
                      {formatDate(post.publishDate)}
                    </time>
                    <span>·</span>
                    <span>{post.readingTime}min read</span>
                  </div>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="uppercase tracking-widest font-black hover:underline"
                  >
                    read →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Empty State */}
          {filteredPosts.length === 0 && !isLoading && (
            <div className="text-center py-20 border-2 border-black border-dashed">
              <div className="text-xs uppercase tracking-widest opacity-60 mb-4">
                // no matching posts found
              </div>
              <pre className="text-xs opacity-60 mb-6">
{`$ grep "${searchQuery || '...'}"
→ 0 results`}
              </pre>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-xs uppercase tracking-widest border-2 border-black bg-white hover:bg-[#ffff00] transition-colors"
              >
                [reset filters]
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer note */}
      <section className="px-4 py-10 border-t-2 border-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs uppercase tracking-widest mb-2 opacity-60">
            // about this blog
          </div>
          <p className="text-sm leading-relaxed max-w-2xl">
            沒有行銷話術、沒有 SEO 關鍵字堆疊。只寫我實際踩過的坑、解過的題、
            帶過的企業內訓心得。看得懂的人會自己留下來。
          </p>
          <div className="mt-6 text-xs opacity-60 flex flex-wrap gap-4">
            <span>→ Spring Boot</span>
            <span>→ React</span>
            <span>→ MySQL / Redis</span>
            <span>→ 教學現場</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogList;

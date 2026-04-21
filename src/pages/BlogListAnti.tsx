import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import type { BlogPost } from '../data/blogPosts';
import { useCallback, useMemo } from 'react';
import { useBlogPosts } from '../hooks/useBlogPosts';

const SITE_URL = 'https://yanchen184.github.io/ai-lecturer-bob';

/** Anti (liquid-glass) variant of the blog index — paper-white background,
 *  dashed kraft borders, Georgia serif body. Reading-first, less neubrutal noise. */
const BlogListAnti = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('cat') || 'all';
  const selectedTag = searchParams.get('tag') || 'all';
  const searchQuery = searchParams.get('q') || '';

  const updateParam = useCallback(
    (key: 'cat' | 'tag' | 'q', value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const isDefault = value === '' || value === 'all';
          if (isDefault) next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setSelectedCategory = useCallback((v: string) => updateParam('cat', v), [updateParam]);
  const setSelectedTag = useCallback((v: string) => updateParam('tag', v), [updateParam]);
  const setSearchQuery = useCallback((v: string) => updateParam('q', v), [updateParam]);

  const { posts, isLoading } = useBlogPosts();

  const categories = useMemo(() => [...new Set(posts.map((p) => p.category))], [posts]);
  const tags = useMemo(() => [...new Set(posts.flatMap((p) => p.tags))], [posts]);
  const featuredPosts = useMemo(() => posts.filter((p) => p.featured), [posts]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchesTag = selectedTag === 'all' || post.tags.includes(selectedTag);
      const matchesSearch =
        query === '' ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query);
      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [posts, selectedCategory, selectedTag, searchQuery]);

  const hasActiveFilter =
    selectedCategory !== 'all' || selectedTag !== 'all' || searchQuery !== '';

  const resetFilters = useCallback((): void => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const formatDate = (dateString: string): string => dateString.replaceAll('-', '/');

  // Design tokens
  const serif = "Georgia, 'Noto Sans TC', 'Times New Roman', serif";
  const mono = "'Courier Prime', 'Courier New', monospace";
  const kraft = '#C4A77D';
  const marker = '#1A1A1A';
  const pencil = '#4A4A4A';
  const cream = '#FFF8DC';
  const yellow = '#FFE066';

  const chipIdle: React.CSSProperties = {
    border: `1px dashed ${kraft}`,
    background: 'transparent',
    color: marker,
    fontFamily: mono,
  };
  const chipActive: React.CSSProperties = {
    border: `1px solid ${marker}`,
    background: yellow,
    color: marker,
    fontFamily: mono,
  };

  return (
    <div style={{ color: marker, fontFamily: serif }}>
      <Helmet>
        <title>部落格 — AI 講師陳彥彤YC</title>
        <meta
          name="description"
          content="後端工程師的技術筆記。Spring Boot、React、MySQL、Redis 實戰踩坑紀錄。"
        />
        <link rel="canonical" href={`${SITE_URL}/#/blog`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="部落格 — AI 講師陳彥彤YC" />
        <meta
          property="og:description"
          content="後端工程師的技術實戰筆記 · Spring Boot / React / MySQL / Redis"
        />
        <meta property="og:url" content={`${SITE_URL}/#/blog`} />
      </Helmet>

      {/* Hero */}
      <section
        className="px-4 py-12"
        style={{ borderBottom: `1px dashed ${kraft}` }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline gap-3 flex-wrap mb-2">
            <span
              className="text-xs tracking-widest"
              style={{ fontFamily: mono, color: pencil }}
            >
              —— notebook / no.01
            </span>
          </div>
          <h1
            className="mb-3"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Notes from the Backend.
          </h1>
          <p className="max-w-2xl text-base md:text-lg" style={{ color: pencil, lineHeight: 1.7 }}>
            後端實戰筆記，不包裝、不美化，<span style={{ background: yellow, padding: '0 4px' }}>
            寫給實戰派看的</span>。
          </p>
          <div
            className="mt-6 text-xs tracking-widest flex flex-wrap gap-6"
            style={{ fontFamily: mono, color: pencil }}
          >
            <span>{posts.length.toString().padStart(3, '0')} posts</span>
            <span>{categories.length.toString().padStart(2, '0')} categories</span>
            <span>{tags.length.toString().padStart(2, '0')} tags</span>
          </div>
        </div>
      </section>

      {/* Search + Filters */}
      <section
        className="px-4 py-8"
        style={{ borderBottom: `1px dashed ${kraft}` }}
      >
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <label htmlFor="blog-search-anti" className="sr-only">搜尋文章</label>
              <input
                id="blog-search-anti"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋標題或摘要…"
                className="w-full px-4 py-2.5 text-base focus:outline-none"
                style={{
                  background: 'transparent',
                  border: `1px dashed ${kraft}`,
                  fontFamily: serif,
                  color: marker,
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-0.5 hover:bg-[#FFE066] transition-colors"
                  style={{ fontFamily: mono, color: pencil }}
                  aria-label="清除搜尋"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="px-3 py-1 text-xs tracking-wider transition-colors"
                style={selectedCategory === 'all' ? chipActive : chipIdle}
              >
                all
              </button>
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="px-3 py-1 text-xs tracking-wider transition-colors"
                  style={selectedCategory === category ? chipActive : chipIdle}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <details className="group" open={selectedTag !== 'all'}>
              <summary
                className="cursor-pointer text-xs tracking-widest select-none inline-flex items-center gap-2 list-none"
                style={{ fontFamily: mono, color: pencil }}
              >
                <span className="transition-transform group-open:rotate-90">›</span>
                <span>
                  tags
                  {selectedTag !== 'all' && (
                    <span
                      className="ml-2 px-1.5 py-0.5 text-[10px]"
                      style={{ background: yellow, border: `1px solid ${marker}` }}
                    >
                      #{selectedTag}
                    </span>
                  )}
                  <span className="ml-2 opacity-60">({tags.length})</span>
                </span>
              </summary>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTag('all')}
                  className="px-2 py-0.5 text-xs"
                  style={selectedTag === 'all' ? chipActive : chipIdle}
                >
                  *
                </button>
                {tags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className="px-2 py-0.5 text-xs"
                    style={selectedTag === tag ? chipActive : chipIdle}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      </section>

      {/* Featured */}
      {featuredPosts.length > 0 && !hasActiveFilter && (
        <section
          className="px-4 py-12"
          style={{ borderBottom: `1px dashed ${kraft}` }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex items-baseline gap-3 mb-8">
              <h2 style={{ fontFamily: serif, fontSize: '1.75rem', fontWeight: 400 }}>
                — Featured
              </h2>
              <span className="text-xs tracking-widest" style={{ fontFamily: mono, color: pencil }}>
                精選 {featuredPosts.length.toString().padStart(2, '0')} 篇
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map((post: BlogPost) => (
                <article
                  key={post.id}
                  className="relative p-6 transition-all duration-200 hover:[transform:rotate(0.3deg)]"
                  style={{
                    background: cream,
                    border: `1px dashed ${kraft}`,
                  }}
                >
                  <div
                    className="absolute -top-3 left-4 px-2 py-0.5 text-xs tracking-widest"
                    style={{
                      background: yellow,
                      border: `1px solid ${marker}`,
                      fontFamily: mono,
                    }}
                  >
                    ★ featured
                  </div>
                  <div
                    className="text-xs tracking-widest mb-4 mt-2"
                    style={{ fontFamily: mono, color: pencil }}
                  >
                    [{post.category}] · {formatDate(post.publishDate)} · {post.readingTime}min
                  </div>
                  <h3
                    className="mb-3"
                    style={{
                      fontFamily: serif,
                      fontSize: '1.5rem',
                      fontWeight: 400,
                      lineHeight: 1.3,
                    }}
                  >
                    <Link
                      to={`/blog/${post.slug}`}
                      style={{ color: marker, borderBottom: '1px dashed transparent' }}
                      className="hover:[border-bottom-color:#C4A77D]"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p
                    className="text-sm line-clamp-3 mb-4"
                    style={{ color: pencil, lineHeight: 1.7 }}
                  >
                    {post.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5"
                        style={{
                          fontFamily: mono,
                          color: pencil,
                          border: `1px dashed ${kraft}`,
                        }}
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

      {/* All posts */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-8">
            <h2 style={{ fontFamily: serif, fontSize: '1.75rem', fontWeight: 400 }}>
              — {hasActiveFilter ? 'Results' : 'All Posts'}
            </h2>
            <div
              className="flex items-baseline gap-3 text-xs tracking-widest"
              style={{ fontFamily: mono, color: pencil }}
            >
              <span>{filteredPosts.length.toString().padStart(3, '0')} found</span>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="hover:bg-[#FFE066] px-2 transition-colors"
                  style={{ color: marker, textDecoration: 'underline' }}
                >
                  reset →
                </button>
              )}
            </div>
          </div>

          {isLoading && (
            <div
              className="text-center py-12 text-sm tracking-widest"
              style={{ fontFamily: mono, color: pencil }}
            >
              loading posts...
            </div>
          )}

          <div className="divide-y" style={{ borderTop: `1px dashed ${kraft}`, borderBottom: `1px dashed ${kraft}` }}>
            {filteredPosts.map((post: BlogPost, index: number) => (
              <article
                key={post.id}
                className="py-8 group transition-colors duration-200"
                style={{ borderBottomStyle: 'dashed', borderBottomColor: kraft }}
              >
                <div
                  className="text-xs tracking-widest mb-3 flex items-center gap-2"
                  style={{ fontFamily: mono, color: pencil }}
                >
                  <span>#{(index + 1).toString().padStart(3, '0')}</span>
                  <span>·</span>
                  <span>[{post.category}]</span>
                  {post.featured && (
                    <>
                      <span>·</span>
                      <span>★</span>
                    </>
                  )}
                </div>

                <h3
                  className="mb-3"
                  style={{
                    fontFamily: serif,
                    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                    fontWeight: 400,
                    lineHeight: 1.2,
                  }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    style={{ color: marker }}
                    className="group-hover:[background:#FFE066] transition-colors"
                  >
                    {post.title}
                  </Link>
                </h3>

                <p
                  className="text-base line-clamp-2 mb-4 max-w-3xl"
                  style={{ color: pencil, lineHeight: 1.75 }}
                >
                  {post.excerpt}
                </p>

                <div
                  className="flex flex-wrap items-baseline justify-between gap-2 text-xs tracking-widest"
                  style={{ fontFamily: mono, color: pencil }}
                >
                  <div className="flex items-baseline gap-2">
                    <time dateTime={post.publishDate}>{formatDate(post.publishDate)}</time>
                    <span>·</span>
                    <span>{post.readingTime}min read</span>
                  </div>
                  <Link
                    to={`/blog/${post.slug}`}
                    style={{ color: marker, borderBottom: `1px dashed ${kraft}` }}
                    className="hover:[background:#FFE066] px-1"
                  >
                    read →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filteredPosts.length === 0 && !isLoading && (
            <div
              className="text-center py-20"
              style={{ border: `1px dashed ${kraft}`, fontFamily: mono, color: pencil }}
            >
              <div className="text-sm tracking-widest mb-4">沒有符合條件的文章</div>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-xs tracking-widest hover:[background:#FFE066] transition-colors"
                style={{ border: `1px dashed ${kraft}`, color: marker }}
              >
                reset filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer note */}
      <section
        className="px-4 py-12"
        style={{ borderTop: `1px dashed ${kraft}` }}
      >
        <div className="max-w-6xl mx-auto">
          <div
            className="text-xs tracking-widest mb-3"
            style={{ fontFamily: mono, color: pencil }}
          >
            — about this blog
          </div>
          <p className="text-base max-w-2xl" style={{ color: marker, lineHeight: 1.8 }}>
            沒有行銷話術、沒有 SEO 關鍵字堆疊。只寫我實際踩過的坑、解過的題、
            帶過的企業內訓心得。看得懂的人會自己留下來。
          </p>
          <div
            className="mt-6 text-xs tracking-widest flex flex-wrap gap-5"
            style={{ fontFamily: mono, color: pencil }}
          >
            <span>— Spring Boot</span>
            <span>— React</span>
            <span>— MySQL / Redis</span>
            <span>— 教學現場</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogListAnti;

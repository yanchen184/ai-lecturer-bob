import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useBlogPosts } from '../hooks/useBlogPosts';
import type { BlogPostView } from '../hooks/useBlogPosts';

/**
 * 「最新文章」區塊 — Anti-polish raw 風格
 *
 * - 顯示 3 篇最新已發佈文章（依 publishDate 降冪）
 * - 純黑白紙質色，硬邊、hard shadow、mono 字體
 * - 使用 HashRouter Link 導到 /blog/:slug 與 /blog
 */
const LatestPosts = () => {
  const { posts, isLoading } = useBlogPosts();

  const latest = useMemo<BlogPostView[]>(() => {
    return [...posts]
      .sort(
        (a, b) =>
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      )
      .slice(0, 3);
  }, [posts]);

  const stats = useMemo(() => {
    const categories = new Set(posts.map((post) => post.category));
    const tags = new Set(posts.flatMap((post) => post.tags));
    return {
      total: posts.length,
      categories: categories.size,
      tags: tags.size,
    };
  }, [posts]);

  const formatDate = (dateString: string): string => {
    return dateString.replaceAll('-', '/');
  };

  return (
    <section
      id="latest-posts"
      className="py-20 px-4 font-mono border-y-2 border-black"
      style={{ background: '#fafaf7', color: '#0a0a0a' }}
      aria-labelledby="latest-posts-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-widest mb-3 opacity-60">
              // blog — 寫給實戰派的技術筆記
            </div>
            <h2
              id="latest-posts-heading"
              className="text-4xl md:text-5xl font-black tracking-tight"
            >
              最新文章 <span className="opacity-30">//</span> BLOG.
            </h2>
            <p className="text-sm md:text-base opacity-80 mt-3 max-w-xl leading-relaxed">
              踩過的坑、解過的題、帶過的企業內訓心得。
              <br className="hidden md:block" />
              不包裝、不美化，看得懂的人會自己留下來。
            </p>
          </div>

          {/* Stat strip */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col items-start">
              <span className="text-2xl font-black leading-none">
                {stats.total.toString().padStart(2, '0')}
              </span>
              <span className="uppercase tracking-widest opacity-60 mt-1">posts</span>
            </div>
            <div className="w-px h-10 bg-black/20" />
            <div className="flex flex-col items-start">
              <span className="text-2xl font-black leading-none">
                {stats.categories.toString().padStart(2, '0')}
              </span>
              <span className="uppercase tracking-widest opacity-60 mt-1">categories</span>
            </div>
            <div className="w-px h-10 bg-black/20" />
            <div className="flex flex-col items-start">
              <span className="text-2xl font-black leading-none">
                {stats.tags.toString().padStart(2, '0')}
              </span>
              <span className="uppercase tracking-widest opacity-60 mt-1">tags</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t-2 border-black"
            aria-label="載入文章中"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`border-b-2 border-black p-5 animate-pulse ${
                  i < 2 ? 'md:border-r-2' : ''
                }`}
              >
                <div className="h-3 w-24 bg-black/20 mb-3" />
                <div className="h-6 w-3/4 bg-black/20 mb-3" />
                <div className="h-3 w-full bg-black/10 mb-2" />
                <div className="h-3 w-5/6 bg-black/10 mb-4" />
                <div className="h-3 w-16 bg-black/20" />
              </div>
            ))}
          </div>
        ) : latest.length === 0 ? (
          <div className="text-center text-xs opacity-60 py-12 border-2 border-black border-dashed">
            // no posts yet
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t-2 border-black">
              {latest.map((post, index) => (
                <article
                  key={post.id}
                  className={`flex flex-col p-5 border-b-2 border-black hover:bg-[#ffff00] transition-colors group ${
                    index < latest.length - 1 ? 'md:border-r-2' : ''
                  }`}
                >
                  <div className="text-xs uppercase tracking-widest mb-3 opacity-70 flex items-center gap-2">
                    <span className="font-black">
                      #{(index + 1).toString().padStart(2, '0')}
                    </span>
                    <span>·</span>
                    <span>[{post.category}]</span>
                  </div>

                  <h3 className="text-lg md:text-xl font-black leading-tight mb-3 line-clamp-2">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>

                  <p className="text-sm leading-relaxed line-clamp-3 mb-4 opacity-80 flex-1">
                    {post.excerpt}
                  </p>

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] uppercase tracking-wider border border-black px-1.5 py-0.5 opacity-70"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-baseline justify-between text-xs opacity-70 mt-auto pt-2 border-t border-black/10">
                    <time dateTime={post.publishDate}>
                      {formatDate(post.publishDate)}
                      {post.readingTime ? ` · ${post.readingTime}min` : ''}
                    </time>
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

            {/* View all button */}
            <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
              <div className="text-xs uppercase tracking-widest opacity-60">
                // {posts.length.toString().padStart(3, '0')} posts total · 持續更新中
              </div>
              <Link
                to="/blog"
                className="inline-block px-5 py-2 text-xs uppercase tracking-widest font-black border-2 border-black bg-white hover:bg-[#ffff00] transition-colors"
                style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
              >
                [ view all posts → ]
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default LatestPosts;

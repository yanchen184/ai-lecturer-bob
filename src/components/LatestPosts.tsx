import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useBlogPosts } from '../hooks/useBlogPosts';
import type { BlogPostView } from '../hooks/useBlogPosts';

/**
 * 共用「最新文章」區塊
 *
 * - 顯示 3 篇最新已發佈文章（依 publishDate 降冪）
 * - 使用獨立中性白底 section，讓 6 個主題（深/淺色背景）都能一致呈現
 * - 使用 HashRouter Link 導到 /blog/:slug 與 /blog
 * - 載入中顯示 skeleton
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <section
      id="latest-posts"
      className="py-20 px-4 bg-white text-slate-900"
      aria-labelledby="latest-posts-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase text-slate-500 mb-3">
            Latest Posts
          </p>
          <h2
            id="latest-posts-heading"
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            最新文章
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            實戰開發經驗與教學心得，定期更新技術文章
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            aria-label="載入文章中"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="border border-slate-200 rounded-2xl p-6 bg-slate-50 animate-pulse"
              >
                <div className="h-4 w-24 bg-slate-200 rounded mb-4" />
                <div className="h-6 w-3/4 bg-slate-200 rounded mb-3" />
                <div className="h-6 w-1/2 bg-slate-200 rounded mb-5" />
                <div className="h-3 w-full bg-slate-200 rounded mb-2" />
                <div className="h-3 w-5/6 bg-slate-200 rounded mb-6" />
                <div className="h-4 w-20 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : latest.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            尚無文章，敬請期待。
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latest.map((post) => (
                <article
                  key={post.id}
                  className="group flex flex-col border border-slate-200 rounded-2xl p-6 bg-white hover:border-slate-400 hover:shadow-lg transition-all duration-300"
                >
                  {/* Category + Date */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {post.category}
                    </span>
                    <time dateTime={post.publishDate}>
                      {formatDate(post.publishDate)}
                    </time>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug line-clamp-2 group-hover:text-slate-700 transition-colors">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-5 flex-1">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Read more */}
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 group-hover:gap-2 transition-all"
                    aria-label={`閱讀文章：${post.title}`}
                  >
                    閱讀更多
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>

            {/* View all button */}
            <div className="text-center mt-12">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-700 transition-colors"
              >
                查看全部文章
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default LatestPosts;

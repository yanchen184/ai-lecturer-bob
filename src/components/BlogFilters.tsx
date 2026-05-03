/**
 * Blog 列表的客戶端互動（搜尋、分類、標籤篩選）。
 *
 * 策略：SSR 輸出完整列表（SEO 有料），client island 在瀏覽器用 CSS
 * 控制哪些卡片顯示。列表 DOM 透過 `data-category` / `data-tags`
 * / `data-title` attribute 標記，本元件只負責根據 query 隱藏不符合的。
 *
 * URL query 為 single source of truth：?cat=xxx&tag=yyy&q=zzz
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Props {
  categories: string[];
  tags: string[];
  /** SSR 就有的 post 總數（僅展示用） */
  totalPosts: number;
}

const ALL = 'all';

export default function BlogFilters({
  categories,
  tags,
  totalPosts,
}: Props): JSX.Element {
  const [category, setCategory] = useState<string>(ALL);
  const [tag, setTag] = useState<string>(ALL);
  const [query, setQuery] = useState<string>('');

  // URL → state
  useEffect(() => {
    const url = new URL(window.location.href);
    setCategory(url.searchParams.get('cat') ?? ALL);
    setTag(url.searchParams.get('tag') ?? ALL);
    setQuery(url.searchParams.get('q') ?? '');
  }, []);

  // state → URL（replaceState，避免污染 history）
  const pushQuery = useCallback(
    (key: 'cat' | 'tag' | 'q', value: string) => {
      const url = new URL(window.location.href);
      if (value === '' || value === ALL) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
      window.history.replaceState({}, '', url.toString());
    },
    []
  );

  // state → DOM hide/show
  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const articles = document.querySelectorAll<HTMLElement>(
      '[data-blog-card]'
    );
    let visible = 0;

    articles.forEach((el) => {
      const elCat = el.dataset.category ?? '';
      const elTags = (el.dataset.tags ?? '').split('|').filter(Boolean);
      const elTitle = (el.dataset.title ?? '').toLowerCase();
      const elExcerpt = (el.dataset.excerpt ?? '').toLowerCase();

      const matchCat = category === ALL || elCat === category;
      const matchTag = tag === ALL || elTags.includes(tag);
      const matchQuery =
        normalizedQuery === '' ||
        elTitle.includes(normalizedQuery) ||
        elExcerpt.includes(normalizedQuery);

      const show = matchCat && matchTag && matchQuery;
      el.hidden = !show;
      if (show) visible += 1;
    });

    // 更新計數 & featured 區塊顯示
    const countEl = document.querySelector<HTMLElement>('[data-blog-count]');
    if (countEl) {
      countEl.textContent = visible.toString().padStart(3, '0');
    }
    const emptyEl = document.querySelector<HTMLElement>('[data-blog-empty]');
    if (emptyEl) emptyEl.hidden = visible !== 0;
  }, [category, tag, query]);

  const hasFilter =
    category !== ALL || tag !== ALL || query.trim() !== '';

  const reset = useCallback(() => {
    setCategory(ALL);
    setTag(ALL);
    setQuery('');
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  }, []);

  const onCat = useCallback(
    (v: string) => {
      setCategory(v);
      pushQuery('cat', v);
    },
    [pushQuery]
  );
  const onTag = useCallback(
    (v: string) => {
      setTag(v);
      pushQuery('tag', v);
    },
    [pushQuery]
  );
  const onQuery = useCallback(
    (v: string) => {
      setQuery(v);
      pushQuery('q', v);
    },
    [pushQuery]
  );

  const tagOpen = useMemo(() => tag !== ALL, [tag]);

  return (
    <div className="max-w-6xl mx-auto space-y-3">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <label htmlFor="blog-search" className="sr-only">
            搜尋文章
          </label>
          <input
            id="blog-search"
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="> grep 標題或摘要..."
            className="w-full px-3 py-2 bg-white border-2 border-black font-mono text-sm focus:outline-none focus:bg-[#ffff00] placeholder:opacity-50"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 hover:bg-black hover:text-white transition-colors"
              aria-label="清除搜尋"
            >
              [×]
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onCat(ALL)}
            className={`px-2.5 py-1 text-xs uppercase tracking-wider border-2 border-black transition-colors ${
              category === ALL
                ? 'bg-black text-white'
                : 'bg-white hover:bg-[#ffff00]'
            }`}
          >
            [all]
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onCat(c)}
              className={`px-2.5 py-1 text-xs uppercase tracking-wider border-2 border-black transition-colors ${
                category === c
                  ? 'bg-black text-white'
                  : 'bg-white hover:bg-[#ffff00]'
              }`}
            >
              [{c}]
            </button>
          ))}
        </div>
      </div>

      {tags.length > 0 && (
        <details className="group" open={tagOpen}>
          <summary className="cursor-pointer text-xs uppercase tracking-widest opacity-60 hover:opacity-100 select-none inline-flex items-center gap-2 list-none">
            <span className="transition-transform group-open:rotate-90">›</span>
            <span>
              tags
              {tag !== ALL && (
                <span className="ml-2 px-1.5 py-0.5 bg-black text-white text-[10px]">
                  #{tag}
                </span>
              )}
              <span className="ml-2 opacity-50">
                ({tags.length.toString().padStart(2, '0')})
              </span>
            </span>
          </summary>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <button
              onClick={() => onTag(ALL)}
              className={`px-2 py-0.5 text-xs border border-black transition-colors ${
                tag === ALL
                  ? 'bg-black text-white'
                  : 'bg-white hover:bg-[#ffff00]'
              }`}
            >
              *
            </button>
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => onTag(t)}
                className={`px-2 py-0.5 text-xs border border-black transition-colors ${
                  tag === t
                    ? 'bg-black text-white'
                    : 'bg-white hover:bg-[#ffff00]'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        </details>
      )}

      {hasFilter && (
        <div className="flex items-baseline gap-3 text-xs">
          <span className="opacity-60">
            [{''}<span data-blog-count>{totalPosts.toString().padStart(3, '0')}</span>{' '}
            found]
          </span>
          <button
            type="button"
            onClick={reset}
            className="uppercase tracking-widest underline hover:bg-[#ffff00] transition-colors"
          >
            reset →
          </button>
        </div>
      )}
    </div>
  );
}

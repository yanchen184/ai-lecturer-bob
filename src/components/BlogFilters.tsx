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
      countEl.textContent = visible.toString();
    }
    const emptyEl = document.querySelector<HTMLElement>('[data-blog-empty]');
    if (emptyEl) emptyEl.hidden = visible !== 0;

    const featuredSection = document.querySelector<HTMLElement>(
      '[data-blog-featured]'
    );
    if (featuredSection) {
      const hasFilter =
        category !== ALL || tag !== ALL || normalizedQuery !== '';
      featuredSection.hidden = hasFilter;
    }
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
    <div className="flex flex-col gap-4">
      <div className="relative w-full">
        <label htmlFor="blog-search" className="sr-only">
          搜尋文章
        </label>
        <input
          id="blog-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="搜尋標題或摘要…"
          className="garden-filter__search"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery('')}
            className="garden-filter__clear"
            aria-label="清除搜尋"
          >
            clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCat(ALL)}
          className="garden-filter__chip"
          data-active={category === ALL}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => onCat(c)}
            className="garden-filter__chip"
            data-active={category === c}
          >
            {c}
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <details open={tagOpen} className="garden-filter__tags">
          <summary>
            <span className="garden-filter__tags-marker" aria-hidden="true">+</span>
            <span>展開標籤</span>
            {tag !== ALL && (
              <span className="garden-filter__tag-active">· #{tag}</span>
            )}
          </summary>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <button
              onClick={() => onTag(ALL)}
              className="garden-filter__chip garden-filter__chip--sm"
              data-active={tag === ALL}
            >
              all
            </button>
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => onTag(t)}
                className="garden-filter__chip garden-filter__chip--sm"
                data-active={tag === t}
              >
                #{t}
              </button>
            ))}
          </div>
        </details>
      )}

      {hasFilter && (
        <div className="garden-filter__status">
          <span>
            <span data-blog-count>{totalPosts}</span> 篇符合條件
          </span>
          <button
            type="button"
            onClick={reset}
            className="garden-filter__reset"
          >
            reset →
          </button>
        </div>
      )}
    </div>
  );
}

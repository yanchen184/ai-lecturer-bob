/**
 * Blog 列表的客戶端互動（搜尋、分類、標籤篩選）— Neub 風格。
 *
 * SSR 出完整列表（SEO 有料），client island 在瀏覽器用 CSS
 * 控制哪些卡片顯示。列表 DOM 透過 data-* attribute 標記，本元件
 * 只負責根據 query 隱藏不符合的。
 *
 * URL query 為 single source of truth：?cat=xxx&tag=yyy&q=zzz
 */
import { useCallback, useEffect, useState } from 'react';

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
  // 跑 DOM filter 用,跟 input value 分開以做 debounce
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  // URL → state
  useEffect(() => {
    const url = new URL(window.location.href);
    setCategory(url.searchParams.get('cat') ?? ALL);
    setTag(url.searchParams.get('tag') ?? ALL);
    const initQ = url.searchParams.get('q') ?? '';
    setQuery(initQ);
    setDebouncedQuery(initQ);
  }, []);

  // 搜尋 debounce(180ms),避免每打一字就 querySelectorAll
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 180);
    return () => clearTimeout(t);
  }, [query]);

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

  // state → DOM hide/show（用 debouncedQuery 跑,避免快速打字時 layout thrash）
  useEffect(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
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

    const countEl = document.querySelector<HTMLElement>('[data-blog-count]');
    if (countEl) countEl.textContent = visible.toString();

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
  }, [category, tag, debouncedQuery]);

  const hasFilter =
    category !== ALL || tag !== ALL || query.trim() !== '';

  const reset = useCallback(() => {
    setCategory(ALL);
    setTag(ALL);
    setQuery('');
    setDebouncedQuery('');
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  }, []);

  // 暴露給 empty state 按鈕呼叫(SSR 出的元素無法直接綁 React event)
  useEffect(() => {
    (window as unknown as { __resetBlogFilters?: () => void }).__resetBlogFilters = reset;
    return () => {
      delete (window as unknown as { __resetBlogFilters?: () => void }).__resetBlogFilters;
    };
  }, [reset]);

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

  const chipClass = (active: boolean): string =>
    [
      'px-2 py-0.5 text-[11px] uppercase tracking-widest font-mono font-black border-2 border-black transition-colors',
      active
        ? 'bg-black text-[var(--color-neub-yellow)]'
        : 'bg-white hover:bg-[var(--color-neub-yellow)]',
    ].join(' ');

  const tagChipClass = (active: boolean): string =>
    [
      'px-1.5 py-0.5 text-[10px] uppercase tracking-widest font-mono border border-black/40 transition-colors',
      active
        ? 'bg-black text-[var(--color-neub-yellow)] font-black border-black'
        : 'bg-[var(--color-sink)] text-[var(--color-ink-60)] hover:bg-[var(--color-neub-yellow)] hover:text-black',
    ].join(' ');

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 搜尋：縮小,只佔一點點 */}
      <div className="relative">
        <label htmlFor="blog-search" className="sr-only">
          搜尋文章
        </label>
        <input
          id="blog-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="搜尋…"
          className="w-40 sm:w-48 border-2 border-black bg-white pl-2.5 pr-7 py-1 text-xs font-mono focus:outline-none focus:bg-[var(--color-neub-yellow)] placeholder:opacity-50"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-mono font-black hover:text-black/50"
            aria-label="清除搜尋"
          >
            ✕
          </button>
        )}
      </div>

      {/* 分類 + 標籤 同一行 */}
      <button onClick={() => onCat(ALL)} className={chipClass(category === ALL)}>
        All
      </button>
      {categories.map((c) => (
        <button key={c} onClick={() => onCat(c)} className={chipClass(category === c)}>
          {c}
        </button>
      ))}

      {tags.length > 0 && (
        <>
          <span aria-hidden="true" className="text-black/20">|</span>
          <details className="relative">
            <summary className="cursor-pointer list-none flex items-center gap-1 text-[11px] uppercase tracking-widest font-mono font-black border-2 border-black bg-white hover:bg-[var(--color-neub-yellow)] px-2 py-0.5 select-none">
              <span>標籤</span>
              {tag !== ALL ? (
                <span className="bg-[var(--color-neub-yellow)] border border-black px-1 leading-none">#{tag}</span>
              ) : (
                <span aria-hidden="true">▾</span>
              )}
            </summary>
            <div className="absolute left-0 top-full mt-1 z-20 w-[min(20rem,80vw)] max-h-64 overflow-y-auto border-2 border-black bg-white shadow-hard p-2 flex flex-wrap gap-1.5">
              <button onClick={() => onTag(ALL)} className={tagChipClass(tag === ALL)}>
                all
              </button>
              {tags.map((t) => (
                <button key={t} onClick={() => onTag(t)} className={tagChipClass(tag === t)}>
                  #{t}
                </button>
              ))}
            </div>
          </details>
        </>
      )}

      {hasFilter && (
        <button
          type="button"
          onClick={reset}
          className="ml-auto text-[10px] uppercase tracking-widest font-mono font-black border-2 border-black bg-white hover:bg-[var(--color-neub-yellow)] px-2 py-0.5"
        >
          reset <span className="opacity-70">(<span data-blog-count>{totalPosts}</span>)</span>
        </button>
      )}
    </div>
  );
}

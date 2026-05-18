/**
 * Blog 列表的客戶端互動（搜尋、分類、標籤篩選）— Neub 風格。
 *
 * SSR 出完整列表（SEO 有料），client island 在瀏覽器用 CSS
 * 控制哪些卡片顯示。列表 DOM 透過 data-* attribute 標記，本元件
 * 只負責根據 query 隱藏不符合的。
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

  const tagOpen = useMemo(() => tag !== ALL, [tag]);

  const chipClass = (active: boolean): string =>
    [
      'px-3 py-1 text-xs uppercase tracking-widest font-mono font-black border-2 border-black transition-colors',
      active
        ? 'bg-black text-[var(--color-neub-yellow)]'
        : 'bg-white hover:bg-[var(--color-neub-yellow)]',
    ].join(' ');

  const tagChipClass = (active: boolean): string =>
    [
      'px-2 py-0.5 text-[11px] uppercase tracking-widest font-mono border-2 border-black transition-colors',
      active
        ? 'bg-black text-[var(--color-neub-yellow)] font-black'
        : 'bg-white hover:bg-[var(--color-neub-yellow)]',
    ].join(' ');

  return (
    <div className="border-2 border-black bg-white p-4 md:p-5 flex flex-col gap-4">
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
          className="w-full border-2 border-black bg-white px-4 py-2.5 text-sm font-mono focus:outline-none focus:bg-[var(--color-neub-yellow)] placeholder:opacity-50"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-widest font-mono font-black border-2 border-black bg-white hover:bg-[var(--color-neub-yellow)] px-2 py-0.5"
            aria-label="清除搜尋"
          >
            clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => onCat(ALL)} className={chipClass(category === ALL)}>
          All
        </button>
        {categories.map((c) => (
          <button key={c} onClick={() => onCat(c)} className={chipClass(category === c)}>
            {c}
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <details open={tagOpen} className="border-t border-dashed border-black/30 pt-3">
          <summary className="cursor-pointer list-none flex items-center gap-2 text-xs uppercase tracking-widest font-mono font-black select-none hover:text-black/60 transition-colors">
            <span aria-hidden="true" className="inline-block w-4 text-center">+</span>
            <span>展開標籤</span>
            {tag !== ALL && (
              <span className="ml-auto bg-[var(--color-neub-yellow)] px-2 py-0.5 border-2 border-black">
                #{tag}
              </span>
            )}
          </summary>
          <div className="flex flex-wrap gap-1.5 mt-3 pl-6">
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
      )}

      {hasFilter && (
        <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-black/30 pt-3 text-xs font-mono uppercase tracking-widest">
          <span>
            <span data-blog-count className="font-black text-base">{totalPosts}</span>
            <span className="ml-1.5 opacity-70">篇符合條件</span>
          </span>
          <button
            type="button"
            onClick={reset}
            className="font-black border-2 border-black bg-white hover:bg-[var(--color-neub-yellow)] px-2 py-1"
          >
            reset →
          </button>
        </div>
      )}
    </div>
  );
}

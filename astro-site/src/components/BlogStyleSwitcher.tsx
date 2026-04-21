import { useEffect, useState } from 'react';

type Style = 'neub' | 'anti';

interface Props {
  defaultStyle?: Style;
}

const STORAGE_KEY = 'blog-prose-style';

export default function BlogStyleSwitcher({ defaultStyle = 'neub' }: Props) {
  const [style, setStyle] = useState<Style>(defaultStyle);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Style | null;
    if (saved === 'neub' || saved === 'anti') {
      setStyle(saved);
    }
  }, []);

  useEffect(() => {
    const article = document.querySelector<HTMLElement>('[data-blog-prose]');
    if (!article) return;
    article.classList.toggle('blog-prose-anti', style === 'anti');
    localStorage.setItem(STORAGE_KEY, style);
  }, [style]);

  return (
    <div className="inline-flex items-center gap-2 text-xs font-mono">
      <span className="uppercase tracking-widest opacity-60">style:</span>
      <div className="inline-flex border-2 border-black">
        <button
          type="button"
          onClick={() => setStyle('neub')}
          className={`px-3 py-1 uppercase tracking-widest transition-colors ${
            style === 'neub'
              ? 'bg-black text-white'
              : 'bg-white hover:bg-[var(--color-neub-yellow)]'
          }`}
          aria-pressed={style === 'neub'}
        >
          neub
        </button>
        <button
          type="button"
          onClick={() => setStyle('anti')}
          className={`px-3 py-1 uppercase tracking-widest transition-colors border-l-2 border-black ${
            style === 'anti'
              ? 'bg-black text-white'
              : 'bg-white hover:bg-[var(--color-neub-yellow)]'
          }`}
          aria-pressed={style === 'anti'}
        >
          anti
        </button>
      </div>
    </div>
  );
}

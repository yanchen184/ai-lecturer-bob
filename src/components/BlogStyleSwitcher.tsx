import { useBlogStyle } from '../contexts/BlogStyleContext';
import type { BlogStyle } from '../contexts/BlogStyleContext';

interface StyleOption {
  id: BlogStyle;
  name: string;
  color: string;
}

const OPTIONS: readonly StyleOption[] = [
  { id: 'neub', name: 'Neub', color: '#FFEB3B' },
  { id: 'anti', name: 'Anti', color: '#C4A77D' },
] as const;

/** Floating switcher for /blog* routes. Mirrors the home StyleSwitcher pill. */
const BlogStyleSwitcher = () => {
  const { style, setStyle } = useBlogStyle();

  return (
    <div
      className="fixed top-3 right-4 z-[60] flex items-center gap-1 p-1 rounded-full"
      style={{
        background: 'rgba(20, 20, 28, 0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      role="group"
      aria-label="部落格風格切換"
    >
      {OPTIONS.map((option) => {
        const isActive = option.id === style;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setStyle(option.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer select-none"
            style={{
              background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.85)',
            }}
            aria-pressed={isActive}
            aria-label={`切換部落格風格為 ${option.name}`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: option.color }}
            />
            {option.name}
          </button>
        );
      })}
    </div>
  );
};

export default BlogStyleSwitcher;

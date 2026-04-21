import { Link } from 'react-router-dom';

// The 3 secondary themes that live at page bottom instead of top-right.
const SECONDARY_THEMES = [
  {
    id: 'bento-box',
    name: 'Nature Distilled',
    description: '大地色調、有機質感、手作溫暖',
    path: '/style/bento-box',
    gradient: 'linear-gradient(135deg, #C67B5C, #D4C4A8, #6B7B3C)',
  },
  {
    id: 'bold-typography',
    name: 'Motion-Driven',
    description: '動態驅動、流暢轉場、視覺敘事',
    path: '/style/bold-typography',
    gradient: 'linear-gradient(135deg, #6366F1, #EC4899, #F59E0B)',
  },
  {
    id: 'aurora',
    name: 'Parallax Storytelling',
    description: '視差滾動、章節敘事、電影級沉浸',
    path: '/style/aurora',
    gradient: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #e94560)',
  },
] as const;

/** Bottom-of-page gallery for curious visitors. Right-top switcher only shows Neub + Anti. */
const ThemeShowcase = () => {
  return (
    <section
      id="theme-showcase"
      className="py-16 px-4 sm:px-6 lg:px-8"
      style={{ background: 'rgba(0, 0, 0, 0.25)' }}
      aria-labelledby="theme-showcase-title"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-2">
            Bonus · Design Playground
          </p>
          <h2
            id="theme-showcase-title"
            className="text-2xl sm:text-3xl font-bold text-white mb-2"
          >
            另外三種風格實驗
          </h2>
          <p className="text-sm text-white/60 max-w-lg mx-auto">
            同樣的內容，三種不同設計語彙。純粹是做爽的，有興趣可以點進去看看。
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECONDARY_THEMES.map((theme) => (
            <Link
              key={theme.id}
              to={theme.path}
              className="group relative block overflow-hidden rounded-xl transition-transform duration-300 hover:scale-[1.02]"
              style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              <div
                className="h-28 w-full"
                style={{ background: theme.gradient }}
                aria-hidden="true"
              />
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{theme.name}</span>
                  <span className="text-white/40 group-hover:text-white/80 transition-colors">→</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">{theme.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ThemeShowcase;

import { useNavigate } from 'react-router-dom';

interface StyleSwitcherProps {
  currentTheme: string;
}

// Only these two are surfaced at the top-right. Others live in the footer showcase.
const PRIMARY_THEMES = [
  { id: 'swiss-modernism', name: 'Neub', path: '/style/swiss-modernism', color: '#FFEB3B' },
  { id: 'liquid-glass', name: 'Anti', path: '/style/liquid-glass', color: '#C4A77D' },
] as const;

const StyleSwitcher = ({ currentTheme }: StyleSwitcherProps) => {
  const navigate = useNavigate();

  return (
    <div
      className="fixed top-4 right-4 z-[60] flex items-center gap-1 p-1 rounded-full"
      style={{
        background: 'rgba(20, 20, 28, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      role="group"
      aria-label="主題切換"
    >
      {PRIMARY_THEMES.map((theme) => {
        const isActive = theme.id === currentTheme;
        return (
          <button
            key={theme.id}
            onClick={() => navigate(theme.path)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer select-none"
            style={{
              background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.85)',
            }}
            aria-pressed={isActive}
            aria-label={`切換到 ${theme.name} 主題`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: theme.color }}
            />
            {theme.name}
          </button>
        );
      })}
    </div>
  );
};

export default StyleSwitcher;

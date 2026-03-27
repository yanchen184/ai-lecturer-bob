import { Link } from 'react-router-dom';
import { themes } from '../themes/registry';

interface StyleSwitcherProps {
  currentTheme: string;
}

const StyleSwitcher = ({ currentTheme }: StyleSwitcherProps) => {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[9999] backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 15, 0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-10 flex items-center gap-1 overflow-x-auto text-xs">
        <Link
          to="/"
          className="shrink-0 px-3 py-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 whitespace-nowrap"
        >
          &larr; 所有風格
        </Link>
        <div className="w-px h-4 bg-white/10 shrink-0 mx-1" />
        {themes.map((theme) => (
          <Link
            key={theme.id}
            to={theme.path}
            className={`shrink-0 px-3 py-1 rounded-full transition-all duration-200 whitespace-nowrap ${
              currentTheme === theme.id
                ? 'bg-white/15 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {theme.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default StyleSwitcher;

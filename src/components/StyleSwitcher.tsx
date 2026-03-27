import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { themes } from '../themes/registry';

interface StyleSwitcherProps {
  currentTheme: string;
}

const themeColors: Record<string, string> = {
  'ai-native': '#00FF88',
  'bento-box': '#007AFF',
  'bold-typography': '#FF3D00',
  'swiss-modernism': '#FF0000',
  'aurora': '#00D2FF',
  'liquid-glass': '#AF52DE',
};

const StyleSwitcher = ({ currentTheme }: StyleSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const currentThemeData = themes.find(t => t.id === currentTheme);
  const currentName = currentThemeData?.name || 'Theme';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div
      ref={dropdownRef}
      className="fixed top-4 right-4 z-50"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/90 transition-all duration-200 hover:text-white cursor-pointer select-none"
        style={{
          background: 'rgba(30, 30, 40, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Switch theme style"
      >
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ background: themeColors[currentTheme] || '#888' }}
        />
        <span className="whitespace-nowrap">{currentName}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-[280px] rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(20, 20, 28, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
          }}
          role="listbox"
          aria-label="Available theme styles"
        >
          <div className="p-2">
            {themes.map((theme) => {
              const isActive = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelect(theme.path)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                  role="option"
                  aria-selected={isActive}
                >
                  {/* Color swatch */}
                  <span
                    className="w-4 h-4 rounded-md shrink-0 mt-0.5"
                    style={{
                      background: themeColors[theme.id] || '#888',
                      boxShadow: `0 0 8px ${themeColors[theme.id] || '#888'}40`,
                    }}
                  />

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium truncate ${
                          isActive ? 'text-white' : 'text-white/80'
                        }`}
                      >
                        {theme.name}
                      </span>
                      {isActive && (
                        <svg
                          className="w-4 h-4 shrink-0 text-green-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 truncate">
                      {theme.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleSwitcher;

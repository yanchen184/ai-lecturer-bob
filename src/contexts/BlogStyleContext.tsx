import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type BlogStyle = 'neub' | 'anti';

const STORAGE_KEY = 'blog-style';
const DEFAULT_STYLE: BlogStyle = 'neub';

function readStoredStyle(): BlogStyle | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'neub' || value === 'anti' ? value : null;
  } catch {
    return null;
  }
}

interface BlogStyleContextValue {
  style: BlogStyle;
  /** true when the user explicitly picked a style (localStorage hit). */
  isUserChoice: boolean;
  setStyle: (next: BlogStyle) => void;
  /** Apply an author-defined default — only takes effect if user hasn't chosen. */
  applyPostDefault: (postDefault: BlogStyle | undefined | null) => void;
}

const BlogStyleContext = createContext<BlogStyleContextValue | null>(null);

interface BlogStyleProviderProps {
  children: ReactNode;
}

export function BlogStyleProvider({ children }: BlogStyleProviderProps) {
  const initialStored = typeof window !== 'undefined' ? readStoredStyle() : null;
  const [style, setStyleState] = useState<BlogStyle>(initialStored ?? DEFAULT_STYLE);
  const [isUserChoice, setIsUserChoice] = useState<boolean>(initialStored !== null);

  const setStyle = useCallback((next: BlogStyle) => {
    setStyleState(next);
    setIsUserChoice(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage may be unavailable (private browsing) — UI state still applies.
    }
  }, []);

  const applyPostDefault = useCallback(
    (postDefault: BlogStyle | undefined | null) => {
      if (!postDefault || postDefault === style) return;
      // Only override when the reader hasn't explicitly chosen a style.
      if (isUserChoice) return;
      setStyleState(postDefault);
    },
    [isUserChoice, style],
  );

  // Sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue === 'neub' || e.newValue === 'anti') {
        setStyleState(e.newValue);
        setIsUserChoice(true);
      } else if (e.newValue === null) {
        setStyleState(DEFAULT_STYLE);
        setIsUserChoice(false);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<BlogStyleContextValue>(
    () => ({ style, isUserChoice, setStyle, applyPostDefault }),
    [style, isUserChoice, setStyle, applyPostDefault],
  );

  return <BlogStyleContext.Provider value={value}>{children}</BlogStyleContext.Provider>;
}

export function useBlogStyle(): BlogStyleContextValue {
  const ctx = useContext(BlogStyleContext);
  if (!ctx) {
    throw new Error('useBlogStyle must be used within <BlogStyleProvider>');
  }
  return ctx;
}

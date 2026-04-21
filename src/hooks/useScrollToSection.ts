import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * 從其他路由(例如 /blog)經 Navbar 導回首頁時，透過 location.state.scrollTo
 * 指定要滾到的 section id。ThemePage 掛上這個 hook 即可。
 */
export function useScrollToSection(): void {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    const sectionId = state?.scrollTo;
    if (!sectionId) return;

    // 延後到下一個 paint 再 scroll，確保 section 已經 mount
    const timer = window.setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // 清掉 state，避免下次重新 render 又跳一次
      navigate(location.pathname, { replace: true, state: null });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [location, navigate]);
}

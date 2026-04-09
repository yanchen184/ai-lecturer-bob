import { lazy } from 'react';

export interface ThemeEntry {
  id: string;
  name: string;
  description: string;
  preview: string;
  path: string;
  gradient: string;
  loader: React.LazyExoticComponent<React.ComponentType>;
}

export const themes: ThemeEntry[] = [
  {
    id: 'ai-native',
    name: 'Cyberpunk',
    description: '霓虹光影、Glitch 特效、未來科技感',
    preview: '深色 . 霓虹 . 賽博龐克',
    path: '/style/ai-native',
    gradient: 'linear-gradient(135deg, #0080FF, #FF006E, #00FFFF)',
    loader: lazy(() => import('./ai-native/ThemePage')),
  },
  {
    id: 'bento-box',
    name: 'Bento Box',
    description: 'Apple 風格模組化卡片，乾淨專業',
    preview: '亮色 . 圓角 . Apple 風格',
    path: '/style/bento-box',
    gradient: 'linear-gradient(135deg, #007AFF, #AF52DE, #FF6B9D)',
    loader: lazy(() => import('./bento-box/ThemePage')),
  },
  {
    id: 'bold-typography',
    name: 'Glassmorphism',
    description: '毛玻璃透光質感，高端企業風',
    preview: '半透明 . 模糊 . 玻璃',
    path: '/style/bold-typography',
    gradient: 'linear-gradient(135deg, #667EEA, #764BA2, #F093FB)',
    loader: lazy(() => import('./bold-typography/ThemePage')),
  },
  {
    id: 'swiss-modernism',
    name: 'Neubrutalism',
    description: '粗框色塊、硬派陰影、大膽搶眼',
    preview: '亮色 . 粗框 . Gen Z',
    path: '/style/swiss-modernism',
    gradient: 'linear-gradient(135deg, #FFEB3B, #FF5252, #2196F3)',
    loader: lazy(() => import('./swiss-modernism/ThemePage')),
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: '極光漸層、流動色彩、夢幻優雅',
    preview: '深色 . 極光 . 漸層',
    path: '/style/aurora',
    gradient: 'linear-gradient(135deg, #00D2FF, #7A5FFF, #FF6B9D, #C3FF68)',
    loader: lazy(() => import('./aurora/ThemePage')),
  },
  {
    id: 'liquid-glass',
    name: 'Liquid Glass',
    description: 'Apple 最新設計語言，液態玻璃質感',
    preview: '深色 . 玻璃 . 光澤',
    path: '/style/liquid-glass',
    gradient: 'linear-gradient(135deg, #007AFF, #AF52DE, #34C759)',
    loader: lazy(() => import('./liquid-glass/ThemePage')),
  },
];

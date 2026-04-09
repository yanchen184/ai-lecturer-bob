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
    id: 'swiss-modernism',
    name: 'Neubrutalism',
    description: '粗框色塊、硬派陰影、大膽搶眼',
    preview: '亮色 . 粗框 . Gen Z',
    path: '/style/swiss-modernism',
    gradient: 'linear-gradient(135deg, #FFEB3B, #FF5252, #2196F3)',
    loader: lazy(() => import('./swiss-modernism/ThemePage')),
  },
  {
    id: 'bento-box',
    name: 'Nature Distilled',
    description: '大地色調、有機質感、手作溫暖',
    preview: '暖色 . 有機 . 手作感',
    path: '/style/bento-box',
    gradient: 'linear-gradient(135deg, #C67B5C, #D4C4A8, #6B7B3C)',
    loader: lazy(() => import('./bento-box/ThemePage')),
  },
  {
    id: 'bold-typography',
    name: 'Motion-Driven',
    description: '動態驅動、流暢轉場、視覺敘事',
    preview: '深色 . 動畫 . 流暢',
    path: '/style/bold-typography',
    gradient: 'linear-gradient(135deg, #6366F1, #EC4899, #F59E0B)',
    loader: lazy(() => import('./bold-typography/ThemePage')),
  },
  {
    id: 'aurora',
    name: 'Parallax Storytelling',
    description: '視差滾動、章節敘事、電影級沉浸',
    preview: '深色 . 視差 . 電影感',
    path: '/style/aurora',
    gradient: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #e94560)',
    loader: lazy(() => import('./aurora/ThemePage')),
  },
  {
    id: 'liquid-glass',
    name: 'Anti-Polish / Raw',
    description: '手繪質感、紙張肌理、真實不修飾',
    preview: '亮色 . 手繪 . 反設計',
    path: '/style/liquid-glass',
    gradient: 'linear-gradient(135deg, #FAFAF8, #C4A77D, #4A4A4A)',
    loader: lazy(() => import('./liquid-glass/ThemePage')),
  },
];

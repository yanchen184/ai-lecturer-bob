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
    name: 'AI-Native UI',
    description: '未來感科技介面，霓虹漸層搭配神經網路粒子效果',
    preview: '深色 . 霓虹 . 科技感',
    path: '/style/ai-native',
    gradient: 'linear-gradient(135deg, #00FF88, #00D4FF, #7B61FF)',
    loader: lazy(() => import('./ai-native/ThemePage')),
  },
  {
    id: 'bento-box',
    name: 'Bento Box Grid',
    description: 'Apple 風格便當格佈局，現代感資訊展示',
    preview: '亮色 . 圓角 . Apple 風格',
    path: '/style/bento-box',
    gradient: 'linear-gradient(135deg, #007AFF, #AF52DE, #FF6B9D)',
    loader: lazy(() => import('./bento-box/ThemePage')),
  },
  {
    id: 'bold-typography',
    name: 'Bold Typography',
    description: '超大粗體排版，海報級視覺衝擊力',
    preview: '深色 . 大字 . 海報風',
    path: '/style/bold-typography',
    gradient: 'linear-gradient(135deg, #00FF88, #7B61FF, #FF61D8)',
    loader: lazy(() => import('./bold-typography/ThemePage')),
  },
  {
    id: 'swiss-modernism',
    name: 'Swiss Modernism 2.0',
    description: '瑞士國際主義設計，極致理性與秩序感',
    preview: '深色 . 極簡 . 網格系統',
    path: '/style/swiss-modernism',
    gradient: 'linear-gradient(135deg, #FF3D00, #FF6B35, #FAFAFA)',
    loader: lazy(() => import('./swiss-modernism/ThemePage')),
  },
  {
    id: 'aurora',
    name: 'Aurora UI',
    description: '極光般的漸層色彩，夢幻與優雅並存',
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

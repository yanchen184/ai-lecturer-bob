import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

// basename 跟著 vite base：
//   GitHub Pages 部署在 /ai-lecturer-bob/ 子路徑
//   之後遷 Vercel / 綁自訂網域時，把 vite.config.ts 的 base 改成 '/'，這裡不必動
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// 自訂網域 yanchen.app（2026-05-20 從 yanchen184.github.io/ai-lecturer-bob 遷移）。
// CI 仍可透過 PUBLIC_SITE_URL + PUBLIC_BASE 覆寫，本地 build 直接走新網址。
const site = process.env.PUBLIC_SITE_URL || 'https://yanchen.app';
const base = process.env.PUBLIC_BASE ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

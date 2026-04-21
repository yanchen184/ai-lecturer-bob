// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// GitHub Pages project page：
//   - site = https://yanchen184.github.io
//   - base = /ai-lecturer-bob
// 未來綁自訂網域時改 PUBLIC_SITE_URL + PUBLIC_BASE 即可。
const site = process.env.PUBLIC_SITE_URL || 'https://yanchen184.github.io';
const base = process.env.PUBLIC_BASE ?? '/ai-lecturer-bob';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
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

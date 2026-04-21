import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ai-lecturer-bob/',
  build: {
    // 把大型 vendor 拆出來，避免單一 chunk 超過 500KB 警告，
    // 並讓 browser 能快取穩定依賴（react/firebase 等不常變動）。
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'firebase-core': [
            'firebase/app',
            'firebase/firestore',
          ],
          'helmet': ['react-helmet-async'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})

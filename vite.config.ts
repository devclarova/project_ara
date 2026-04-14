import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React 코어 — 변경 빈도 낮아 브라우저 캐시 효율 극대화
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase — SDK 전체를 별도 청크로 분리
          'vendor-supabase': ['@supabase/supabase-js'],
          // 차트/지도 — 용량이 크고 어드민에서만 사용
          'vendor-charts': ['recharts', 'react-simple-maps'],
          // 애니메이션 — 여러 페이지에서 공유
          'vendor-motion': ['framer-motion'],
          // i18n — 번역 초기화 지연 허용
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

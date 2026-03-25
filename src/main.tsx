// i18next 홍보 문구 차단용 전역 인터셉터 (애플리케이션 최상단 진입점 배치)
(function silenceI18n() {
  if (typeof window === 'undefined') return;
  const originalLog = console.log;
  const originalInfo = console.info;
  const filter = (...args: any[]) => {
    const msg = args[0];
    if (typeof msg === 'string' && (msg.includes('i18next is maintained') || msg.includes('Locize'))) return true;
    return false;
  };
  console.log = (...args: any[]) => { if (!filter(...args)) originalLog.apply(console, args); };
  console.info = (...args: any[]) => { if (!filter(...args)) originalInfo.apply(console, args); };
  setTimeout(() => { console.log = originalLog; console.info = originalInfo; }, 5000);
})();

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/scrollbar.css';
import './lib/i18n';
import { HelmetProvider } from 'react-helmet-async';
import './guards/profanity/profanity-guard.ts';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual';
}

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);

/**
 * ARA 시스템 전역 진입점(ARA System Global Entry Point):
 * - 목적(Why): 애플리케이션의 런타임 환경을 초기화하고, 보안 인터셉터 및 국제화 프로토콜(i18next)을 주입하여 서비스 구동 준비를 완료함
 * - 방법(How): DOM 렌더링 전 i18next 로그 필터링을 수행하고, 전역 스타일 시트 및 핵심 컨텍스트를 React 트리 최상단에 마운트함
 */
// 런타임 정숙화: i18next 개발용 홍보 문구가 프로덕션 콘솔의 가독성을 해치지 않도록 초기 진입 단계에서 필터링함
(function silenceI18n() {
  if (typeof window === 'undefined') return;
  const originalLog = console.log;
  const originalInfo = console.info;
  const filter = (...args: unknown[]) => {
    const msg = args[0];
    if (typeof msg === 'string' && (msg.includes('i18next is maintained') || msg.includes('Locize'))) return true;
    return false;
  };
  console.log = (...args: unknown[]) => { if (!filter(...args)) originalLog.apply(console, args as Parameters<typeof console.log>); };
  console.info = (...args: unknown[]) => { if (!filter(...args)) originalInfo.apply(console, args as Parameters<typeof console.info>); };
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

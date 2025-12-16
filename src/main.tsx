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

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);

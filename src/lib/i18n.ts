// i18next 홍보 문구 차단용 전역 인터셉터 (임포트 전 최상단 배치)
(function silenceI18n() {
  const originalLog = console.log;
  const originalInfo = console.info;
  
  const filter = (...args: unknown[]) => {
    const msg = args[0];
    if (typeof msg === 'string' && (msg.includes('i18next is maintained') || msg.includes('Locize'))) {
      return true;
    }
    return false;
  };

  console.log = (...args: unknown[]) => { if (!filter(...args)) originalLog.apply(console, args as Parameters<typeof console.log>); };
  console.info = (...args: unknown[]) => { if (!filter(...args)) originalInfo.apply(console, args as Parameters<typeof console.info>); };

  // 3초 후 복구
  setTimeout(() => {
    console.log = originalLog;
    console.info = originalInfo;
  }, 3000);
})();

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import ko from '../locales/ko.json';
import en from '../locales/en.json';
import ja from '../locales/ja.json';
import zh from '../locales/zh.json';
import ru from '../locales/ru.json';
import vi from '../locales/vi.json';
import bn from '../locales/bn.json';
import ar from '../locales/ar.json';
import hi from '../locales/hi.json';
import th from '../locales/th.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import pt from '../locales/pt.json';
import ptBr from '../locales/pt-br.json';
import de from '../locales/de.json';
import fi from '../locales/fi.json';

const resources = {
  ko: { translation: ko },
  en: { translation: en },
  ja: { translation: ja },
  zh: { translation: zh },
  ru: { translation: ru },
  vi: { translation: vi },
  bn: { translation: bn },
  ar: { translation: ar },
  hi: { translation: hi },
  th: { translation: th },
  es: { translation: es },
  fr: { translation: fr },
  pt: { translation: pt },
  'pt-br': { translation: ptBr },
  de: { translation: de },
  fi: { translation: fi },
};

// Trigger HMR
export const LANGUAGES = [
  { code: 'ko', label: '한국어 (Korean)' },
  { code: 'en', label: 'English (US)' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'ru', label: 'Русский (Russian)' },
  { code: 'vi', label: 'Tiếng Việt (Vietnamese)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ar', label: 'العربية (Arabic)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'th', label: 'ไทย (Thai)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'pt', label: 'Português (Portuguese)' },
  { code: 'pt-br', label: 'Português (Brasil)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'fi', label: 'Suomi (Finnish)' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];


i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    resources,
    supportedLngs: ['ko', 'en', 'ja', 'zh', 'ru', 'vi', 'bn', 'ar', 'hi', 'th', 'es', 'fr', 'pt', 'pt-br', 'de', 'fi'],
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

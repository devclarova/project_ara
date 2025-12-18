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
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'ru', label: 'Русский' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'th', label: 'ไทย' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'pt-br', label: 'Português (Brasil)' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fi', label: 'Suomi' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

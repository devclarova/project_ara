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
    resources,
    // lng: 'ko', // Remove explicit language setting to allow detection
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'], // Use localStorage first, then browser language
      caches: ['localStorage'],
    },
  });

export default i18n;

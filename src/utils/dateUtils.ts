import { format, formatDistanceToNow, isToday, isYesterday, isSameYear } from 'date-fns';
import {
  ko,
  enUS,
  ja,
  zhCN,
  es,
  fr,
  de,
  ru,
  pt,
  ptBR,
  vi,
  th,
  id,
  ar,
  hi,
  bn,
  fi,
} from 'date-fns/locale';
import i18n from '@/lib/i18n';

const localeMap: Record<string, any> = {
  ko: ko,
  en: enUS,
  ja: ja,
  zh: zhCN,
  es: es,
  fr: fr,
  de: de,
  ru: ru,
  pt: pt,
  'pt-BR': ptBR,
  vi: vi,
  th: th,
  id: id,
  ar: ar,
  hi: hi,
  bn: bn,
  fi: fi,
};

// Helper to get current locale based on i18next language
const getLocale = () => {
  const lang = i18n.language || 'en';
  // Check for exact match first (e.g. 'pt-BR')
  if (localeMap[lang]) return localeMap[lang];

  // Check for language code match (e.g. 'ko-KR' -> 'ko')
  const baseLang = lang.split('-')[0];
  if (localeMap[baseLang]) return localeMap[baseLang];

  return enUS;
};

/**
 * Formats a date string into a standard readable format.
 * Example: "2024년 10월 5일 오후 3:00" (ko) / "October 5th, 2024 at 3:00 PM" (en)
 */
export const formatDate = (dateString: string, formatStr: string = 'PPP p'): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, formatStr, { locale: getLocale() });
  } catch (err) {
    console.error('Date formatting error:', err);
    return '';
  }
};

/**
 * Returns relative time string (e.g., "5분 전", "방금 전").
 * Example: "5 mins ago" (en) / "5분 전" (ko)
 */
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than 1 minute
    if (diff < 60000 && diff >= 0) {
      const lang = i18n.language || 'en';
      const baseLang = lang.split('-')[0];

      const justNowMap: Record<string, string> = {
        ko: '방금 전',
        en: 'Just now',
        ja: 'たった今',
        zh: '刚刚',
        es: 'Justo ahora',
        fr: "À l'instant",
        de: 'Gerade eben',
        ru: 'Только что',
        pt: 'Agora mesmo',
        vi: 'Vừa xong',
        th: 'เมื่อกี้',
        id: 'Baru saja',
        ar: 'للتو',
        hi: 'अभी',
        bn: 'এইমাত্র',
        fi: 'Juuri nyt',
      };

      return justNowMap[lang] || justNowMap[baseLang] || justNowMap['en'];
    }

    return formatDistanceToNow(date, { addSuffix: true, locale: getLocale() });
  } catch (err) {
    console.error('Relative time error:', err);
    return '';
  }
};

/**
 * Formats time for chat messages (e.g., "오후 3:00", "3:00 PM").
 */
export const formatMessageTime = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // p: 12:00 PM format
    return format(date, 'p', { locale: getLocale() });
  } catch {
    return '';
  }
};

/**
 * Formats date for chat list items (Latest message time).
 * Logic:
 * - Today: "오후 3:00" (Time)
 * - Yesterday: "어제" (Yesterday)
 * - This Year: "10월 5일" (Month Day)
 * - Other: "2023. 10. 5." (Year Month Day)
 */
export const formatChatListDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const locale = getLocale();

    if (isToday(date)) {
      return format(date, 'p', { locale }); // Time
    }

    if (isYesterday(date)) {
      return locale === ko ? '어제' : 'Yesterday';
    }

    if (isSameYear(date, new Date())) {
      if (locale === ko) {
        return format(date, 'M월 d일', { locale });
      }
      return format(date, 'MMM d', { locale }); // Oct 5
    }

    return format(date, 'yyyy. M. d.', { locale }); // Standard short date
  } catch {
    return '';
  }
};

/**
 * Formats date divider in chat room (e.g., "2024년 10월 5일 월요일").
 */
export const formatDividerDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const locale = getLocale();

    if (isToday(date)) {
      return locale === ko ? '오늘' : 'Today'; // Optional: Just Date is often better
    }

    // PPP: Oct 5th, 2024 / 2024년 10월 5일
    // EEEE: Monday / 월요일
    return format(date, 'PPP EEEE', { locale });
  } catch {
    return '';
  }
};

export function formatTweetCardTime(timestamp: string, lang: string = 'ko') {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;

    const now = new Date();

    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    // 오늘 기록은 시간만 표시
    if (isToday) {
      return new Intl.DateTimeFormat(lang, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date);
    }

    // 이전 날짜는 날짜 + 시간 표시 (TweetCard 그대로)
    return new Intl.DateTimeFormat(lang, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (e) {
    console.error('Date formatting error:', e);
    return timestamp;
  }
}

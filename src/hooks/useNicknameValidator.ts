import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

// ------------------------------------------------------------------
// Types & Constants (extracted from SignUpStep2Form.tsx)
// ------------------------------------------------------------------

export type Lang =
  | 'ko' | 'en' | 'ja' | 'zh' | 'ru' | 'vi' | 'bn' | 'ar'
  | 'hi' | 'th' | 'es' | 'fr' | 'pt' | 'pt-br' | 'de' | 'fi';

const RE = {
  ko: /^[가-힣0-9_]+$/,
  en: /^[A-Za-z0-9_]+$/,
  ja: /^[ぁ-ゟ゠-ヿｦ-ﾟ一-龯0-9_]+$/,
  zh: /^[\u4E00-\u9FFF0-9_]+$/,
  ru: /^[\u0400-\u04FF0-9_]+$/,
  vi: /^[A-Za-zÀ-ỹ0-9_]+$/,
  bn: /^[\u0980-\u09FF0-9_]+$/,
  ar: /^[\u0600-\u06FF0-9_]+$/,
  hi: /^[\u0900-\u097F0-9_]+$/,
  th: /^[\u0E00-\u0E7F0-9_]+$/,
  es: /^[A-Za-záéíóúñüÁÉÍÓÚÑÜ0-9_]+$/,
  fr: /^[A-Za-zàâçéèêëîïôùûüÀÂÇÉÈÊËÎÏÔÙÛÜ0-9_]+$/,
  pt: /^[A-Za-zãõçáéíóúÃÕÇÁÉÍÓÚ0-9_]+$/,
  'pt-br': /^[A-Za-záãâçéêíóôõúÁÃÂÇÉÊÍÓÔÕÚ0-9_]+$/,
  de: /^[A-Za-zÄÖÜäöüß0-9_]+$/,
  fi: /^[A-Za-zÅÄÖåäö0-9_]+$/,
} as const;

const LEN: Record<Lang, [number, number]> = {
  ko: [2, 6],
  en: [3, 12],
  ja: [2, 8],
  zh: [2, 8],
  ru: [3, 12],
  vi: [3, 10],
  bn: [2, 10],
  ar: [2, 10],
  hi: [2, 10],
  th: [2, 10],
  es: [3, 12],
  fr: [3, 12],
  pt: [3, 12],
  'pt-br': [3, 12],
  de: [3, 12],
  fi: [3, 12],
};

const DIACRITIC_HINT: Partial<Record<Lang, RegExp>> = {
  es: /[áéíóúñüÁÉÍÓÚÑÜ]/,
  fr: /[àâçéèêëîïôùûüÀÂÇÉÈÊËÎÏÔÙÛÜ]/,
  pt: /[ãõçáéíóúÃÕÇÁÉÍÓÚ]/,
  'pt-br': /[áãâçéêíóôõúÁÃÂÇÉÊÍÓÔÕÚ]/,
  vi: /[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/,
  de: /[ÄÖÜäöüß]/,
  fi: /[ÅÄÖåäö]/,
};

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------

function hasOnlyOneScript(nick: string): boolean {
  const scripts = new Set<string>();

  const isLatinChar = (ch: string) =>
    /[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/.test(ch);

  for (const ch of nick) {
    if (/[0-9_]/.test(ch)) continue;

    if (/[가-힣]/.test(ch)) scripts.add('hangul');
    else if (/[ぁ-ゟ゠-ヿｦ-ﾟ]/.test(ch)) scripts.add('kana');
    else if (/[\u4E00-\u9FFF]/.test(ch)) scripts.add('han');
    else if (/[\u0400-\u04FF]/.test(ch)) scripts.add('cyrillic');
    else if (/[\u0600-\u06FF]/.test(ch)) scripts.add('arabic');
    else if (/[\u0900-\u097F]/.test(ch)) scripts.add('devanagari');
    else if (/[\u0E00-\u0E7F]/.test(ch)) scripts.add('thai');
    else if (/[\u0980-\u09FF]/.test(ch)) scripts.add('bengali');
    else if (isLatinChar(ch)) scripts.add('latin');
    else scripts.add('other');

    if (scripts.size > 1) return false;
  }
  return true;
}

export function detectLang(nick: string): Lang | null {
  if (!nick) return null;
  const s = nick;

  if (/[가-힣]/.test(s)) return 'ko';
  if (/[ぁ-ゟ゠-ヿｦ-ﾟ]/.test(s)) return 'ja';
  if (/[\u4E00-\u9FFF]/.test(s)) return 'zh';
  if (/[\u0400-\u04FF]/.test(s)) return 'ru';
  if (/[\u0600-\u06FF]/.test(s)) return 'ar';
  if (/[\u0900-\u097F]/.test(s)) return 'hi';
  if (/[\u0E00-\u0E7F]/.test(s)) return 'th';
  if (/[\u0980-\u09FF]/.test(s)) return 'bn';

  const hasLatin = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/.test(s);
  if (!hasLatin) return null;

  const hasAnyDiacritic = Object.values(DIACRITIC_HINT).some(re => re.test(s));
  if (!hasAnyDiacritic) return 'en';

  const latinCandidates: Lang[] = ['es', 'pt-br', 'pt', 'fr', 'de', 'fi', 'vi'];
  let bestLang: Lang | null = null;
  let bestScore = -1;

  for (const lang of latinCandidates) {
    let score = 0;
    if (RE[lang]?.test(s)) score += 1;

    const hintRe = DIACRITIC_HINT[lang];
    if (hintRe) {
      const m = s.match(hintRe);
      if (m) score += m.length * 3;
    }

    if (lang === 'vi') {
      if (/[ĂăÂâÊêÔôƠơƯưĐđ]/.test(s)) score += 4;
      if (/(nh|ng)/i.test(s) && s.length <= 4) score += 2;
    }
    if (lang === 'es' && /nh/i.test(s)) score -= 1;
    if ((lang === 'pt' || lang === 'pt-br') && !/[ãÃõÕçÇ]/.test(s) && !/nh/i.test(s)) score -= 1;

    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  return bestLang ?? 'en';
}

// ------------------------------------------------------------------
// Hook Implementation
// ------------------------------------------------------------------

export function useNicknameValidator() {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'available' | 'taken' | ''>('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [lastCheckedNick, setLastCheckedNick] = useState('');
  const [detectedLang, setDetectedLang] = useState<Lang | null>(null);

  const validateFormat = (nick: string): { error?: string; lang: Lang | null } => {
    const u = (nick ?? '').trim();
    if (!u) return { error: t('validation.nickname_required'), lang: null };
    if (/\s/.test(u)) return { error: t('validation.nickname_no_spaces'), lang: null };
    if (/^\d+$/.test(u)) return { error: t('validation.nickname_no_numbers_only'), lang: null };
    if (/(.)\1\1/.test(u)) return { error: t('validation.nickname_no_consecutive'), lang: null };
    
    const underscoreCount = u.length - u.replace(/_/g, '').length;
    if (underscoreCount > 2) return { error: t('validation.nickname_underscore_limit'), lang: null };
    
    if (!hasOnlyOneScript(u)) return { error: t('validation.nickname_single_script'), lang: null };

    const lang = detectLang(u);
    if (!lang) return { error: t('validation.nickname_lang_unknown'), lang: null };

    const [min, max] = LEN[lang];
    if (!RE[lang].test(u)) return { error: t('validation.nickname_invalid_chars'), lang };
    if (u.length < min || u.length > max) {
      return { 
        error: t('validation.nickname_length').replace('{min}', String(min)).replace('{max}', String(max)), 
        lang 
      };
    }

    return { error: undefined, lang };
  };

  // Synchronous validation and state update (for onChange)
  const validateInput = (nick: string) => {
    const { error: fmtError, lang } = validateFormat(nick);
    setDetectedLang(lang);
    setCheckResult(''); // Reset check status on change
    // Optionally we could set error here for immediate feedback, 
    // but usually we want to clear previous specific errors until next check/blur.
    // However, format errors (like invalid char) are good to show immediately?
    // Let's stick to clearing error on change (original behavior) or setting it if it's a format error?
    // Original SignUpStep2Form cleared error on change: setErrors(prev => ({ ...prev, nickname: undefined }));
    // So we clear error here.
    setError(undefined); 
    setLastCheckedNick('');
    return { error: fmtError, lang };
  };

  const checkAvailability = useCallback(async (nick: string) => {
    const trimmed = nick.trim();
    if (!trimmed) {
      setError(t('validation.nickname_required'));
      return false;
    }

    // 1. Format Check
    const { error: formatError, lang } = validateFormat(trimmed);
    setDetectedLang(lang);
    
    if (formatError) {
      setError(formatError);
      setCheckResult('');
      return false;
    }

    // 2. Server Policy Check & DB Dup Check
    setChecking(true);
    try {
      // 2a. Server Policy (reserved words, profanity, etc.)
      const { data: policyErr, error: rpcErr } = await supabase.rpc('validate_nickname_policy', {
        in_nick: trimmed,
        in_lang: lang,
      });

      if (rpcErr) {
        console.error('validate_nickname_policy error:', rpcErr);
        setError(t('validation.nickname_check_retry')); // Generic error
        setCheckResult('');
        return false;
      }

      if (policyErr) {
        setError(policyErr); // Server returned specific policy error message
        setCheckResult('');
        return false;
      }

      // 2b. Duplication Check
      const { data: exists, error: dupErr } = await supabase.rpc('nickname_exists', {
        _nickname: trimmed,
        _lang: lang,
      });

      if (dupErr) {
        console.error('nickname_exists error:', dupErr);
        setError(t('validation.nickname_check_retry'));
        setCheckResult('');
        return false;
      }

      if (exists) {
        setCheckResult('taken');
        setError(t('signup.error_nickname_taken'));
        return false;
      } else {
        setCheckResult('available');
        setError(undefined);
        setLastCheckedNick(trimmed);
        return true;
      }
    } catch (e) {
      console.error('Nickname check exception:', e);
      setError(t('validation.nickname_check_retry'));
      return false;
    } finally {
      setChecking(false);
    }
  }, [t]);

  const reset = () => {
    setChecking(false);
    setCheckResult('');
    setError(undefined);
    setLastCheckedNick('');
    setDetectedLang(null);
  };

  // Helper to get raw format error without triggering async check (for onChange validation)
  const getFormatError = (nick: string) => {
    const { error, lang } = validateFormat(nick);
    return { error, lang };
  };

  return {
    checking,
    checkResult,
    error,
    lastCheckedNick,
    detectedLang,
    setError,
    checkAvailability,
    validateFormat,
    validateInput,
    getFormatError,
    reset,
    minLen: (lang: Lang) => LEN[lang][0],
    maxLen: (lang: Lang) => LEN[lang][1]
  };
}

import Button from '@/components/common/Buttons';
import type { Lang } from '@/types/settings';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LanguageSelectProps {
  value: Lang; // ✅ 현재 선택값 (부모에서 내려줌)
  onChange: (lang: Lang) => void; // ✅ 옵션 클릭 시 부모 상태 업데이트
  onClose?: () => void; // 모달 닫기
  onSave?: () => void; // 저장(부모에서 최종 적용)
  onCancel?: () => void; // 취소(부모에서 원복)
}

// Language code to ISO code mapping (LanguageSwitcher와 동일)
const LANG_TO_ISO: Record<string, string> = {
  ko: 'KR', en: 'US', ja: 'JP', zh: 'CN',
  ru: 'RU', vi: 'VN', bn: 'BD', ar: 'SA',
  hi: 'IN', th: 'TH', es: 'ES', fr: 'FR',
  pt: 'PT', 'pt-br': 'BR', de: 'DE', fi: 'FI',
};

// Fallback emoji flags
const EMOJI_FLAGS: Record<string, string> = {
  ko: '🇰🇷', en: '🇺🇸', ja: '🇯🇵', zh: '🇨🇳',
  ru: '🇷🇺', vi: '🇻🇳', bn: '🇧🇩', ar: '🇸🇦',
  hi: '🇮🇳', th: '🇹🇭', es: '🇪🇸', fr: '🇫🇷',
  pt: '🇵🇹', 'pt-br': '🇧🇷', de: '🇩🇪', fi: '🇫🇮',
};

interface CountryWithFlag {
  iso_code: string | null;
  flag_url: string | null;
}

function LanguageSelect({ value, onChange, onClose, onSave, onCancel }: LanguageSelectProps) {
  const { t } = useTranslation();
  const [flagMap, setFlagMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // DB에서 국기 이미지 로드
  useEffect(() => {
    async function loadFlags() {
      const { data, error } = await supabase
        .from('countries')
        .select('iso_code, flag_url')
        .not('iso_code', 'is', null)
        .not('flag_url', 'is', null);

      if (error) {
        console.error('[LanguageSelect] Failed to load country flags:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((country: CountryWithFlag) => {
          if (country.iso_code && country.flag_url) {
            const isoUpper = country.iso_code.toUpperCase();
            map[isoUpper] = country.flag_url;
          }
        });
        setFlagMap(map);
      }
      setLoading(false);
    }

    loadFlags();
  }, []);

  const options: { code: Lang; label: string; flag: string }[] = [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'th', label: 'ไทย', flag: '🇹🇭' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'pt-br', label: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'fi', label: 'Suomi', flag: '🇫🇮' },
  ];

  return (
    <div className="px-6 py-4">
      {/* 상단 영역 */}
      <div className="mb-6 px-1">
        <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{t('settings.languageSelect')}</p>
      </div>

      {/* 스크롤 영역 */}
      <div
        className="custom-scrollbar"
        style={{
          height: '400px',
          overflowY: 'auto',
          paddingRight: '8px',
        }}
      >
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="언어 선택">
          {options.map(({ code, label, flag }) => {
            const selected = value === code;
            const isoCode = LANG_TO_ISO[code];
            const flagUrl = isoCode ? flagMap[isoCode] : null;
            const emojiFallback = EMOJI_FLAGS[code] || flag;

            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(code)}
                className={[
                  'flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium w-full',
                  selected
                    ? 'bg-gradient-to-r from-primary/90 to-primary text-white shadow-lg'
                    : 'bg-primary/5 dark:bg-primary/10 text-gray-900 dark:text-gray-100 border border-primary/5 dark:border-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 hover:border-primary/30',
                ].join(' ')}
              >
                <span className="font-medium">{label}</span>
                {flagUrl ? (
                  <img
                    src={flagUrl}
                    alt={`${label} flag`}
                    className="w-8 h-6 rounded shadow-sm object-cover"
                    onError={(e) => {
                      // 이미지 로드 실패 시 이모지로 대체
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const emoji = document.createElement('span');
                        emoji.className = 'text-2xl';
                        emoji.textContent = emojiFallback;
                        parent.appendChild(emoji);
                      }
                    }}
                  />
                ) : loading ? (
                  <span className="text-xs text-gray-400">...</span>
                ) : (
                  <span className="text-2xl">{emojiFallback}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <Button type="button" variant="ghost" size="md" onClick={onCancel ?? onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="button" variant="primary" size="md" onClick={onSave}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}

export default LanguageSelect;

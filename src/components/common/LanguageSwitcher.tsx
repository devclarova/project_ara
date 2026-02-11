import { LANGUAGES } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Language code to ISO code mapping
const LANG_TO_ISO: Record<string, string> = {
  ko: 'KR', en: 'US', ja: 'JP', zh: 'CN',
  ru: 'RU', vi: 'VN', bn: 'BD', ar: 'SA',
  hi: 'IN', th: 'TH', es: 'ES', fr: 'FR',
  pt: 'PT', 'pt-br': 'BR', de: 'DE', fi: 'FI',
};

// Fallback emoji flags (only used if DB flags fail to load)
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

interface LanguageSwitcherProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function LanguageSwitcher({ open, onOpenChange }: LanguageSwitcherProps = {}) {
  const { i18n, t } = useTranslation();
  const [flagMap, setFlagMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !node.dataset.scrolled) {
      node.dataset.scrolled = 'true';
      setTimeout(() => {
        node.scrollIntoView({ block: 'center' });
      }, 50);
    }
  }, []);

  useEffect(() => {
    async function loadFlags() {
      const { data, error } = await supabase
        .from('countries')
        .select('iso_code, flag_url')
        .not('iso_code', 'is', null)
        .not('flag_url', 'is', null);

      if (error) {
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

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none border-none group"
        >
          {/* Globe 아이콘 대신 현재 언어 국기 표시 (Glossy Effect) */}
          {(() => {
            // 언어 코드 정규화: 'ko-KR' -> 'ko', 'en-US' -> 'en'
            const normalizedLang = i18n.language.split('-')[0];
            const currentIso = LANG_TO_ISO[normalizedLang];
            const currentEmoji = EMOJI_FLAGS[normalizedLang];
            const currentFlagUrl = currentIso ? flagMap[currentIso] : null;

            // 1순위: DB 국기 이미지 (로드되면)
            if (currentFlagUrl) {
              const isChina = currentIso === 'CN';
              
              return (
                <div className="relative w-6 h-6 rounded-full shadow-md overflow-hidden group-hover:scale-110 transition-transform duration-300">
                  <img 
                    src={currentFlagUrl} 
                    alt="Current Language" 
                    className={`w-full h-full object-cover ${isChina ? 'object-left' : 'object-center'}`}
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/10 via-transparent to-white/50 pointer-events-none ring-1 ring-inset ring-black/5 dark:ring-white/10" />
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] pointer-events-none" />
                </div>
              );
            }
            
            // 2순위: 이모지 국기 (즉시 표시, 로딩 중에도 보임)
            if (currentEmoji) {
               return <span className="text-2xl filter drop-shadow-sm hover:scale-110 transition-transform cursor-default">{currentEmoji}</span>;
            }

            // 3순위: Globe 아이콘 (fallback)
            return <Globe className="h-6 w-6 text-gray-700 dark:text-gray-300" style={{ width: '24px', height: '24px' }} />;
          })()}
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="center" 
          className="w-64 p-2 overflow-hidden
                     bg-white dark:bg-secondary 
                     border border-gray-100 dark:border-gray-700/70
                     shadow-xl rounded-xl outline-none ring-0 focus:ring-0 focus-visible:outline-none focus:outline-none z-[200]"
        sideOffset={8}
        onInteractOutside={(e) => {
          // Allow closing when clicking outside
        }}
      >
        <div className="px-2 py-2 border-b border-gray-100 dark:border-gray-700 mb-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('settings.languageSelect')}
          </p>
        </div>
        
        {/* 스크롤 영역 - 끝에 도달하면 외부 스크롤 허용 */}
        <div 
          className="max-h-[350px] overflow-y-auto custom-scrollbar pr-1"
          onWheel={(e) => {
            const element = e.currentTarget;
            const isScrolledToBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
            const isScrolledToTop = element.scrollTop === 0;
            
            // 스크롤이 끝에 도달하면 이벤트 전파 허용
            if ((isScrolledToBottom && e.deltaY > 0) || (isScrolledToTop && e.deltaY < 0)) {
              return; // 이벤트 전파
            }
            
            // 그 외에는 전파 차단
            e.stopPropagation();
          }}
        >
          {LANGUAGES.map(lang => {
            const isoCode = LANG_TO_ISO[lang.code];
            const flagUrl = isoCode ? flagMap[isoCode] : null;
            const emojiFallback = EMOJI_FLAGS[lang.code];
            const isActive = i18n.language === lang.code;
            
            return (
              <DropdownMenuItem
                key={lang.code}
                ref={isActive ? scrollRef : null}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                }}
                className={`
                  rounded-lg py-2.5 px-3 mb-1 cursor-pointer transition-colors focus:ring-0 focus:outline-none
                  ${isActive 
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-semibold focus:bg-primary/15 dark:focus:bg-primary/25' 
                    : 'hover:bg-primary/5 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:bg-primary/5 dark:focus:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center justify-between w-full gap-3">
                  <span className="text-sm">{lang.label}</span>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <svg 
                        className="w-4 h-4 text-primary" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    )}
                    {flagUrl ? (
                      <img 
                        src={flagUrl} 
                        alt={`${lang.label} flag`}
                        className="w-6 h-4 object-cover rounded-sm shadow-sm"
                      />
                    ) : loading ? (
                      <span className="text-xs text-gray-400 dark:text-gray-500">...</span>
                    ) : (
                      <span className="text-lg">{emojiFallback}</span>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

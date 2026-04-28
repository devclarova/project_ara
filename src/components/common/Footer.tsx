/**
 * 서비스 하단 정보 아카이브 및 네비게이터(Service Footer Archive & Navigator):
 * - 목적(Why): 기업 정보, 약관, SNS 링크 등 서비스의 부가적인 엔트리 포인트를 구조화하여 접근성을 제공함
 * - 방법(How): 다국어 대응 국기 에셋 매핑 및 테마/언어 전환 오케스트레이션을 통합하여 일관된 하단 환경을 유지함
 */
import { Facebook, Instagram, Youtube, ArrowRight, Globe, ChevronDown, AtSign, Moon, Sun, Laptop } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/theme-provider';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { LANGUAGES } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Modal from '@/components/common/Modal'; // Use generic modal interactions
import TermsView from '@/components/settings/TermsView';
import PrivacyPolicyView from '@/components/settings/PrivacyPolicyView';
import CustomerCenterView from '@/components/settings/CustomerCenterView';
import { type ConsentKey } from '@/components/auth/consent/consentContent';

// Localization-Country Mapping: Translates i18next language segments into ISO 3166-1 identifiers for flag asset resolution.
const LANG_TO_ISO: Record<string, string> = {
  ko: 'KR', en: 'US', ja: 'JP', zh: 'CN',
  ru: 'RU', vi: 'VN', bn: 'BD', ar: 'SA',
  hi: 'IN', th: 'TH', es: 'ES', fr: 'FR',
  pt: 'PT', 'pt-br': 'BR', de: 'DE', fi: 'FI',
};

// Fallback Iconography: Provides unicode emoji flags as a resilient secondary layer for failed image resources.
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

/**
 * Polished Aesthetic Footer
 * - SNS 순서 변경: YouTube -> Instagram -> Threads -> X -> Facebook
 * - 폰트 크기 상향: text-sm
 * - 테마 선택 기능 추가 (System/Light/Dark)
 * - 로고 디자인: Primary Color 강조
 * - 미구현 기능 클릭 시 "Coming Soon" 모달 표시
 * - 이용약관/개인정보처리방침 연동
 */
export default function Footer() {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  // States for modals
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState<ConsentKey | 'support' | null>(null);
  const currentLang = LANGUAGES.find(l => l.code === i18n.language.split('-')[0])?.label || 'English (US)';
  
  // Flag state management
  const [flagMap, setFlagMap] = useState<Record<string, string>>({});
  const [loadingFlags, setLoadingFlags] = useState(true);
  
  // Hydration Guard: Tracks component mount state to prevent SSR-Client mismatches during theme initialization.
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Load flag images from database
  useEffect(() => {
    async function loadFlags() {
      const { data, error } = await (supabase.from('countries') as any)
        .select('iso_code, flag_url')
        .not('iso_code', 'is', null)
        .not('flag_url', 'is', null);

      if (error) {
        setLoadingFlags(false);
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
      setLoadingFlags(false);
    }

    loadFlags();
  }, []);
  const handleLinkClick = (e: React.MouseEvent, type: 'impl' | 'unimpl' | 'policy', value?: string) => {
    e.preventDefault();
    if (type === 'unimpl') {
      setComingSoonOpen(true);
    } else if (type === 'policy' && value) {
      setPolicyModalOpen(value as ConsentKey);
    } else if (type === 'impl' && value) {
    // State & Routing Optimization: Orchestrates session cleanup and scroll resets to ensure a fresh UI state upon navigation.
      if (value === '/sns') {
        sessionStorage.removeItem('sns-last-tweet-id');
        // SNS 탭은 같은 페이지여도 스크롤 초기화를 위해 이동 허용
        navigate(value); 
      } else if (location.pathname !== value) {
        // 그 외 페이지는 페이지가 다를 때만 이동(중복 이동 방지)
        navigate(value);
      }
    }
  };
  return (
    <>
      <footer className="w-full bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 mt-auto">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6 lg:py-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-6 mb-6">
            
            {/* 1. Brand (2칸 차지) */}
            <div className="col-span-2 flex flex-col items-start gap-3 pr-6">
              <Link to="/" className="inline-flex items-center gap-2 group">
                 {/* Visual Identity: High-contrast solid logo with scaling transitions for brand visibility. */}
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-base shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                  A
                </div>
                <span className="text-lg font-black tracking-tight text-primary group-hover:opacity-80 transition-opacity">
                  ARA
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium max-w-sm">
                {t('footer.brand.slogan_main')}<br/>
                {t('footer.brand.slogan_sub')}
              </p>
              
              <div className="flex gap-2 mt-1">
                 <SocialIcon href="https://www.youtube.com/@korean_ara-f5r" icon={<Youtube className="w-4 h-4" />} label={t('footer.social.youtube')} />
                 <SocialIcon href="https://instagram.com" icon={<Instagram className="w-4 h-4" />} label={t('footer.social.instagram')} />
                 <SocialIcon href="https://www.threads.net" icon={<AtSign className="w-4 h-4" />} label={t('footer.social.threads')} />
                 <SocialIcon href="https://twitter.com" icon={<XIcon />} label={t('footer.social.x')} />
                 <SocialIcon href="https://facebook.com" icon={<Facebook className="w-4 h-4" />} label={t('footer.social.facebook')} />
              </div>
            </div>
            {/* Links Columns */}
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-sm text-foreground">{t('footer.columns.product.title')}</h3>
              <div className="flex flex-col gap-2">
                <FooterLink onClick={(e) => handleLinkClick(e, 'unimpl')}>{t('footer.columns.product.features')}</FooterLink>
                <FooterLink onClick={(e) => handleLinkClick(e, 'unimpl')}>{t('footer.columns.product.enterprise')}</FooterLink>
                <FooterLink onClick={(e) => handleLinkClick(e, 'unimpl')}>{t('footer.columns.product.security')}</FooterLink>
                <FooterLink onClick={(e) => handleLinkClick(e, 'unimpl')}>{t('footer.columns.product.pricing')}</FooterLink>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-sm text-foreground">{t('footer.columns.resources.title')}</h3>
              <div className="flex flex-col gap-2">
                <FooterLink onClick={(e) => handleLinkClick(e, 'unimpl')}>{t('footer.columns.resources.documentation')}</FooterLink>
                <FooterLink onClick={(e) => handleLinkClick(e, 'unimpl')}>{t('footer.columns.resources.api')}</FooterLink>
                <FooterLink onClick={(e) => handleLinkClick(e, 'impl', '/sns')}>{t('footer.columns.resources.community')}</FooterLink>
                <FooterLink onClick={(e) => handleLinkClick(e, 'policy', 'support')}>{t('footer.columns.resources.help_center')}</FooterLink>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-sm text-foreground">{t('footer.columns.company.title')}</h3>
              <div className="flex flex-col gap-2">
                <FooterLink onClick={(e) => handleLinkClick(e, 'unimpl')}>{t('footer.columns.company.about')}</FooterLink>
                <FooterLink onClick={(e) => handleLinkClick(e, 'unimpl')}>{t('footer.columns.company.careers')}</FooterLink>
                <FooterLink onClick={(e) => handleLinkClick(e, 'unimpl')}>{t('footer.columns.company.blog')}</FooterLink>
                <FooterLink onClick={(e) => handleLinkClick(e, 'unimpl')}>{t('footer.columns.company.contact')}</FooterLink>
              </div>
            </div>
            <div className="col-span-2 md:col-span-4 lg:col-span-1 flex flex-col gap-3 min-w-[220px]">
               <h3 className="font-bold text-sm text-foreground">{t('footer.newsletter.title')}</h3>
               <p className="text-xs text-muted-foreground leading-snug">
                 {t('footer.newsletter.desc')}
               </p>
               <div className="flex flex-col gap-2">
                 <div className="relative group">
                   <input 
                     type="email" 
                     placeholder={t('footer.newsletter.placeholder')} 
                     className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                   />
                   <button 
                    onClick={() => setComingSoonOpen(true)}
                    className="absolute right-1 top-1 p-1 text-primary hover:bg-primary/10 rounded-md transition-colors opacity-70 group-hover:opacity-100"
                   >
                     <ArrowRight className="w-3.5 h-3.5" />
                   </button>
                 </div>
               </div>
            </div>
          </div>
          {/* Bottom Bar */}
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <p className="text-sm text-muted-foreground font-medium" translate="no">
                © 2026 Ara — Dive into Korean. Made with 🌊
              </p>
              <div className="flex gap-6 text-sm text-muted-foreground">
                 <FooterLink onClick={(e) => handleLinkClick(e, 'policy', 'terms')}>{t('footer.bottom.terms')}</FooterLink>
                 <FooterLink onClick={(e) => handleLinkClick(e, 'policy', 'privacy')}>{t('footer.bottom.privacy')}</FooterLink>
                 <FooterLink onClick={(e) => handleLinkClick(e, 'unimpl')}>{t('footer.bottom.cookies')}</FooterLink>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Theme Selector */}
              {mounted && (
                <div className="flex items-center p-1 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm animate-in fade-in zoom-in duration-300 delay-75">
                  <button 
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label={t('settings.theme_options.light')}
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label={t('settings.theme_options.dark')}
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`p-1.5 rounded-full transition-all ${theme === 'system' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label={t('settings.theme_options.system')}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {/* Language Selector */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800 hover:border-primary/30 bg-white dark:bg-zinc-900 transition-all text-xs font-medium text-muted-foreground hover:text-foreground shadow-sm animate-in fade-in zoom-in duration-300 outline-none">
                    {/* Current language flag */}
                    {(() => {
                      // 언어 코드 정규화: 'ko-KR' -> 'ko'
                      const normalizedLang = i18n.language.split('-')[0];
                      const currentIso = LANG_TO_ISO[normalizedLang];
                      const currentEmoji = EMOJI_FLAGS[normalizedLang];
                      const currentFlagUrl = currentIso ? flagMap[currentIso] : null;

                      // 1순위: DB 국기 이미지
                      if (currentFlagUrl) {
                        const isChina = currentIso === 'CN';
                        
                        return (
                          <div className="relative w-4 h-4 rounded-full shadow-md overflow-hidden group-hover:scale-110 transition-transform duration-300">
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
                      
                      // 2순위: 이모지 국기 (즉시 표시)
                      if (currentEmoji) {
                        return <span className="text-base">{currentEmoji}</span>;
                      }

                      // 3순위: Globe fallback
                      return <Globe className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />;
                    })()}
                    <span>{currentLang}</span>
                    <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="max-h-[300px] overflow-y-auto custom-scrollbar w-40 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                  {LANGUAGES.map(lang => (
                    <DropdownMenuItem 
                      key={lang.code}
                      onClick={() => i18n.changeLanguage(lang.code)}
                      className={`cursor-pointer text-xs py-2 ${i18n.language === lang.code ? 'font-bold text-primary bg-primary/5' : ''}`}
                    >
                      {lang.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </footer>
      {/* Coming Soon Modal (Using Common Modal) */}
      <Modal
        isOpen={comingSoonOpen}
        onClose={() => setComingSoonOpen(false)}
        title={t('common.coming_soon', '구현 예정')}
        className="max-w-sm w-full mx-4" // 작은 모달, 좌우 여백 확보
        contentClassName="px-6 py-8"
      >
        <div className="text-center flex flex-col items-center justify-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce">
            <Laptop className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
               {t('common.coming_soon', '곧 만나요!')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[280px] mx-auto">
              {t('common.coming_soon_desc', '지금 열심히 준비하고 있습니다. 더 멋진 기능으로 찾아뵐게요! 🚀')}
            </p>
          </div>
          <button
              type="button"
              onClick={() => setComingSoonOpen(false)}
              className="mt-2 w-full max-w-[200px] px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            Okay!
          </button>
        </div>
      </Modal>
      {/* Policy Modal (Settings Version using Common Modal) */}
      <Modal
        isOpen={!!policyModalOpen}
        onClose={() => setPolicyModalOpen(null)}
        title={policyModalOpen === 'terms' ? t('footer.bottom.terms') : t('footer.bottom.privacy')}
        className={
          policyModalOpen === 'support' 
            ? "max-w-3xl h-[600px] w-full mx-4 flex flex-col" // Help Center: 적당한 크기
            : "max-w-5xl h-[85vh] w-full mx-4 flex flex-col"  // Terms/Privacy: 큰 크기
        }
        contentClassName="flex-1 p-0 relative overflow-hidden flex flex-col" // 내부 꽉 채우기
      >
        <div className="absolute inset-0 w-full h-full bg-white dark:bg-secondary">
          {policyModalOpen === 'terms' && (
            <TermsView onClose={() => setPolicyModalOpen(null)} />
          )}
          {policyModalOpen === 'privacy' && (
            <PrivacyPolicyView onClose={() => setPolicyModalOpen(null)} />
          )}
          {policyModalOpen === 'support' && (
            <CustomerCenterView onClose={() => setPolicyModalOpen(null)} />
          )}
        </div>
      </Modal>
    </>
  );
}
function FooterLink({ onClick, children }: { onClick?: (e: React.MouseEvent) => void; children: React.ReactNode }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit hover:translate-x-0.5 transform duration-200 cursor-pointer bg-transparent border-none p-0 text-left"
    >
      {children}
    </button>
  );
}
function SocialIcon({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-zinc-800 text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-md"
      aria-label={label}
    >
      {icon}
    </a>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
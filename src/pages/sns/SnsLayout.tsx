/**
 * SNS 통합 레이아웃(SNS Integrated Layout):
 * - 목적(Why): 메인 피드, 트렌드 패널, 마케팅 배너를 효율적으로 배치하여 사용자 경험을 보호하고 광고 수익을 창출함
 * - 방법(How): 다중 컬럼 스태틱 그리드 시스템과 반응형 뷰포트 분기점(Breakpoint)을 설정하여 모바일 및 데스크톱 환경에 최적화함
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import TrendsPanel from '../community/feature/TrendsPanel';
import ScrollToTopButton from '@/components/common/ScrollToTopButton';
import { useMarketingBanners } from '@/hooks/useMarketingBanners';
import { ExternalLink, Megaphone } from 'lucide-react';
import { useBatchAutoTranslation } from '@/hooks/useBatchAutoTranslation';
import { useAuth } from '@/contexts/AuthContext';

interface SnsLayoutProps {
  children: ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  hideSearchBar?: boolean; // 상세 페이지에서는 true
}

export default function SnsLayout({
  children,
  searchQuery,
  onSearchChange,
  hideSearchBar,
}: SnsLayoutProps) {
  const { t, i18n } = useTranslation();
  const { user, userPlan, loading: authLoading } = useAuth();
  const { banners: sidebarBanners, loading: bannersLoading, trackClick, trackView } = useMarketingBanners('inline_card', 'sns');

  const isPaidUser = userPlan === 'premium' || userPlan === 'basic';
  
  // 🌐 Batch Auto-Translation for marketing content (Ads labels are manually localized)
  const { translatedTexts: translatedBannerTitles } = useBatchAutoTranslation(
    (sidebarBanners || []).map(b => b.title),
    (sidebarBanners || []).map(b => `banner_title_${b.id}`),
    i18n.language || 'en'
  );
  
  const { translatedTexts: translatedBannerContents } = useBatchAutoTranslation(
    (sidebarBanners || []).map(b => b.content || ''),
    (sidebarBanners || []).map(b => `banner_content_${b.id}`),
    i18n.language || 'en'
  );

  return (
    <div className="bg-white dark:bg-background">
      {/* [Restore] Original layout border positioning for ScrollToTopButton (Precision target 813px inside, restore desktop) */}
      <ScrollToTopButton className="bottom-10 right-12 lg:right-10 xl:right-[calc(50vw-345px)] z-[400]" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-6">
        <div className="grid w-full gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
          
          <div className="flex justify-center">
            <div className="w-full md:max-w-3xl xl:max-w-4xl">
                {children}
                
                {/* 모바일/태블릿 배너: 유료 사용자는 렌더링 스킵 */}
                <div className="xl:hidden mt-8 mb-12">
                    {!authLoading && !isPaidUser && !bannersLoading && (sidebarBanners || []).slice(0, 1).map((mBanner, mIdx) => (
                        <div 
                            key={mBanner.id}
                            onClick={() => { trackClick(mBanner.id); if (mBanner.link_url) window.open(mBanner.link_url, '_blank'); }}
                            className="py-7 px-5 rounded-[2rem] bg-secondary border border-gray-100 dark:border-white/5 cursor-pointer transition-all overflow-hidden relative"
                        >
                            <div className="flex items-center gap-4">
                                {mBanner.image_url ? (
                                    <img src={mBanner.image_url} className="w-16 h-16 rounded-[1.2rem] object-cover shadow-sm" alt="ad" />
                                ) : (
                                    <div className="w-16 h-16 rounded-[1.2rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                        <Megaphone size={24} />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-full mb-1 inline-block">
                                        {t('common.sponsored', 'Ads')}
                                    </span>
                                    <h4 className="font-bold text-base leading-tight">
                                        {translatedBannerTitles[mIdx] || mBanner.title}
                                    </h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                                        {translatedBannerContents[mIdx] || mBanner.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* [Ultimate Pinning] Absolute sync: Initial Y (152.66px) == Sticky Top (152.7px) for ZERO movement */}
          <aside className="hidden xl:block w-[320px] z-[10]">
            <div 
              className="sticky top-[152.7px] space-y-3 px-4 transform-gpu"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <TrendsPanel
                searchQuery={searchQuery ?? ''}
                onSearchChange={onSearchChange ?? (() => {})}
                hideSearchBar={hideSearchBar}
              />

              {/* 
                [Ultimate Ad-Block for Premium] 
                단순히 로딩 가드뿐만 아니라, 유료 사용자임이 확인되면 배너 렌더링 로직 자체를 실행하지 않음
              */}
              {!authLoading && userPlan !== 'premium' && userPlan !== 'basic' && !bannersLoading && (sidebarBanners || []).map((sBanner, sIdx) => (
                  <div 
                    key={sBanner.id} 
                    onMouseEnter={() => trackView(sBanner.id)}
                    onClick={() => { trackClick(sBanner.id); if (sBanner.link_url) window.open(sBanner.link_url, '_blank') }}
                    className="py-6 px-4 rounded-[2rem] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 cursor-pointer hover:shadow-xl transition-all relative group overflow-hidden"
                  >
                        {sBanner.image_url && (
                            <div className="aspect-[2.8/1] rounded-3xl overflow-hidden mb-3 shadow-sm border border-gray-100 dark:border-white/5 relative">
                                <img src={sBanner.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={sBanner.title} />
                            </div>
                        )}
                        <h4 className="font-bold text-zinc-900 dark:text-gray-100 text-sm leading-tight mb-1.5 group-hover:text-primary transition-colors">
                            {translatedBannerTitles[sIdx] || sBanner.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                            {translatedBannerContents[sIdx] || sBanner.content}
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                                {t('common.sponsored', 'Ads')}
                            </span>
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <ExternalLink size={10} />
                            </div>
                        </div>
                  </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

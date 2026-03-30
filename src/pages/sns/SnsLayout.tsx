import type { ReactNode } from 'react';
import TrendsPanel from '../community/feature/TrendsPanel';
import ScrollToTopButton from '@/components/common/ScrollToTopButton';
import { useMarketingBanners } from '@/hooks/useMarketingBanners';
import { ExternalLink, Megaphone } from 'lucide-react';

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
  const { banners: sidebarBanners, trackClick, trackView } = useMarketingBanners('inline_card', 'sns');

  return (
    <div className="bg-white dark:bg-background">
      <ScrollToTopButton 
        className="bottom-10 right-6 lg:right-16 xl:right-[calc((100vw-1280px)/2+265px)]"
      />
      {/* 가운데 + 오른쪽 2컬럼 레이아웃 (오른쪽은 공간만 잡아줌) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-6">
        <div className="grid w-full gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* 가운데 SNS 피드 */}
          <div className="flex justify-center">
            <div className="w-full md:max-w-3xl xl:max-w-4xl">
                {children}
                
                {/* 모바일/태블릿용 하단 배너 (리스트 끝이나 중간에 자연스럽게 노출) */}
                <div className="xl:hidden mt-8 mb-12">
                    {sidebarBanners.slice(0, 1).map(banner => (
                        <div 
                            key={banner.id}
                            onClick={() => { trackClick(banner.id); if (banner.link_url) window.open(banner.link_url, '_blank'); }}
                            className="p-6 rounded-[2rem] bg-secondary border border-gray-100 dark:border-white/5 cursor-pointer hover:scale-[1.01] transition-transform overflow-hidden relative group"
                        >
                            <div className="flex items-center gap-4">
                                {banner.image_url ? (
                                    <img src={banner.image_url} className="w-20 h-20 rounded-2xl object-cover shadow-sm" alt="ad" />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                        <Megaphone size={32} />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full mb-2 inline-block">SPONSORED</span>
                                    <h4 className="font-bold text-lg leading-tight mb-1">{banner.title}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{banner.content}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* 오른쪽 컬럼: Side Panel (Sticky) */}
          <aside className="hidden xl:block w-[320px]">
            <div className="sticky top-24 space-y-6">
              <TrendsPanel
                searchQuery={searchQuery ?? ''}
                onSearchChange={onSearchChange ?? (() => {})}
                hideSearchBar={hideSearchBar}
              />

              {/* 사이드바 마케팅 배너 */}
              {sidebarBanners.map(banner => (
                  <div 
                    key={banner.id} 
                    onMouseEnter={() => trackView(banner.id)}
                    onClick={() => { trackClick(banner.id); if (banner.link_url) window.open(banner.link_url, '_blank'); }}
                    className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 cursor-pointer hover:shadow-xl transition-all relative group overflow-hidden"
                    style={{ borderLeft: `4px solid ${banner.bg_color || 'transparent'}` }}
                  >
                        {banner.image_url && (
                            <div className="aspect-video rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-100 dark:border-white/5">
                                <img src={banner.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={banner.title} />
                            </div>
                        )}
                        <h4 className="font-black text-zinc-900 dark:text-gray-100 leading-tight mb-2 group-hover:text-primary transition-colors">
                            {banner.title}
                        </h4>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 mb-4 leading-relaxed">
                            {banner.content}
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Sponsored</span>
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <ExternalLink size={14} />
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

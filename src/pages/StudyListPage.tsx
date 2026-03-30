import GuideModal, { isGuideModalDismissed } from '@/components/common/GuideModal';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '@/components/common/Pagination';
import CategoryTabs, { type TCategory } from '@/components/study/CategoryTabs';
import ContentCard from '@/components/study/ContentCard';
import FilterDropdown, { type TDifficulty } from '@/components/study/FilterDropdown';
import SearchBar from '@/components/ui/SearchBar';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useBatchAutoTranslation } from '@/hooks/useBatchAutoTranslation';
import { supabase } from '../lib/supabase';
import type { Study } from '../types/study';
import { useAuth } from '@/contexts/AuthContext';
import SignInModal from '@/components/auth/SignInModal';
import { useMarketingBanners } from '@/hooks/useMarketingBanners';
import { ExternalLink } from 'lucide-react';

const ALL_CATEGORIES: TCategory[] = ['전체', '드라마', '영화', '예능', '음악'];
const ALL_LEVELS: TDifficulty[] = ['', '초급', '중급', '고급'];
const LEANING_GUIDE_KEY = 'ara-leaning-guide';

const LEANING_GUIDE_SLIDES = [
  { id: 'leaning-1', image: '/images/leaning_guide_1.gif', alt: 'ARA Study 이용 방법 안내 1' },
  { id: 'leaning-2', image: '/images/leaning_guide_2.gif', alt: 'ARA Study 이용 방법 안내 2' },
  { id: 'leaning-3', image: '/images/leaning_guide_3.gif', alt: 'ARA Study 이용 방법 안내 3' },
  { id: 'leaning-4', image: '/images/leaning_guide_4.gif', alt: 'ARA Study 이용 방법 안내 4' },
  { id: 'leaning-5', image: '/images/leaning_guide_5.gif', alt: 'ARA Study 이용 방법 안내 5' },
];

const StudyListPage = () => {
  const { t, i18n } = useTranslation();
  const targetLang = i18n.language;
  const [clips, setClips] = useState<Study[]>([]);
  const [keyword, setKeyword] = useState('');
  const [total, setTotal] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, userPlan, isAdmin } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Ad-free users (Premium/Basic)
  // Admins only see ads if their current plan is set to 'free' (for testing).
  const isAdFree = userPlan === 'premium' || userPlan === 'basic' || (isAdmin && userPlan !== 'free');
  const [pageSize, setPageSize] = useState(isAdFree ? 12 : 10);
  const limit = pageSize;

  const { banners: inlineBanners, trackClick: trackBannerClick, trackView: trackBannerView } = useMarketingBanners('inline_card');

  useEffect(() => {
    if (!isGuideModalDismissed(LEANING_GUIDE_KEY)) setShowGuide(true);
  }, []);

  const displayCategory: TCategory = useMemo(() => {
    const q = searchParams.get('category') ?? '전체';
    return (ALL_CATEGORIES.includes(q as TCategory) ? q : '전체') as TCategory;
  }, [searchParams.get('category')]);

  const [activeCategory, setActiveCategory] = useState<TCategory>(displayCategory);
  const [levelFilter, setLevelFilter] = useState<TDifficulty>((searchParams.get('level') ?? '') as TDifficulty);
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1', 10));

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  // Translation Hooks
  const { translatedTexts: trTitles } = useBatchAutoTranslation(clips.map(c => c.title), clips.map(c => `study_title_${c.id}`), targetLang);
  const { translatedTexts: trDescs } = useBatchAutoTranslation(clips.map(c => c.short_description || ''), clips.map(c => `study_desc_${c.id}`), targetLang);
  const { translatedTexts: trDurations } = useBatchAutoTranslation(clips.map(c => {
    const v = Array.isArray(c.video) ? c.video[0] : (c.video as any);
    return typeof v?.runtime_bucket === 'string' ? v.runtime_bucket : '';
  }), clips.map(c => `study_duration_${c.id}`), targetLang);
  const { translatedTexts: trEpisodes } = useBatchAutoTranslation(clips.map(c => {
    const v = Array.isArray(c.video) ? c.video[0] : (c.video as any);
    return v?.episode || '';
  }), clips.map(c => `study_episode_${c.id}`), targetLang);

  useEffect(() => {
    let ignore = false;
    const fetchClips = async () => {
      const needsVideoFilter = activeCategory !== '전체' || levelFilter !== '';
      let query = supabase
        .from('study')
        .select(needsVideoFilter ? '*, video!inner(*)' : '*, video(*)', { count: 'exact' });
      
      // Only show non-hidden contents on the public list
      query = query.eq('is_hidden', false);

      if (activeCategory !== '전체') query = query.eq('video.categories', activeCategory);
      if (levelFilter) query = query.eq('video.level', levelFilter);
      if (keyword.trim()) query = query.ilike('title', `%${keyword.trim()}%`);
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (!ignore && data) {
        setClips(data as Study[]);
        setTotal(count || 0);
      }
    };
    fetchClips();
    return () => { ignore = true; };
  }, [activeCategory, levelFilter, keyword, page, limit]);

  const handleCategoryChange = (c: string) => {
    const next = (ALL_CATEGORIES.includes(c as TCategory) ? c : '전체') as TCategory;
    setActiveCategory(next);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (next === '전체') nextParams.delete('category');
    else nextParams.set('category', next);
    setSearchParams(nextParams, { replace: true });
  };

  const applyLevel = (next: TDifficulty) => {
    setLevelFilter(next);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (!next) nextParams.delete('level');
    else nextParams.set('level', next);
    setSearchParams(nextParams, { replace: true });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="study-page relative min-h-screen bg-white dark:bg-background">
      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} slides={LEANING_GUIDE_SLIDES} storageKey={LEANING_GUIDE_KEY} />
      
      <div className="flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl">
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-auto bg-white dark:bg-background">
            <div className="flex flex-row justify-between items-center gap-1 md:gap-3 bg-white dark:bg-background sticky top-0 z-20 pb-2 pl-6 pt-8 pr-2">
              <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar" ref={categoryScrollRef}>
                <CategoryTabs
                  active={activeCategory}
                  onChange={handleCategoryChange}
                  categories={ALL_CATEGORIES.map(c => ({
                    value: c,
                    label: c === '전체' ? t('study.category.all') : t(`study.category.${c.toLowerCase()}`, c)
                  }))}
                />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <FilterDropdown
                  value={levelFilter}
                  onApply={applyLevel}
                  labelMap={{ '': t('study.level.all'), 초급: t('study.level.beginner'), 중급: t('study.level.intermediate'), 고급: t('study.level.advanced') }}
                />
                <div className="hidden lg:flex items-center h-11">
                  <SearchBar placeholder={t('study.search_placeholder')} value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} onSubmit={() => {}} />
                </div>
              </div>
            </div>

            <div className="w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 lg:max-w-[1200px] xl:max-w-[1320px] 2xl:max-w-[1400px]">
              <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {clips.length > 0 ? (
                  clips.reduce<React.ReactNode[]>((acc, study, index) => {
                    const originalIndex = clips.findIndex(c => c.id === study.id);
                    const [v] = study.video ?? [];
                    acc.push(
                      <ContentCard
                        key={study.id}
                        id={study.id}
                        image={study.poster_image_url}
                        title={originalIndex >= 0 ? (trTitles[originalIndex] ?? study.title ?? '') : (study.title || '')}
                        short_description={originalIndex >= 0 ? (trDescs[originalIndex] ?? study.short_description ?? '') : (study.short_description || '')}
                        contents={v?.contents || ''}
                        episode={v?.episode || ''}
                        scene={v?.scene || ''}
                        level={v?.level || ''}
                        duration={typeof v?.runtime_bucket === 'string' ? v.runtime_bucket : null}
                        basePath={user ? '/study' : '/guest-study'}
                        isGuest={!user}
                        isPreview={study.is_featured}
                        required_plan={study.required_plan}
                        created_at={study.created_at}
                        openLoginModal={() => setShowSignIn(true)}
                      />
                    );

                    // 5번째, 10번째 위치에 광고 삽입 (isAdFree가 아닐 때만)
                    if (!isAdFree && (index + 1) % 5 === 0) {
                      const globalIndex = ((page - 1) * limit) + index;
                      const hasBanners = inlineBanners.length > 0;
                      const bannerIndex = hasBanners ? (Math.floor(globalIndex / 5) % inlineBanners.length) : 0;
                      const banner = hasBanners ? inlineBanners[bannerIndex] : null;
                      
                      acc.push(
                        <motion.div
                          key={`marketing-${globalIndex}-${banner?.id || 'default'}`}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          onClick={() => {
                            if (banner) {
                              trackBannerClick(banner.id);
                              if (banner.link_url) window.open(banner.link_url, '_blank', 'noopener');
                            } else {
                              // 기본 배너 클릭 시 구독 페이지로 이동
                              window.location.href = '/subscription';
                            }
                          }}
                          onViewportEnter={() => banner && trackBannerView(banner.id)}
                          className="relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-all duration-500 bg-gray-100 dark:bg-zinc-900 border border-gray-100 dark:border-white/5"
                        >
                          {banner?.image_url ? (
                            <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            // 기본 홍보 배너 (데이터가 없을 때)
                            <div className="w-full h-full bg-gradient-to-br from-[#00E5FF]/20 to-[#00BFA5]/20 flex flex-col items-center justify-center p-8 text-center">
                              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20">
                                <span className="text-xl font-black text-[#00BFA5]">A</span>
                              </div>
                              <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2 leading-tight">광고 없는 아라 프리미엄</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">지금 프리미엄으로 업그레이드하고<br/>모든 혜택을 누려보세요!</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                          <div className="absolute inset-0 p-6 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-black text-white tracking-widest border border-white/10 uppercase">
                                {banner ? 'AD' : 'PROMOTION'}
                              </span>
                              {(banner?.link_url || !banner) && <ExternalLink size={14} className="text-white/60" />}
                            </div>
                            <h4 className="text-xl font-black text-white leading-tight tracking-tight">
                              {banner?.title || 'ARA Premium Academy'}
                            </h4>
                          </div>
                        </motion.div>
                      );
                    }
                    return acc;
                  }, [])
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-500">{t('study.no_content')}</div>
                )}
                <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
              </div>

              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination totalPages={totalPages} page={page} onPageChange={setPage} windowSize={5} autoScrollTop={true} />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudyListPage;

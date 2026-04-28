/**
 * 지능형 학습 콘텐츠 큐레이션 리스트(Intelligent Study Content Curation List):
 * - 목적(Why): 방대한 K-콘텐츠 라이브러리에서 사용자의 수준과 관심사에 맞는 학습 유닛을 탐색 및 필터링함
 * - 방법(How): 서버 측 페이지네이션(Server-side Pagination)과 인라인 마케팅 배너 삽입 엔진을 결합하여 가독성과 비즈니스 가치를 동시에 확보함
 */
import GuideModal, { isGuideModalDismissed } from '@/components/common/GuideModal';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '@/components/common/Pagination';
import CategoryTabs, { type TCategory } from '@/components/study/CategoryTabs';
import ContentCard from '@/components/study/ContentCard';
import FilterDropdown, { type TDifficulty } from '@/components/study/FilterDropdown';
import SearchBar from '@/components/ui/SearchBar';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBatchAutoTranslation } from '@/hooks/useBatchAutoTranslation';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { supabase } from '../lib/supabase';
import type { Study } from '../types/study';
import { useAuth } from '@/contexts/AuthContext';
import SignInModal from '@/components/auth/SignInModal';
import { BookOpen, ExternalLink } from 'lucide-react';
import { useMarketingBanners } from '@/hooks/useMarketingBanners';

const ALL_CATEGORIES: string[] = ['all', 'drama', 'movie', 'show', 'music'];
const ALL_LEVELS: TDifficulty[] = ['', 'beginner', 'intermediate', 'advanced'];
const LEANING_GUIDE_KEY = 'ara-leaning-guide';

const LEANING_GUIDE_SLIDES = (t: any) => [
  { id: 'leaning-1', image: '/images/leaning_guide_1.gif', alt: t('study.promotion.guide_alt_1') },
  { id: 'leaning-2', image: '/images/leaning_guide_2.gif', alt: t('study.promotion.guide_alt_2') },
  { id: 'leaning-3', image: '/images/leaning_guide_3.gif', alt: t('study.promotion.guide_alt_3') },
  { id: 'leaning-4', image: '/images/leaning_guide_4.gif', alt: t('study.promotion.guide_alt_4') },
  { id: 'leaning-5', image: '/images/leaning_guide_5.gif', alt: t('study.promotion.guide_alt_5') },
];

const StudyListPage = () => {
  const { t, i18n } = useTranslation();
  const targetLang = i18n.language;
  const navigate = useNavigate();
  const [clips, setClips] = useState<Study[]>([]);
  const [keyword, setKeyword] = useState('');
  const [total, setTotal] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, userPlan, isAdmin } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // 광고 노출 정책 제어 — 유료 플랜(Premium/Basic) 및 관리자 계정 식별을 통한 인라인 광고 제거 판별
  const isAdFree = userPlan === 'premium' || userPlan === 'basic' || (isAdmin && userPlan !== 'free');

  const displayCategory = useMemo(() => {
    const q = searchParams.get('category') ?? 'all';
    return (ALL_CATEGORIES.includes(q) ? q : 'all');
  }, [searchParams.get('category')]);

  const [activeCategory, setActiveCategory] = useState<string>(displayCategory);
  const [levelFilter, setLevelFilter] = useState<TDifficulty>((searchParams.get('level') ?? '') as TDifficulty);
  // page는 pageSize useEffect보다 먼저 선언되어야 setPage(1) 참조가 유효함
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1', 10));

  // [반응형 페이지네이션] 화면 너비 및 광고 정책에 따른 DB 페치 수 산출
  // 배너는 매 3번째 학습 카드 뒤에 삽입 → 2열/3열에서 2개 규칙 분산, 1열에서 1개
  // 총 노출: 1열=5(4+1), 2열=10(8+2), 3열=9(7+2)
  const getResponsivePageSize = () => {
    if (typeof window === 'undefined') return isAdFree ? 9 : 7;
    const width = window.innerWidth;
    // 1열 (< 640px): 총 5개 — free: 학습4+배너1 / premium: 학습5
    if (width < 640) return isAdFree ? 5 : 4;
    // 2열 (< 1024px): 총 10개 — free: 학습8+배너2 / premium: 학습10
    if (width < 1024) return isAdFree ? 10 : 8;
    // 3열 (>= 1024px): 총 9개 — free: 학습7+배너2 / premium: 학습9
    return isAdFree ? 9 : 7;
  };

  const [pageSize, setPageSize] = useState(getResponsivePageSize);
  const limit = pageSize;

  // resize 또는 isAdFree 변경 시 pageSize 재계산
  useEffect(() => {
    const recalc = () => {
      const next = getResponsivePageSize();
      setPageSize(prev => {
        if (prev !== next) {
          setPage(1);
          return next;
        }
        return prev;
      });
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [isAdFree]);

  const { banners: inlineBanners, trackClick: trackBannerClick, trackView: trackBannerView } = useMarketingBanners('inline_card');

  useEffect(() => {
    if (!isGuideModalDismissed(LEANING_GUIDE_KEY)) setShowGuide(true);
  }, []);

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  // 메타데이터 배치 번역 — 대량의 학습 콘텐츠 제목 및 설명을 타겟 언어로 일괄 변환 처리
  const { translatedTexts: trTitles } = useBatchAutoTranslation(clips.map((c: any) => c.title), clips.map((c: any) => `study_title_${c.id}`), targetLang);
  const { translatedTexts: trDescs } = useBatchAutoTranslation(clips.map((c: any) => c.short_description || ''), clips.map((c: any) => `study_desc_${c.id}`), targetLang);
  const { translatedTexts: trEpisodes } = useBatchAutoTranslation(clips.map((c: any) => (c.video && c.video?.length > 0 ? c.video[0].episode : '') || ''), clips.map((c: any) => `study_episode_${c.id}`), targetLang);

  useEffect(() => {
    let ignore = false;
    const fetchClips = async () => {
      const needsVideoFilter = activeCategory !== 'all' || levelFilter !== '';
      let query = (supabase.from('study') as any)
        .select(needsVideoFilter ? '*, video!inner(*)' : '*, video(*)', { count: 'exact' });
      
      query = query.eq('is_hidden', false);

      if (activeCategory !== 'all') {
        const dbCategory = activeCategory === 'show' ? '예능' : 
                          activeCategory === 'drama' ? '드라마' : 
                          activeCategory === 'movie' ? '영화' : 
                          activeCategory === 'music' ? '음악' : activeCategory;
        query = query.eq('video.categories', dbCategory);
      }
      if (levelFilter) {
        const dbLevel = levelFilter === 'beginner' ? '초급' :
                        levelFilter === 'intermediate' ? '중급' :
                        levelFilter === 'advanced' ? '고급' : levelFilter;
        query = query.eq('video.level', dbLevel);
      }
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
    const next = (ALL_CATEGORIES.includes(c) ? c : 'all');
    setActiveCategory(next);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'all') nextParams.delete('category');
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

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="study-page relative min-h-screen bg-white dark:bg-background">
      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} slides={LEANING_GUIDE_SLIDES(t)} storageKey={LEANING_GUIDE_KEY} />
      
      <div className="flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl">
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-auto bg-white dark:bg-background">
            {/* 탐색 인터페이스 — 카테고리 필터 및 검색 바를 포함한 스티키 네비게이션 레이어 */}
            <div className="flex flex-row justify-between items-center gap-1 md:gap-3 bg-white dark:bg-background sticky top-0 z-20 pb-2 pl-6 pt-8 pr-5">
              <div
                className={`flex-1 min-w-0 overflow-x-auto no-scrollbar ${isScrollable ? 'mask-gradient' : ''}`}
                ref={categoryScrollRef}
              >
                <CategoryTabs
                  active={activeCategory}
                  onChange={handleCategoryChange}
                  categories={ALL_CATEGORIES.map((c) => ({
                    value: c,
                    label: String(t(`study.category.${c}`))
                  }))}
                />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="flex items-center h-11 gap-2">
                  {/* 마이 보카 단축 경로 — 인증 유저 전용 단어장 페이지 이동 인터페이스 */}
                  {user && (
                    <button
                      onClick={() => navigate('/voca')}
                      className="shrink-0 h-11 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-full ring-1 ring-gray-200 dark:ring-white/10 bg-white/70 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:ring-primary/50 hover:bg-primary/20 dark:hover:bg-primary/25 hover:text-primary transition-all"
                    >
                      <BookOpen size={19} />
                      <span className="hidden md:inline text-sm font-semibold">{t('study.voca_btn')}</span>
                    </button>
                  )}

                  <FilterDropdown
                    value={levelFilter}
                    onApply={value => applyLevel(value as TDifficulty)}
                    title={t('study.level.title')}
                    labelMap={{
                      '': t('study.level.all'),
                      beginner: t('study.level.beginner'),
                      intermediate: t('study.level.intermediate'),
                      advanced: t('study.level.advanced'),
                    }}
                  />
                </div>

                {/* 컴팩트 검색 토글 — 모바일 환경에서의 검색 입력창 노출 제어 */}
                <button
                  onClick={() => setShowSearch(true)}
                  className="hidden mobile-search-btn-900 shrink-0 h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-secondary transition"
                >
                  <i className="ri-search-line text-[20px] sm:text-[24px] text-gray-600 dark:text-gray-200" />
                </button>

                {/* 전역 콘텐츠 검색 — 키워드 기반 학습 데이터 필터링 입력 폼 */}
                <div className="hidden desktop-search-900 items-center h-11">
                  <SearchBar
                    placeholder={t('study.search_placeholder')}
                    value={keyword}
                    onChange={handleKeywordChange}
                    onSubmit={() => {}}
                  />
                </div>
              </div>
            </div>

            <div className="w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 lg:max-w-[1200px] xl:max-w-[1320px] 2xl:max-w-[1400px]">
              <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                {clips.length > 0 ? (
                  clips.reduce<React.ReactNode[]>((acc, study, index) => {
                    const originalIndex = clips.findIndex(c => c.id === study.id);
                    const [v] = study.video ?? [];
                    acc.push(
                      <ContentCard
                        key={study.id}
                        id={study.id}
                        image={study.poster_image_url}
                        title={study.title || ''}
                        translatedTitleProp={originalIndex >= 0 ? trTitles[originalIndex] : null}
                        short_description={study.short_description || ''}
                        translatedDescProp={originalIndex >= 0 ? trDescs[originalIndex] : null}
                        contents={v?.contents || ''}
                        episode={v?.episode || ''}
                        scene={v?.scene || ''}
                        level={v?.level || ''}
                        duration={typeof v?.runtime_bucket === 'string' ? v.runtime_bucket : null}
                        translatedEpisodeProp={originalIndex >= 0 ? trEpisodes[originalIndex] : null}
                        basePath={user ? '/study' : '/guest-study'}
                        isGuest={!user}
                        isPreview={study.is_featured}
                        required_plan={study.required_plan}
                        created_at={study.created_at}
                        openLoginModal={() => setShowSignIn(true)}
                      />
                    );

                    // 배너 삽입: 매 3번째 학습 카드 뒤 삽입 (규칙적 간격 배치)
                    if (!isAdFree && (index + 1) % 3 === 0) {
                      const globalIndex = ((page - 1) * limit) + index;
                      const hasBanners = inlineBanners.length > 0;
                      const bannerIndex = hasBanners ? (Math.floor(globalIndex / 5) % inlineBanners.length) : 0;
                      const banner = hasBanners ? inlineBanners[bannerIndex] : null;
                      
                      acc.push(
                        <div
                          key={`marketing-${globalIndex}-${banner?.id || 'default'}`}
                          onClick={() => {
                            if (banner) {
                              trackBannerClick(banner.id);
                              if (banner.link_url) window.open(banner.link_url, '_blank', 'noopener');
                            } else {
                              window.location.href = '/subscription';
                            }
                          }}
                          className="group relative flex flex-col h-full rounded-xl shadow-lg cursor-pointer transition-all hover:shadow-xl sm:scale-[0.95] md:scale-100 sm:hover:scale-[0.98] origin-top duration-300 overflow-hidden transform-gpu ring-1 ring-transparent bg-white dark:bg-secondary"
                        >
                          {/* 이미지 구조 정석화 (Aspect-video 고정) */}
                          <div className="card__media aspect-video relative w-full overflow-hidden rounded-t-xl">
                            {banner?.image_url ? (
                              <img src={banner.image_url} alt={banner.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex flex-col items-center justify-center p-8 text-center border border-gray-100 dark:border-white/5">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1 leading-tight">
                                  {t('study.promotion.premium_title')}
                                </h4>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {t('study.promotion.premium_desc')}
                                </p>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                            <div className="absolute inset-0 p-3 sm:p-5 flex flex-col justify-end">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[8px] sm:text-[9px] font-black text-white tracking-widest border border-white/10 uppercase">
                                  {banner ? t('study.promotion.ad_badge') : t('study.promotion.promo_badge')}
                                </span>
                              </div>
                              <BannerTitle banner={banner} fallback={t('study.promotion.premium_title')} />
                            </div>
                          </div>

                          {/* 본문 구조 정석화 (flex-1 적용하여 높이 동기화) */}
                          <div className="flex-1 px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2">
                            <div className="grid min-h-20 flex flex-col justify-center">
                              <div className="flex items-center justify-between opacity-50">
                                <span className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-tighter">Premium Collection</span>
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary/60">
                                  <ExternalLink size={10} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return acc;
                  }, [])
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-500">{t('study.no_content')}</div>
                )}
                <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
              </div>

              {totalPages >= 1 && (
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

function BannerTitle({ banner, fallback }: { banner: any, fallback: string }) {
  const { t, i18n } = useTranslation();
  const title = banner?.title || '';

  // [Surgical Tip] 마케팅 구독 수동 번역 키 우선 적용 (번역 딜레이 방지)
  if (banner?.id?.includes('subscription') || title.toLowerCase().includes('subscription')) {
    const manualTitle = t('marketing.subscription.title');
    if (manualTitle && manualTitle !== 'marketing.subscription.title') {
      return (
      <h4 className="text-sm sm:text-[13px] md:text-base font-black text-white leading-tight tracking-tight drop-shadow-sm line-clamp-1">
        {manualTitle}
      </h4>
    );
  }
}

const { translatedText } = useAutoTranslation(title, `banner_title_inline_${banner?.id}`, i18n.language);

return (
  <h4 className="text-sm sm:text-[13px] md:text-base font-black text-white leading-tight tracking-tight drop-shadow-sm line-clamp-1">
    {translatedText || title || fallback}
  </h4>
);
}

export default StudyListPage;

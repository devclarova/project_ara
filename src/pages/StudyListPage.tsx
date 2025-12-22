import GuideModal, { isGuideModalDismissed } from '@/components/common/GuideModal';
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

const ALL_CATEGORIES: TCategory[] = ['전체', '드라마', '영화', '예능', '음악'];
const ALL_LEVELS: TDifficulty[] = ['', '초급', '중급', '고급'];

const LEANING_GUIDE_KEY = 'ara-leaning-guide';

const LEANING_GUIDE_SLIDES = [
  {
    id: 'leaning-1',
    image: '/images/leaning_guide_1.gif',
    alt: 'ARA Study 이용 방법 안내 1',
  },
  {
    id: 'leaning-2',
    image: '/images/leaning_guide_2.gif',
    alt: 'ARA Study 이용 방법 안내 2',
  },
  {
    id: 'leaning-3',
    image: '/images/leaning_guide_3.gif',
    alt: 'ARA Study 이용 방법 안내 3',
  },
  {
    id: 'leaning-4',
    image: '/images/leaning_guide_4.gif',
    alt: 'ARA Study 이용 방법 안내 4',
  },
  {
    id: 'leaning-5',
    image: '/images/leaning_guide_5.gif',
    alt: 'ARA Study 이용 방법 안내 5',
  },
];

const StudyListPage = () => {
  const { t, i18n } = useTranslation();
  const targetLang = i18n.language;

  const [clips, setClips] = useState<Study[]>([]); // 콘텐츠 목록
  const [keyword, setKeyword] = useState(''); // 검색
  const [page, setPage] = useState(1); // 현재 페이지
  const [total, setTotal] = useState(0); // 전체 콘텐츠 개수
  const [showSearch, setShowSearch] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams(); // URL 쿼리
  const { user } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  const [showGuide, setShowGuide] = useState(false);

  const [pageSize, setPageSize] = useState(9);
  const limit = pageSize;

  useEffect(() => {
    if (!isGuideModalDismissed(LEANING_GUIDE_KEY)) {
      setShowGuide(true);
    }
  }, []);

  // 쿼리에서 초기 category 읽기 (유효하지 않으면 '전체')
  const displayCategory: TCategory = useMemo(() => {
    const q = searchParams.get('category') ?? '전체';
    const valid = ALL_CATEGORIES.includes(q as TCategory) ? q : '전체';
    return valid as TCategory;
  }, [searchParams.get('category')]); // 의존성 최소화

  const contentFilter = searchParams.get('content')?.trim() ?? '';
  const episodeFilter = searchParams.get('episode')?.trim() ?? '';

  // 쿼리에서 초기 lelvels 읽기
  const displayLevel: TDifficulty = useMemo(() => {
    const raw = searchParams.get('level') ?? '';
    return (ALL_LEVELS.includes(raw as TDifficulty) ? (raw as TDifficulty) : '') as TDifficulty;
  }, [searchParams]);

  const [activeCategory, setActiveCategory] = useState<TCategory>(displayCategory);
  const [levelFilter, setLevelFilter] = useState<TDifficulty>(displayLevel);

  // Ref for horizontal scroll on wheel
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Batch Translation
  const titles = clips.map(c => c.title);
  const titleKeys = clips.map(c => `study_title_${c.id}`);
  const { translatedTexts: trTitles } = useBatchAutoTranslation(titles, titleKeys, targetLang);

  const descs = clips.map(c => c.short_description || '');
  const descKeys = clips.map(c => `study_desc_${c.id}`);
  const { translatedTexts: trDescs } = useBatchAutoTranslation(descs, descKeys, targetLang);

  const durations = clips.map(c => {
    const v = Array.isArray(c.video) ? c.video[0] : c.video as any; // Safe cast or check
    return typeof v?.runtime_bucket === 'string' ? v.runtime_bucket : '';
  });
  const durationKeys = clips.map(c => `study_duration_${c.id}`);
  const { translatedTexts: trDurations } = useBatchAutoTranslation(durations, durationKeys, targetLang);

  const episodes = clips.map(c => {
    const v = Array.isArray(c.video) ? c.video[0] : c.video as any;
    return v?.episode || '';
  });
  const episodeKeys = clips.map(c => `study_episode_${c.id}`);
  const { translatedTexts: trEpisodes } = useBatchAutoTranslation(episodes, episodeKeys, targetLang);

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      const from = (page - 1) * limit;
      // ... (rest of logic is unchanged here, just context)

// ... separating hook logic and render logic for clarity, 
// actually I'm replacing the block from "const descs..." down to render is too big.
// I will target the Hooks area first.

      const to = from + limit - 1;

      let query = supabase
        .from('study')
        .select('*, video(*,runtime_bucket)', { count: 'exact' })
        .order('id', { ascending: true });

      // 필터 조건
      const needsCategory = activeCategory !== '전체';
      const needsContent = !!contentFilter;
      const needsEpisode = !!episodeFilter;
      const needsLevel = !!levelFilter;

      if (needsCategory || needsContent || needsEpisode || needsLevel) {
        query = supabase
          .from('study')
          .select('*, video!inner(*,runtime_bucket)', { count: 'exact' })
          .order('id', { ascending: true });

        if (needsCategory) query = query.eq('video.categories', activeCategory);
        if (needsContent) query = query.eq('video.contents', contentFilter);
        if (needsEpisode) query = query.eq('video.episode', episodeFilter);
        if (needsLevel) query = query.eq('video.level', levelFilter);
      }

      // keyword 검색은 클라이언트 사이드에서 처리 (번역 대응)
      // keyword가 있을 때는 전체 데이터를 가져와서 클라이언트에서 필터링
      const hasKeyword = keyword.trim().length > 0;
      
      const { data, count, error } = hasKeyword 
        ? await query // 검색 시: 전체 데이터 가져오기
        : await query.range(from, to); // 검색 없을 때: 페이지네이션
        
      if (error) {
        console.error('데이터 불러오기 오류:', error.message);
        return;
      }
      setClips((data ?? []) as Study[]);
      
      // keyword 없을 때만 DB count 사용 (검색 시는 필터링 후 count)
      if (!hasKeyword) {
        setTotal(count ?? 0);
      }
    };

    fetchData();
  }, [page, limit, activeCategory, levelFilter, contentFilter, episodeFilter]); // keyword 제거

  // 클라이언트 사이드 검색 필터링 (번역된 텍스트 포함)
  const finalList = useMemo(() => {
    if (!keyword.trim()) return clips;

    const lowerKeyword = keyword.toLowerCase();
    
    return clips.filter((clip, idx) => {
      const originalTitle = clip.title?.toLowerCase() || '';
      const translatedTitle = (trTitles[idx] || '').toLowerCase();
      const originalDesc = (clip.short_description || '').toLowerCase();
      const translatedDesc = (trDescs[idx] || '').toLowerCase();

      // 원문 또는 번역문에서 검색어 포함 여부 확인
      return (
        originalTitle.includes(lowerKeyword) ||
        translatedTitle.includes(lowerKeyword) ||
        originalDesc.includes(lowerKeyword) ||
        translatedDesc.includes(lowerKeyword)
      );
    });
  }, [clips, keyword, trTitles, trDescs]);

  // 검색 필터링 후 total 업데이트 + 페이지네이션 적용
  const paginatedList = useMemo(() => {
    // 검색이 있을 때는 필터링 후 클라이언트 페이지네이션
    if (keyword.trim()) {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return finalList.slice(start, end);
    }
    // 검색 없을 때는 이미 DB에서 페이지네이션된 결과
    return finalList;
  }, [finalList, keyword, page, pageSize]);

  useEffect(() => {
    setTotal(finalList.length);
  }, [finalList]);

  // URL이 바뀌면 탭/페이지도 맞춰주기
  useEffect(() => {
    setActiveCategory(displayCategory);
    setPage(1);
  }, [displayCategory, contentFilter, episodeFilter, keyword]); // keyword 추가

  useEffect(() => {
    setLevelFilter(displayLevel);
    setPage(1);
  }, [displayLevel]);

  // 화면 크기에 따라 콘텐츠 수 설정
  useEffect(() => {
    const updatePageSize = () => {
      const width = window.innerWidth;

      if (width < 640) {
        // 모바일 (1열)
        setPageSize(6); // ← 여기서 모바일 개수 조절
      } else {
        // 태블릿/데스크톱 (2열, 3열, 4열 모두 호환)
        // 12는 2와 3 (그리고 4)의 공배수이므로 빈 칸 없이 정렬됨
        setPageSize(12);
      }
    };

    updatePageSize();
    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, []);

  // Enable horizontal scroll on wheel for category tabs
  useEffect(() => {
    const scrollContainer = categoryScrollRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      // Only handle horizontal scroll if there's overflow
      if (scrollContainer.scrollWidth > scrollContainer.clientWidth) {
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollContainer.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const totalPages = Math.ceil(total / limit);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1); // 검색 변경 시 1페이지로
  };

  const handleCategoryChange = (c: string) => {
    const next = (ALL_CATEGORIES.includes(c as TCategory) ? c : '전체') as TCategory;
    setActiveCategory(next);
    setPage(1);

    if (next === '전체') updateSearchParam('category', null);
    else updateSearchParam('category', next);
  };

  const updateSearchParam = (key: string, value: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === null) nextParams.delete(key);
    else nextParams.set(key, value);
    setSearchParams(nextParams, { replace: true });
  };

  const applyLevel = (next: TDifficulty) => {
    setLevelFilter(next);
    setPage(1);
    // ''(전체)이면 쿼리 제거, 아니면 세팅
    if (!next) updateSearchParam('level', null);
    else updateSearchParam('level', next);
  };

  // 리랜더링 방지
  const PaginationComponent = React.memo(Pagination);

  return (
    <div className="study-page relative min-h-screen bg-white dark:bg-background">
      {/* StudyListPage 전용 미디어쿼리 */}
      <style>
        {`
  @media (max-width: 900px) {
    /* md:hidden → 보이게 하는 기존 override */
    .md\\:hidden {
      display: inline-flex !important;
    }

    /* desktop 검색바 숨기기 */
    .desktop-search-only {
      display: none !important;
    }

    /* desktop 검색바 숨기기 */
    .desktop-search-only {
      display: none !important;
    }
  }
`}
      </style>

      <GuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        slides={LEANING_GUIDE_SLIDES}
        storageKey={LEANING_GUIDE_KEY}
        // 필요하면 버튼 텍스트 커스텀
        // prevLabel="이전"
        // nextLabel="다음"
        // completeLabel="시작하기"
        // closeLabel="닫기"
        // neverShowLabel="다시 보지 않기"
      />

      <div className="flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl">
          {/* Left Sidebar */}
          {/* <aside className="w-20 lg:w-64 shrink-0 h-screen sticky top-0 bg-white dark:bg-background z-30">
            <Sidebar onTweetClick={() => setShowTweetModal(true)} />
          </aside> */}

          {/* 메인 영역 */}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-auto bg-white dark:bg-background">
            {/* 탭 + 검색 */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center md:gap-5 bg-white dark:bg-background sticky top-0 z-20 pb-2 pl-6 pt-8 pr-6">
              {/* 왼쪽: 카테고리 + 모바일용 검색 아이콘 */}
              <div className="flex items-center justify-between w-full md:w-auto search-row relative gap-2">
                <div ref={categoryScrollRef} className="flex-1 min-w-0 overflow-x-auto no-scrollbar mask-gradient">
                  <CategoryTabs 
                    active={displayCategory} 
                    onChange={handleCategoryChange} 
                    categories={ALL_CATEGORIES.map(c => ({
                      value: c,
                      label: c === '전체' ? t('study.category.all') :
                             c === '드라마' ? t('study.category.drama') :
                             c === '영화' ? t('study.category.movie') :
                             c === '예능' ? t('study.category.entertainment') :
                             c === '음악' ? t('study.category.music') : c
                    }))}
                  />
                </div>

                {/* 모바일 전용 검색 버튼 (카테고리 옆에 위치) */}
                <button
                  onClick={() => setShowSearch(true)}
                  className="md:hidden shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-secondary transition"
                  aria-label="검색 열기"
                >
                  <i className="ri-search-line text-[20px] sm:text-[24px] md:text-[28px] text-gray-600 dark:text-gray-200" />
                </button>
              </div>

              {/* 오른쪽: 필터 + 검색 그룹 (데스크톱 전용) */}
              <div className="hidden md:flex desktop-search-only items-center gap-2 mt-3 md:mt-0 flex-nowrap">
                <div className="flex items-center h-11">
                  <FilterDropdown 
                    value={levelFilter} 
                    onApply={applyLevel} 
                    labelMap={{
                      '': t('study.level.all'),
                      '초급': t('study.level.beginner'),
                      '중급': t('study.level.intermediate'),
                      '고급': t('study.level.advanced')
                    }}
                  />
                </div>
                <div className="flex items-center h-11">
                  <SearchBar
                    placeholder={t('study.search_placeholder')}
                    value={keyword}
                    onChange={handleKeywordChange}
                    onSubmit={() => {}}
                  />
                </div>
              </div>

              {/* 모바일: 검색 전용 모달 */}
              {showSearch && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20 md:hidden">
                  <div className="bg-white dark:bg-secondary w-[90%] max-w-sm rounded-xl shadow-lg p-4 flex flex-col gap-4">
                    {/* 헤더 */}
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                        {t('common.search')}
                      </h2>
                      <button
                        onClick={() => setShowSearch(false)}
                        className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                        aria-label="닫기"
                      >
                        <i className="ri-close-line text-xl" />
                      </button>
                    </div>

                    {/* 검색만 표시 */}
                    <div className="mt-2">
                      <SearchBar
                        autoFocus
                        placeholder={t('study.search_placeholder')}
                        value={keyword}
                        onChange={handleKeywordChange}
                        onSubmit={() => {
                          setShowSearch(false); // 검색 후 모달 닫기
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 콘텐츠 영역 */}
            <div className="w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 lg:max-w-[1200px] xl:max-w-[1320px] 2xl:max-w-[1400px] bg-white dark:bg-background">
              {/* 카드 그리드 */}
              <div className="grid gap-6 sm:gap-8 px-0 grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:repeat(3,minmax(260px,1fr))] bg-white dark:bg-background">
                {paginatedList.length > 0 ? (
                  paginatedList.map((study) => {
                    // 원본 clips 배열에서 인덱스 찾기 (번역 데이터 매칭용)
                    const originalIndex = clips.findIndex(c => c.id === study.id);
                    const [v] = study.video ?? [];
                    return (
                      <ContentCard
                        key={study.id}
                        id={study.id}
                        image={study.poster_image_url}
                        title={study.title || '제목 없음'}
                        short_description={study.short_description || '설명 없음'}
                        contents={v?.contents || ''}
                        episode={v?.episode || ''}
                        scene={v?.scene || ''}
                        level={v?.level || ''}
                        duration={typeof v?.runtime_bucket === 'string' ? v.runtime_bucket : null}
                        basePath={user ? '/study' : '/guest-study'} // 로그인/게스트에 따라 이동 경로 달라짐
                        isGuest={!user} // 게스트 여부
                        isPreview={study.is_featured}
                        openLoginModal={() => setShowSignIn(true)} // 잠금 콘텐츠 눌렀을 때 로그인 모달 열기
                        categories={v?.categories || null}
                        translatedTitleProp={originalIndex >= 0 ? trTitles[originalIndex] : null}
                        translatedDescProp={originalIndex >= 0 ? trDescs[originalIndex] : null}
                        translatedDurationProp={originalIndex >= 0 ? trDurations[originalIndex] : null}
                        translatedEpisodeProp={originalIndex >= 0 ? trEpisodes[originalIndex] : null}
                      />
                    );
                  })
                ) : (
                  // 빈 결과 문구
                  <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    {t('study.no_content')}
                  </div>
                )}
                <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <PaginationComponent
                  totalPages={totalPages}
                  page={page}
                  onPageChange={setPage}
                  windowSize={5} // 5개씩 보이기
                  autoScrollTop={true} // 숫자 클릭 시 상단으로
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudyListPage;

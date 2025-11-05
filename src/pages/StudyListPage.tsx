import CategoryTabs, { type TCategory } from '@/components/study/CategoryTabs';
import ContentCard from '@/components/study/ContentCard';
import FilterDropdown, { type TDifficulty } from '@/components/study/FilterDropdown';
import SearchBar from '@/components/ui/SearchBar';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Study } from '../types/study';
import Sidebar from './homes/feature/Sidebar';
import { useSearchParams } from 'react-router-dom';

const ALL_CATEGORIES: TCategory[] = ['전체', '드라마', '영화', '예능', '음악'];

const StudyListPage = () => {
  const [clips, setClips] = useState<Study[]>([]); // 콘텐츠 목록
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [keyword, setKeyword] = useState(''); // 검색
  const [page, setPage] = useState(1); // 현재 페이지
  const [total, setTotal] = useState(0); // 전체 콘텐츠 개수
  const [showSearch, setShowSearch] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams(); // URL 쿼리

  // 쿼리에서 초기 category 읽기 (유효하지 않으면 '전체')
  const displayCategory: TCategory = useMemo(() => {
    const q = searchParams.get('category') ?? '전체';
    return (ALL_CATEGORIES.includes(q as TCategory) ? q : '전체') as TCategory;
  }, [searchParams]);

  const [activeCategory, setActiveCategory] = useState<TCategory>(displayCategory);
  const [levelFilter, setLevelFilter] = useState<TDifficulty>('');

  const limit = 9; // 한 페이지당 9개 (3x3 그리드)

  // 콘텐츠 필터링
  const contentFilter = useMemo(() => {
    const raw = searchParams.get('content')?.trim() ?? '';
    return raw.length ? raw : '';
  }, [searchParams]);

  // 에피소드 필터링
  const episodeFilter = useMemo(() => {
    const raw = searchParams.get('episode')?.trim() ?? '';
    return raw.length ? raw : '';
  }, [searchParams]);

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // 기본 셀렉트
      let query = supabase
        .from('study')
        .select('*, video(*,runtime_bucket)', { count: 'exact' })
        .order('id', { ascending: true });

      // 카테고리/콘텐츠 중 하나라도 필터가 있으면 INNER JOIN 로 전환해 정확히 필터
      const needsCategory = activeCategory !== '전체';
      const needsContent = !!contentFilter;
      const needsEpisode = !!episodeFilter;
      const needsLevel = !!levelFilter;

      if (needsCategory || needsContent) {
        query = supabase
          .from('study')
          .select('*, video!inner(*,runtime_bucket)', { count: 'exact' })
          .order('id', { ascending: true });

        if (needsCategory) {
          query = query.eq('video.categories', activeCategory);
        }
        if (needsContent) {
          query = query.eq('video.contents', contentFilter);
        }
        if (needsEpisode) {
          query = query.eq('video.episode', episodeFilter);
        }
        if (needsLevel) query = query.eq('video.level', levelFilter);
      }

      // 검색어가 있으면 필터링 추가
      if (keyword.trim()) {
        query = query.or(`title.ilike.%${keyword}%,short_description.ilike.%${keyword}%`);
      }

      const { data, count, error } = await query.range(from, to);
      if (error) {
        console.error('❌ 데이터 불러오기 오류:', error.message);
        return;
      }
      setClips((data ?? []) as Study[]);
      setTotal(count ?? 0);
    };

    fetchData();
  }, [page, activeCategory, keyword, contentFilter, episodeFilter]);

  const filteredClips =
    activeCategory === '전체'
      ? clips
      : clips.filter(study =>
          (study.video ?? []).some(v => {
            return v?.categories === activeCategory;
          }),
        );

  // 콘텐츠 필터링 추가
  const filteredContent = contentFilter
    ? filteredClips.filter(study => (study.video ?? []).some(v => v?.contents === contentFilter))
    : filteredClips;

  // 에피소드 필터링 추가
  const filteredEpisode = episodeFilter
    ? filteredContent.filter(study => (study.video ?? []).some(v => v?.episode === episodeFilter))
    : filteredContent;

  // ✅ 난이도 보정
  const finalList = levelFilter
    ? filteredEpisode.filter(study => (study.video ?? []).some(v => v?.level === levelFilter))
    : filteredEpisode;

  // URL이 바뀌면 탭/페이지도 맞춰주기
  useEffect(() => {
    setActiveCategory(displayCategory);
    setPage(1);
  }, [displayCategory, contentFilter, episodeFilter]);

  const totalPages = Math.ceil(total / limit);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1); // 검색 변경 시 1페이지로
  };

  const handleCategoryChange = (c: string) => {
    const next = (ALL_CATEGORIES.includes(c as TCategory) ? c : '전체') as TCategory;
    setActiveCategory(next);
    setPage(1);
    if (next === '전체') {
      // 전체면 쿼리 제거
      searchParams.delete('category');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ category: next }, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl">
          {/* Left Sidebar */}
          <aside className="w-20 lg:w-64 shrink-0 border-gray-200 h-screen sticky top-0 dark:bg-gray-800">
            <Sidebar onTweetClick={() => setShowTweetModal(true)} />
          </aside>

          {/* 데스크톱에서만 폭 제한해 자연스런 3열 유지 */}
          <main className="flex-1 min-w-0 bg-white dark:bg-gray-800">
            {/* 탭 + 검색 */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center md:gap-5 bg-white dark:bg-gray-800 sticky top-0 z-10 pb-2 pl-6 pt-8">
              {/* 왼쪽: 카테고리 + 모바일용 검색 아이콘 */}
              <div className="flex items-center justify-between ">
                <CategoryTabs active={displayCategory} onChange={handleCategoryChange} />

                {/* 모바일 전용 검색 버튼 (카테고리 옆에 위치) */}
                <button
                  onClick={() => setShowSearch(true)}
                  className="md:hidden ml-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                  aria-label="검색 열기"
                >
                  <i className="ri-search-line text-[20px] text-gray-600" />
                </button>
              </div>

              {/* 오른쪽: 필터 + 검색 그룹 (데스크톱 전용) */}
              <div className="hidden md:flex items-center gap-2 mt-3 md:mt-0 flex-nowrap">
                <div className="flex items-center h-11">
                  <FilterDropdown value={levelFilter} onApply={setLevelFilter} />
                </div>
                <div className="flex items-center h-11">
                  <SearchBar
                    placeholder="검색어를 입력해주세요"
                    value={keyword}
                    onChange={handleKeywordChange}
                    onSubmit={q => console.log('검색어:', q)}
                  />
                </div>
              </div>

              {/* 모바일: 검색 전용 모달  */}
              {showSearch && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20 md:hidden">
                  <div className="bg-white w-[90%] max-w-sm rounded-xl shadow-lg p-4 flex flex-col gap-4">
                    {/* 헤더 */}
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-semibold text-gray-800">검색</h2>
                      <button
                        onClick={() => setShowSearch(false)}
                        className="text-gray-500 hover:text-gray-800"
                        aria-label="닫기"
                      >
                        <i className="ri-close-line text-xl" />
                      </button>
                    </div>

                    {/* 검색만 표시 */}
                    <div className="mt-2">
                      <SearchBar
                        autoFocus
                        placeholder="검색어를 입력해주세요"
                        value={keyword}
                        onChange={handleKeywordChange}
                        onSubmit={q => {
                          console.log('검색어:', q); // 실제 검색 로직 연결
                          setShowSearch(false); // 검색 후 모달 닫기
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 lg:max-w-[1200px] xl:max-w-[1320px] 2xl:max-w-[1400px] dark:bg-gray-800">
              {/* 헤더 */}
              {/* <div className="flex flex-col sm:flex-row justify-center">
                <img src="images/sample_font_logo.png" alt="로고이미지" className="h-15 w-20" />
              </div> */}

              {/* 카드 그리드 */}
              <div className="grid gap-6 sm:gap-8  px-0 grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:repeat(3,minmax(260px,1fr))] dark:bg-gray-800">
                {finalList.length > 0 ? (
                  finalList.map(study => {
                    const [v] = study.video ?? [];
                    return (
                      <ContentCard
                        key={study.id}
                        id={study.id}
                        image={study.poster_image_url}
                        title={study.title || '제목 없음'}
                        short_description={study.short_description || '설명 없음'}
                        episode={v?.episode || ''}
                        scene={v?.scene || ''}
                        level={v?.level || ''}
                        duration={typeof v?.runtime_bucket === 'string' ? v.runtime_bucket : null}
                        comments="0개 댓글"
                      />
                    );
                  })
                ) : (
                  // 빈 결과 문구
                  <div className="col-span-full text-center py-16 text-gray-500 text-sm sm:text-base">
                    해당 조건에 맞는 학습 콘텐츠가 없습니다.
                  </div>
                )}
              </div>

              {/* 페이지네이션 */}
              {filteredClips.length > 0 && totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 my-6 sm:my-8">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={`px-3 sm:px-4 lg:px-5 py-1 sm:py-1.5 lg:py-2 rounded-md border text-sm sm:text-base lg:text-lg ${
                        page === num
                          ? 'bg-primary/80 text-white border-primary'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      } transition`}
                    >
                      {num}
                    </button>
                  ))}
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

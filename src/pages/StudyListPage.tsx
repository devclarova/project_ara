import CategoryTabs from '@/components/study/CategoryTabs';
import ContentCard from '@/components/study/ContentCard';
import FilterDropdown from '@/components/study/FilterDropdown';
import SearchBar from '@/components/ui/SearchBar';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Study } from '../types/study';
import Sidebar from './homes/feature/Sidebar';

const StudyListPage = () => {
  const [clips, setClips] = useState<Study[]>([]);
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    '전체' | '드라마' | '영화' | '예능' | '음악'
  >('전체');

  const limit = 9; // 한 페이지당 9개 (3x3 그리드)

  useEffect(() => {
    const fetchData = async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('study')
        .select('*, video(*,runtime_bucket)', { count: 'exact' })
        .order('id', { ascending: true });

      // 카테고리 필터
      if (activeCategory !== '전체') {
        query = query.select('*, video!inner(*)').eq('video.categories', activeCategory);
      }

      // 키워드 검색
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
  }, [page, activeCategory, keyword]);

  const filteredClips =
    activeCategory === '전체'
      ? clips
      : clips.filter(study =>
          (study.video ?? []).some(v => {
            return v?.categories === activeCategory;
          }),
        );

  const totalPages = Math.ceil(total / limit);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1); // 검색 변경 시 1페이지로
  };

  const handleCategoryChange = (c: string) => {
    setActiveCategory(c as typeof activeCategory);
    setPage(1); // 카테고리 변경 시 1페이지로
  };

  return (
    <div className="h-screen overflow-hidden bg-white">
      <div className="flex justify-center h-screen">
        <div className="flex w-full max-w-7xl">
          {/* Left Sidebar */}
          <aside className="w-20 lg:w-64 shrink-0 border-r border-gray-200 h-screen">
            <Sidebar onTweetClick={() => setShowTweetModal(true)} />
          </aside>

          {/* 데스크톱에서만 폭 제한해 자연스런 3열 유지 */}
          <main className="flex-1 min-w-0 bg-white h-screen overflow-y-auto hide-scrollbar">
            <div className="w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 lg:max-w-[1200px] xl:max-w-[1320px] 2xl:max-w-[1400px]">
              {/* 헤더 */}
              <div className="flex flex-col sm:flex-row justify-center">
                <img src="images/sample_font_logo.png" alt="로고이미지" className="h-15 w-20" />
              </div>

              {/* 탭 + 검색 */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center md:gap-5 border-b border-gray-200">
                {/* 왼쪽: 카테고리 + 모바일용 검색 아이콘 */}
                <div className="flex items-center justify-between">
                  <CategoryTabs active={activeCategory} onChange={handleCategoryChange} />

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
                  <div className="h-10 sm:h-11 flex items-center">
                    <FilterDropdown />
                  </div>
                  <div className="h-10 sm:h-11 flex items-center">
                    <SearchBar
                      placeholder="검색어를 입력해주세요"
                      value={keyword}
                      onChange={handleKeywordChange}
                      onSubmit={q => console.log('검색어:', q)}
                    />
                  </div>
                </div>

                {/* 모바일: 검색 + 필터 통합 모달 */}
                {showSearch && (
                  <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20 md:hidden">
                    <div className="bg-white w-[90%] max-w-sm rounded-xl shadow-lg p-4 flex flex-col gap-4">
                      {/* 헤더 */}
                      <div className="flex justify-between items-center">
                        <h2 className="text-base font-semibold text-gray-800">검색 및 필터</h2>
                        <button
                          onClick={() => setShowSearch(false)}
                          className="text-gray-500 hover:text-gray-800"
                          aria-label="닫기"
                        >
                          <i className="ri-close-line text-xl" />
                        </button>
                      </div>

                      {/* 필터 + 검색 */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 mt-3">
                        {/* 필터 */}
                        <div className="flex items-center w-full sm:w-auto">
                          <FilterDropdown />
                        </div>

                        {/* 검색 */}
                        <div className="h-10 flex items-center w-full sm:w-auto">
                          <SearchBar
                            autoFocus
                            placeholder="검색어를 입력해주세요"
                            value={keyword}
                            onChange={handleKeywordChange}
                            onSubmit={q => {
                              console.log('검색어:', q); // 실제 검색 로직
                              setShowSearch(false); // 검색 후 모달 닫기
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 카드 그리드 */}
              <div className="grid gap-6 sm:gap-8 py-4 sm:py-6 px-0 grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:repeat(3,minmax(260px,1fr))]">
                {filteredClips.length > 0 ? (
                  filteredClips.map(study => {
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

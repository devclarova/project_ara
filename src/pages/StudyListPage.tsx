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
        .select('*, video(*)', { count: 'exact' })
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
    <div className="min-h-screen overflow-x-hidden bg-white">
      <div className="flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl">
          {/* Left Sidebar */}
          <aside className="w-20 lg:w-64 shrink-0 border-r border-gray-200 sticky top-0 h-screen">
            <Sidebar onTweetClick={() => setShowTweetModal(true)} />
          </aside>

          {/* 데스크톱에서만 폭 제한해 자연스런 3열 유지 */}
          <main className="flex-1 min-w-0 bg-white">
            <div className="w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 lg:max-w-[1200px] xl:max-w-[1320px] 2xl:max-w-[1400px]">
              {/* 헤더 */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                  학습하기
                </h1>
              </div>

              {/* 탭 + 검색 */}
              <div className="flex flex-col items-center md:flex-row md:justify-between md:gap-5">
                <CategoryTabs active={activeCategory} onChange={handleCategoryChange} />
                <div className="flex flex-col items-center md:flex-row md:justify-between md:gap-1">
                  <SearchBar
                    placeholder="검색어를 입력해주세요"
                    value={keyword}
                    onChange={handleKeywordChange}
                    onSubmit={q => console.log('검색어:', q)}
                  />
                  <FilterDropdown />
                </div>
              </div>

              {/* 카드 그리드 */}
              <div className="grid gap-6 sm:gap-8 p-4 sm:p-6 mt-6 grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:repeat(3,minmax(260px,1fr))]">
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
                        duration={typeof v?.runtime === 'number' ? v.runtime : null}
                        comments="0개 댓글"
                      />
                    );
                  })
                ) : (
                  // ✅ 빈 결과 문구
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

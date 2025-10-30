import { useEffect, useState } from 'react';
import CategoryTabs from '@/components/study/CategoryTabs';
import ContentCard from '@/components/study/ContentCard';
import FilterDropdown from '@/components/study/FilterDropdown';
import SearchBar from '@/components/ui/SearchBar';
import { supabase } from '../lib/supabase';
import type { Study } from '../types/study';
import Sidebar from './homes/feature/Sidebar';

const StudyListPage = () => {
  const [clips, setClips] = useState<Study[]>([]);
  const [keyword, setKeyword] = useState('');
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 6; // 한 페이지당 9개 (3x3 그리드) 테스트 후 수정

  useEffect(() => {
    const fetchData = async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // 전체 개수 확인 (count 옵션 사용)
      const { data, count, error } = await supabase
        .from('study')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('id', { ascending: true });

      if (error) {
        console.error('❌ 데이터 불러오기 오류:', error.message);
        return;
      }

      setClips(data ?? []);
      setTotal(count ?? 0);
    };

    fetchData();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setKeyword(e.target.value);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* 데스크톱에서만 폭 제한해 자연스런 3열 유지 */}
      <div className="w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 lg:max-w-[1200px] xl:max-w-[1320px] 2xl:max-w-[1400px]">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">학습하기</h1>
          <FilterDropdown />
        </div>

        {/* 탭 + 검색 */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4 md:gap-10">
          <CategoryTabs />
          <SearchBar placeholder="검색어를 입력해주세요" />
        </div>

        {/* 카드 그리드 */}
        <div className="grid gap-6 sm:gap-8 p-4 sm:p-6 mt-6 grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:repeat(3,minmax(260px,1fr))]">
          {clips.map(study => (
            <ContentCard
              key={study.id}
              id={study.id}
              image={study.poster_image_url}
              title={study.title || '제목 없음'}
              short_description={study.short_description ?? '설명 없음'}
              level="초급"
              levelColor="bg-primary"
              duration="10분"
              comments="0개 댓글"
            />
          ))}
        </div>

        {/* 페이지네이션 그대로 */}
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
      </div>
    </div>
  );
};

export default StudyListPage;

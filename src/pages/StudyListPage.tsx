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
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Centered Container for all three sections */}
      <div className="flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl">
          {/* Left Sidebar - Now part of centered layout */}
          <div className="w-20 lg:w-64 flex-shrink-0">
            <div className="fixed w-20 lg:w-64 h-full z-10">
              <Sidebar onTweetClick={() => setShowTweetModal(true)} />
            </div>
          </div>

          {/* Central Content with spacing */}
          <div className="bg-white min-h-screen flex flex-col">
            <div className="max-w-7xl mx-auto px-6 py-8 flex-1">
              {/* 헤더 */}
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">학습하기</h1>
                <FilterDropdown />
              </div>
              {/* 탭 */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <CategoryTabs />
                <SearchBar
                  // variant="search"
                  // onChange={handleKeywordChange}
                  placeholder="검색어를 입력해주세요"
                />
              </div>
              {/* 카드 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 p-6">
                {/* DB 에서 카드 불러오기 */}
                {clips.map(study => (
                  <ContentCard
                    key={study.id}
                    id={study.id} // DB id 전달
                    image={study.poster_image_url} // 임시 이미지 (DB에 image 필드 있으면 교체)
                    title={study.title || '제목 없음'}
                    // subtitle={`${study.start} ~ ${study.end}`}
                    // desc={study.english || '설명 없음'}
                    short_description={study.short_description ?? '설명 없음'}
                    level="초급" // 필요하다면 clip.difficulty_level 활용
                    levelColor="bg-primary"
                    duration="10분" // runtime 같은 필드 있으면 대체 가능
                    comments="0개 댓글"
                  />
                ))}
              </div>
              {/* 페이지네이션 */}
              <div className="flex justify-center items-center gap-2 my-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`px-3 py-1 rounded-md border ${
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
        </div>
      </div>
    </div>
  );
};

export default StudyListPage;

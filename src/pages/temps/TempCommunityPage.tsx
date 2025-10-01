import React, { useEffect, useState } from 'react';
import { PostListDetail } from './TempPostListDetail';
import { Sidebar } from './TempSidebar';
import { Button } from '../TempHomePage';
import { Search } from 'lucide-react';
import clsx from 'clsx';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

type FilterBarProps<T extends string> = {
  options: T[];
  active: T;
  onChange: (value: T) => void;
};

export function FilterBar<T extends string>({
  options,
  active,
  onChange,
}: FilterBarProps<T>) {
  return (
    <div className="filter-bar flex gap-3 py-2 border-b border-gray-200">
      {options.map((opt) => (
        <button
          key={opt}
          className={clsx(
            'tab',
            active === opt ? 'tab--active' : 'tab--inactive'
          )}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}


export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-64">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="질문 검색"
        className="w-full border rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
      />
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}


// 게시판별 mock 데이터
const mockPosts = {
  '질문/답변': [
    {
      id: 1,
      path: '데이터 다듬기 > 결측값 처리하기',
      title: '결측값에 알맞은 수 찾는 법 알려주세요',
      content: '아이폰 13 미니 무게 140g이라는 값을 직접 코드로 확인하는 방법이 궁금합니다.',
      author: '박로아',
      time: '약 7시간 전',
      createdAt: '2025-09-30T09:00:00Z',
      avatar: 'https://ui-avatars.com/api/?name=박로아&size=24',
      stats: { answers: 0, likes: 0, comments: 0 },
    },
    {
      id: 2,
      path: '웹 개발 > CSS 기초 > 레이아웃',
      title: 'CSS position 차이',
      content: 'absolute와 fixed 차이가 헷갈려요. 예제를 봐도 명확하지 않아요.',
      author: '학생 B',
      time: '2025-09-29',
      createdAt: '2025-09-29T15:30:00Z',
      avatar: 'https://ui-avatars.com/api/?name=학생B&size=24',
      stats: { answers: 2, likes: 5, comments: 1 },
    },
    {
      id: 5,
      path: 'Python > Pandas',
      title: 'pandas DataFrame 결측치 처리 방법 질문',
      content: 'dropna와 fillna 차이가 헷갈립니다. 각각 언제 쓰는지 알려주세요.',
      author: '김데이터',
      time: '2025-09-28',
      createdAt: '2025-09-28T08:00:00Z',
      avatar: 'https://ui-avatars.com/api/?name=김데이터&size=24',
      stats: { answers: 1, likes: 2, comments: 0 },
    },
    {
      id: 6,
      path: '알고리즘 > 정렬',
      title: '퀵 정렬과 병합 정렬 차이가 궁금합니다',
      content: '시간 복잡도는 비슷하다는데 어떤 상황에서 각각 유리한지 알고 싶습니다.',
      author: '코딩러',
      time: '2025-09-27',
      createdAt: '2025-09-27T13:20:00Z',
      avatar: 'https://ui-avatars.com/api/?name=코딩러&size=24',
      stats: { answers: 3, likes: 7, comments: 2 },
    },
  ],
  자유게시판: [
    {
      id: 3,
      path: '잡담',
      title: '오늘 점심 뭐 드셨어요?',
      content: '저는 김치찌개 먹었는데 너무 맛있네요.',
      author: '밥순이',
      time: '2025-09-28',
      createdAt: '2025-09-28T12:00:00Z',
      avatar: 'https://ui-avatars.com/api/?name=밥순이&size=24',
      stats: { answers: 0, likes: 3, comments: 1 },
    },
    {
      id: 7,
      path: '잡담',
      title: '오늘 날씨 정말 좋네요',
      content: '산책하기 딱 좋은 날씨네요.',
      author: '날씨맨',
      time: '2025-09-29',
      createdAt: '2025-09-29T10:00:00Z',
      avatar: 'https://ui-avatars.com/api/?name=날씨맨&size=24',
      stats: { answers: 0, likes: 1, comments: 0 },
    },
    {
      id: 8,
      path: '취미',
      title: '요즘 빠진 취미 공유해요',
      content: '저는 최근에 드로잉 배우기 시작했어요.',
      author: '드로잉러',
      time: '2025-09-26',
      createdAt: '2025-09-26T18:30:00Z',
      avatar: 'https://ui-avatars.com/api/?name=드로잉러&size=24',
      stats: { answers: 0, likes: 6, comments: 2 },
    },
  ],
  고민나누기: [
    {
      id: 4,
      path: '취업',
      title: '면접 준비가 너무 힘들어요',
      content: '어떤 방향으로 공부해야 할지 모르겠네요.',
      author: '취준생',
      time: '2025-09-27',
      createdAt: '2025-09-27T20:45:00Z',
      avatar: 'https://ui-avatars.com/api/?name=취준생&size=24',
      stats: { answers: 1, likes: 7, comments: 0 },
    },
    {
      id: 9,
      path: '진로',
      title: '대학원 진학 고민 중입니다',
      content: '취업 대신 대학원을 가는 게 맞을까요?',
      author: '학문러',
      time: '2025-09-28',
      createdAt: '2025-09-28T09:15:00Z',
      avatar: 'https://ui-avatars.com/api/?name=학문러&size=24',
      stats: { answers: 2, likes: 2, comments: 1 },
    },
    {
      id: 10,
      path: '개인 고민',
      title: '사람들과 대화가 힘들어요',
      content: '소셜 스킬을 기르는 방법이 있을까요?',
      author: '내성인',
      time: '2025-09-29',
      createdAt: '2025-09-29T22:10:00Z',
      avatar: 'https://ui-avatars.com/api/?name=내성인&size=24',
      stats: { answers: 0, likes: 5, comments: 3 },
    },
  ],
};

const TempCommunityPage = () => {
  const [activeMenu, setActiveMenu] = useState<'질문/답변' | '자유게시판' | '고민나누기'>(
    '질문/답변',
  );
  const [activeFilter, setActiveFilter] = useState<'전체보기' | '답변대기'>('전체보기');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'최신순' | '추천순'>('최신순');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // 게시판별 posts 가져오기
  const allPosts = mockPosts[activeMenu];

  // 필터링
  const filteredPosts = allPosts.filter(post => {
    // 검색어 필터
    const matchSearch =
      search === '' ||
      post.title.includes(search) ||
      post.content.includes(search) ||
      post.author.includes(search);

    // 답변대기 필터 → stats.answers === 0
    const matchFilter =
      activeFilter === '전체보기' || (activeFilter === '답변대기' && post.stats.answers === 0);

    return matchSearch && matchFilter;
  });

  // 정렬 적용
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortOrder === '최신순') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortOrder === '추천순') {
      return b.stats.likes - a.stats.likes;
    }
    return 0;
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.sort-dropdown')) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 flex gap-8">
      <Sidebar
        items={['질문/답변', '자유게시판', '고민나누기']}
        activeItem={activeMenu}
        onSelect={setActiveMenu}
      />

      <main className="flex-1">
        {/* 제목 / 검색 / 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{activeMenu}</h2>
          <div className="flex gap-3 items-center">
            <SearchBar value={search} onChange={setSearch} />
            <Button variant="primary">
              {activeMenu === '질문/답변'
                ? '질문하기'
                : activeMenu === '자유게시판'
                  ? '글쓰기'
                  : '고민 올리기'}
            </Button>
          </div>
        </div>

        {/* 필터바 */}
        <div className="flex justify-between items-center mb-4">
          <FilterBar
            options={['전체보기', '답변대기']}
            active={activeFilter}
            onChange={setActiveFilter}
          />
          <div className="flex gap-3 text-sm text-gray-600">
            {/* 최신순 드롭다운 */}
            <div className="relative sort-dropdown">
              <button
                onClick={() => setIsSortOpen(prev => !prev)}
                className="flex items-center gap-1 hover:text-[var(--color-brand)]"
              >
                {sortOrder}
                <span className="text-xs">↕</span>
              </button>

              {isSortOpen && (
                <div className="absolute mt-2 w-24 bg-white border rounded shadow-md text-sm z-10">
                  {(['최신순', '추천순'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSortOrder(opt);
                        setIsSortOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left ${
                        sortOrder === opt
                          ? 'text-purple-600 font-semibold bg-purple-50'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 필터 버튼 그대로 */}
            <button className="hover:text-[var(--color-brand)]">필터</button>
          </div>
        </div>

        {/* 리스트 */}
        <PostListDetail posts={sortedPosts} />
      </main>
    </div>
  );
};

export default TempCommunityPage;

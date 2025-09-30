import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import placeholder from '../assets/placeholder.png';
import Input from '../components/Input';
import type { Study } from '../types/study';

const FilterDropdown = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 text-primary border border-primary rounded-button hover:bg-primary hover:text-white transition-all whitespace-nowrap"
      >
        <i className="ri-filter-line text-sm" />
        필터
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          <div className="p-4 space-y-4">
            {/* 난이도 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">난이도</h3>
              <div className="space-y-2">
                {['초급', '중급', '고급'].map(label => (
                  <label key={label} className="flex items-center">
                    <input type="checkbox" className="form-checkbox text-primary" />
                    <span className="ml-2 text-sm text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 콘텐츠 유형 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">콘텐츠 유형</h3>
              <div className="space-y-2">
                {['드라마', '예능', '영화', '뉴스', '요리'].map(label => (
                  <label key={label} className="flex items-center">
                    <input type="checkbox" className="form-checkbox text-primary" />
                    <span className="ml-2 text-sm text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 학습 시간 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">학습 시간</h3>
              <div className="space-y-2">
                {['5분 이하', '5-10분', '10분 이상'].map(label => (
                  <label key={label} className="flex items-center">
                    <input type="radio" name="duration" className="form-radio text-primary" />
                    <span className="ml-2 text-sm text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 정렬 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">정렬</h3>
              <select className="w-full text-sm text-gray-600 border border-gray-200 rounded-button px-3 py-2">
                <option>최신순</option>
                <option>인기순</option>
                <option>댓글순</option>
              </select>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-white bg-primary rounded-button whitespace-nowrap"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const categories = ['전체', '드라마', '예능', '영화'];
const CategoryTabs = () => {
  const [active, setActive] = useState('전체');
  return (
    <div className="flex gap-4 mb-8">
      {categories.map(c => (
        <button
          key={c}
          onClick={() => setActive(c)}
          className={`px-6 py-3 font-medium whitespace-nowrap !rounded-button ${
            active === c
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
};

type Props = {
  id: number;
  image?: string | null;
  title: string;
  // subtitle: string;
  // desc: string;
  short_description: string;
  level: string;
  levelColor: string;
  duration: string;
  comments: string;
};

const ContentCard = ({
  id,
  image,
  title,
  // subtitle,
  // desc,
  short_description,
  level,
  levelColor,
  duration,
  comments,
}: Props) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/study/${id}`)}
      className="group relative bg-gray-50 rounded-xl p-6 cursor-pointer shadow-sm hover:shadow-md transition h-80 flex flex-col justify-start pt-6"
    >
      <div className="flex justify-center items-center overflow-hidden">
        {/* 이미지 */}
        <div className="w-full sm:w-52 sm:h-56 bg-white rounded-t-lg mx-auto flex items-center justify-center overflow-hidden">
          <img
            src={image ? image : placeholder}
            alt={title}
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>
      {/* 본문 */}
      <div className="mt-3 text-center">
        <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {level} · {duration}
        </p>
      </div>
      {/* Hover 오버레이 */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/90 opacity-0 group-hover:opacity-100 transition"></div>{' '}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-primary/30 opacity-0 group-hover:opacity-100 transition"></div>{' '}
      {/* Hover 내용(중앙 요약 박스) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
        <div className="bg-white/85 backdrop-blur-sm rounded-lg w-56 sm:w-64 md:w-72 h-72 sm:h-80 p-4 text-center flex flex-col justify-center">
          <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
          <div className="mt-1 text-xs text-gray-600 line-clamp-2">설명 : {short_description}</div>
          <div className="mt-1 text-xs text-gray-500">난이도 : {level}</div>
          <div className="text-xs text-gray-500">시간 : {duration}</div>
        </div>
      </div>
    </div>
  );
};

const items = [
  { icon: 'ri-home-line', label: '홈' },
  { icon: 'ri-book-open-line', label: '학습' },
  { icon: 'ri-bookmark-line', label: '단어장' },
  { icon: 'ri-chat-3-line', label: '커뮤니티' },
  { icon: 'ri-user-line', label: '프로필' },
];

const BottomNav = () => {
  const [active, setActive] = useState('학습');
  return (
    <nav className="w-full bg-white border-t border-gray-100 px-6 py-4 mt-12">
      <div className="max-w-7xl mx-auto flex justify-center">
        <div className="flex gap-12">
          {items.map(item => (
            <div
              key={item.label}
              onClick={() => setActive(item.label)}
              className="flex flex-col items-center gap-1 cursor-pointer group"
            >
              <div
                className={`w-6 h-6 flex items-center justify-center transition-colors ${
                  active === item.label ? 'text-primary' : 'text-gray-400 group-hover:text-primary'
                }`}
              >
                <i className={item.icon} />
              </div>
              <span
                className={`text-xs transition-colors ${
                  active === item.label ? 'text-primary' : 'text-gray-400 group-hover:text-primary'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export const InflearnNav = () => {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t block md:hidden">
      <div className="flex justify-around items-center h-16">
        <a href="/" className="flex flex-col items-center">
          <img
            src="https://cdn.inflearn.com/assets/images/header/course.png"
            alt="강의"
            width={26}
            height={26}
          />
          <span className="text-sm">강의</span>
        </a>
        <a href="/" className="flex flex-col items-center">
          <img
            src="https://cdn.inflearn.com/assets/images/header/challenge.png"
            alt="챌린지"
            width={26}
            height={26}
          />
          <span className="text-sm">챌린지</span>
        </a>
        <a href="/" className="flex flex-col items-center">
          <img
            src="https://cdn.inflearn.com/assets/images/header/mentoring.png"
            alt="멘토링"
            width={26}
            height={26}
          />
          <span className="text-sm">멘토링</span>
        </a>
        <a href="/" className="flex flex-col items-center">
          <img
            src="https://cdn.inflearn.com/assets/images/header/roadmap.png"
            alt="로드맵"
            width={26}
            height={26}
          />
          <span className="text-sm">로드맵</span>
        </a>
      </div>
    </nav>
  );
};

const StudyListPage = () => {
  const [clips, setClips] = useState<Study[]>([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('study')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }
      setClips(data || []);
    };

    fetchData();
    console.log(`클립 확인용 : ${clips}`);
  }, []);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setKeyword(e.target.value);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1">
        {/* 헤더 */}
        {/* <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">학습하기</h1>
          <FilterDropdown />
        </div> */}
        {/* 탭 */}
        {/* <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <CategoryTabs />
          <Input
            variant="search"
            onChange={handleKeywordChange}
            placeholder="검색어를 입력해주세요"
          />
        </div> */}
        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 p-6">
          {/* DB 에서 카드 불러오기 */}
          {clips.map(study => (
            <ContentCard
              key={study.id}
              id={study.id} // DB id 전달
              image={study.poster_image_url} // 임시 이미지 (DB에 image 필드 있으면 교체)
              title={study.title || '제목 없음'}
              // subtitle={`${study.start} ~ ${study.end}`}
              // desc={study.english || '설명 없음'}
              short_description={study.short_description}
              level="초급" // 필요하다면 clip.difficulty_level 활용
              levelColor="bg-primary"
              duration="10분" // runtime 같은 필드 있으면 대체 가능
              comments="0개 댓글"
            />
          ))}

          {/* ...추가 카드 */}
        </div>
      </div>

      {/* <BottomNav /> */}
      <InflearnNav />
    </div>
  );
};

export default StudyListPage;

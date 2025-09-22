// components/FilterDropdown.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tts } from '../types/database';
import { supabase } from '../lib/supabase';

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

// components/ContentCard.tsx
type Props = {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  desc: string;
  level: string;
  levelColor: string;
  duration: string;
  comments: string;
};

const ContentCard = ({
  id,
  image,
  title,
  subtitle,
  desc,
  level,
  levelColor,
  duration,
  comments,
}: Props) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/studyList/${id}`)}
      className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 card-hover cursor-pointer"
    >
      <div className="relative">
        <img src={image} alt={title} className="w-full h-48 object-cover object-top" />
        <div
          className={`absolute top-3 right-3 ${levelColor} text-white px-2 py-1 rounded text-xs font-medium`}
        >
          {level}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{title}</h3>
        <p className="text-sm text-gray-500 mb-2">{subtitle}</p>
        <p className="text-sm text-gray-700 mb-3 truncate">{desc}</p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <i className="ri-time-line" />
            {duration}
          </div>
          <div className="flex items-center gap-1">
            <i className="ri-chat-3-line" />
            {comments}
          </div>
        </div>
      </div>
    </div>
  );
};

// components/BottomNav.tsx
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
        <a
          href="/"
          className="flex flex-col items-center"
        >
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

const LearningPage = () => {
  const [clips, setClips] = useState<Tts[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('temptts')
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
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">학습하기</h1>
          <FilterDropdown />
        </div>
        {/* 탭 */}
        <CategoryTabs />
        {/* 카드 그리드 */}
        <div className="grid gap-6 mb-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* DB 에서 카드 불러오기 */}
          {clips.map(clip => (
            <ContentCard
              key={clip.id}
              id={clip.id} // DB id 전달
              image="https://image.tmdb.org/t/p/original/7jryPmL3F0Wqv5U51SZrGQcPXfE.jpg" // 임시 이미지 (DB에 image 필드 있으면 교체)
              title={clip.dialogue || '제목 없음'}
              subtitle={`${clip.start} ~ ${clip.end}`}
              desc={clip.english || '설명 없음'}
              level="초급" // 필요하다면 clip.difficulty_level 활용
              levelColor="bg-primary"
              duration="10분" // runtime 같은 필드 있으면 대체 가능
              comments="0개 댓글"
            />
          ))}

          <ContentCard
            id={1}
            image="https://images.unsplash.com/photo-1504384308090-c894fdcc538d"
            title="사랑의 불시착"
            subtitle="Episode 1 - Scene 1"
            desc="첫 만남의 순간, 운명적인 대화가 시작됩니다."
            level="초급"
            levelColor="bg-primary"
            duration="5분"
            comments="20개 댓글"
          />
          <ContentCard
            id={2}
            image="https://images.unsplash.com/photo-1504384308090-c894fdcc538d"
            title="런닝맨"
            subtitle="Episode 580 - Scene 3"
            desc="재미있는 게임 속 다양한 한국어 표현을 배워보세요."
            level="중급"
            levelColor="bg-orange-400"
            duration="8분"
            comments="30개 댓글"
          />
          <ContentCard
            id={3}
            image="https://images.unsplash.com/photo-1504384308090-c894fdcc538d"
            title="기생충"
            subtitle="Episode 1 - Scene 5"
            desc="깊이 있는 대화를 통해 고급 한국어를 학습합니다."
            level="고급"
            levelColor="bg-red-500"
            duration="12분"
            comments="45개 댓글"
          />
          <ContentCard
            id={4}
            image="https://images.unsplash.com/photo-1504384308090-c894fdcc538d"
            title="기생충"
            subtitle="Episode 1 - Scene 5"
            desc="깊이 있는 대화를 통해 고급 한국어를 학습합니다."
            level="고급"
            levelColor="bg-red-500"
            duration="12분"
            comments="45개 댓글"
          />
          <ContentCard
            id={5}
            image="https://images.unsplash.com/photo-1504384308090-c894fdcc538d"
            title="기생충"
            subtitle="Episode 1 - Scene 5"
            desc="깊이 있는 대화를 통해 고급 한국어를 학습합니다."
            level="고급"
            levelColor="bg-red-500"
            duration="12분"
            comments="45개 댓글"
          />
          {/* ...추가 카드 */}
        </div>
      </div>

      {/* <BottomNav /> */}
      <InflearnNav />
    </div>
  );
};

export default LearningPage;

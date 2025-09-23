import {
  Badge,
  BookMarked,
  BookOpen,
  Circle,
  Clock,
  Film,
  Flame,
  Home,
  Languages,
  Menu,
  Plus,
  RefreshCw,
  Target,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import ProfilePage from './pages/ProfilePage';
import StudyPage from './pages/StudyPage';
import VocaPage from './pages/VocaPage';
import CommunityWritePage from './pages/CommunityWritePage';
import CommunityListPage from './pages/CommunityListPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import NotFound from './pages/NotFound';
import StudyListPage from './pages/StudyListPage';
import SignUpPage from './pages/SignUpPage';
import { PostProvider } from './contexts/PostContext';

const TopHeader = () => {
  const linkActive = 'text-primary font-medium';
  const linkBase = 'text-gray-600 hover:text-gray-900';

  const [authOpen, setAuthOpen] = useState(false); // 로그인 모달용 (기존 setIsOpen 대체)
  const [mobileOpen, setMobileOpen] = useState(false); // 모바일 드로어 상태
  const location = useLocation();

  // 라우트 변경 시 모바일 드로어 자동 닫기
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 h-20">
          {/* 좌측: 로고 */}
          <div className="flex items-center gap-8">
            <div className="font-gungsuh text-2xl text-primary">아라</div>

            {/* 데스크톱 메뉴 (유지) */}
            <div className="hidden sm:flex items-center gap-6">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? linkActive : 'text-gray-600 hover:text-gray-900'
                }
              >
                홈
              </NavLink>
              <NavLink
                to="/studyList"
                className={({ isActive }) =>
                  isActive ? linkActive : 'text-gray-600 hover:text-gray-900'
                }
              >
                학습
              </NavLink>
              <NavLink
                to="/voca"
                className={({ isActive }) =>
                  isActive ? linkActive : 'text-gray-600 hover:text-gray-900'
                }
              >
                단어장
              </NavLink>
              <NavLink
                to="/communitylist"
                className={({ isActive }) =>
                  isActive ? linkActive : 'text-gray-600 hover:text-gray-900'
                }
              >
                커뮤니티
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? linkActive : 'text-gray-600 hover:text-gray-900'
                }
              >
                프로필
              </NavLink>
            </div>
          </div>

          {/* 우측: 버튼들 + 모바일 햄버거 */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full hover:bg-gray-50"
              aria-label="알림"
            >
              <i className="ri-notification-3-line text-gray-600" />
            </button>

            <button
              onClick={() => setAuthOpen(true)}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-button text-white bg-primary hover:bg-primary/90"
            >
              로그인
            </button>

            {/* 모바일 햄버거 */}
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-50"
              aria-label="메뉴 열기"
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60]"
          onKeyDown={e => e.key === 'Escape' && setMobileOpen(false)}
        >
          {/* 오버레이 */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />

          {/* 오른쪽 패널 */}
          <div
            id="mobile-menu"
            className="absolute right-0 top-0 h-full w-72 max-w-[80%] bg-white shadow-xl transform transition-transform duration-200 translate-x-0"
          >
            <div className="flex items-center justify-between px-4 h-16 border-b">
              <span className="font-gungsuh text-xl text-primary">아라</span>
              <button
                className="w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-gray-50"
                aria-label="메뉴 닫기"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* === 여기부터 아이콘이 적용된 링크들 === */}
            <div className="px-3 py-4 flex flex-col gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <Home className="w-5 h-5" />
                <span>홈</span>
              </NavLink>

              <NavLink
                to="/studyList"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <BookOpen className="w-5 h-5" />
                <span>학습</span>
              </NavLink>

              <NavLink
                to="/voca"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <BookMarked className="w-5 h-5" />
                <span>단어장</span>
              </NavLink>

              <NavLink
                to="/communitylist"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <Users className="w-5 h-5" />
                <span>커뮤니티</span>
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? 'bg-gray-100 text-primary font-medium' : linkBase}`
                }
              >
                <UserCircle className="w-5 h-5" />
                <span>프로필</span>
              </NavLink>

              <div className="h-px bg-gray-200 my-3" />

              <button
                onClick={() => {
                  setAuthOpen(true);
                  setMobileOpen(false);
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-button text-white bg-primary hover:bg-primary/90"
              >
                로그인
              </button>
            </div>
            {/* === 아이콘 메뉴 끝 === */}
          </div>
        </div>
      )}
    </nav>
  );
};

type HeroProps = {
  onSignup?: () => void;
};

const Hero = ({ onSignup }: HeroProps) => {
  return (
    <section className="relative h-[600px] bg-gradient-to-b from-primary/5 to-white overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-6 h-full flex items-center">
        <div className="w-full lg:w-1/2">
          <h1 className="text-5xl font-bold leading-tight mb-6">
            한국어로 새로운 <br />
            세상을 만나보세요
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            드라마, 예능, 영화로 배우는 살아있는 한국어.
            <br />
            지금 시작해보세요!
          </p>
          <button
            onClick={onSignup}
            className="px-8 py-4 bg-primary text-white rounded-[8px] text-lg font-medium"
          >
            무료로 시작하기
          </button>
        </div>

        <div className="hidden lg:flex w-full lg:w-1/2 justify-center lg:justify-end">
          <div className="max-w-[500px]">
            <img
              src="https://readdy.ai/api/search-image?query=korean%20learning%20concept%2C%20modern%20illustration%2C%20person%20studying%20with%20laptop%2C%20books%20and%20korean%20text%2C%20high%20quality%20digital%20art&width=600&height=600&seq=1&orientation=squarish"
              alt="Korean Learning"
              className="w-full h-auto aspect-square object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const items = [
    {
      icon: <Film className="w-8 h-8" />, // 영화 아이콘
      title: '인기 콘텐츠로 학습',
      desc: '최신 드라마와 예능으로 재미있게 한국어를 배워보세요.',
    },
    {
      icon: <Languages className="w-8 h-8" />, // 번역/언어 아이콘
      title: '맞춤형 학습',
      desc: '나만의 학습 계획으로 효과적으로 실력을 향상시켜보세요.',
    },
    {
      icon: <Users className="w-8 h-8" />, // 커뮤니티/사용자 아이콘
      title: '커뮤니티 활동',
      desc: '전 세계 학습자들과 함께 소통하며 한국어를 배워보세요.',
    },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-4">학습 특징</h2>
        <p className="text-gray-600 text-center mb-12">효과적인 한국어 학습을 위한 특별한 기능</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map(f => (
            <div key={f.title} className="text-center p-6 rounded-xl bg-gray-50">
              <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContentGrid = () => {
  const contents = [
    {
      level: '초급',
      title: '사랑의 불시착',
      desc: '운명적인 만남으로 시작되는 달달한 로맨스',
      img: 'https://readdy.ai/api/search-image?query=korean%20drama%20scene%2C%20romantic%20moment%2C%20high%20quality%20cinematic%2C%20emotional&width=600&height=320&seq=2&orientation=landscape',
      time: '5분',
      chats: '20개 대화',
    },
    {
      level: '중급',
      title: '런닝맨',
      desc: '재미있는 예능 속 다양한 한국어 표현',
      img: 'https://readdy.ai/api/search-image?query=korean%20variety%20show%20scene%2C%20fun%20moment%2C%20high%20quality%20entertainment&width=600&height=320&seq=3&orientation=landscape',
      time: '8분',
      chats: '30개 대화',
    },
    {
      level: '고급',
      title: '기생충',
      desc: '긴장감 넘치는 스토리 속 고급 한국어',
      img: 'https://readdy.ai/api/search-image?query=korean%20movie%20scene%2C%20dramatic%20moment%2C%20high%20quality%20cinematic%20shot&width=600&height=320&seq=4&orientation=landscape',
      time: '10분',
      chats: '40개 대화',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-4">인기 학습 콘텐츠</h2>
        <p className="text-gray-600 text-center mb-12">많은 학습자들이 선택한 인기 콘텐츠</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {contents.map(c => (
            <div key={c.title} className="bg-white rounded-xl overflow-hidden">
              <img src={c.img} alt={c.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <Badge>{c.level}</Badge>
                <h3 className="font-bold text-lg mt-4 mb-2">{c.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{c.desc}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <i className="ri-time-line" />
                    {c.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ri-message-2-line" />
                    {c.chats}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const users = [
    {
      name: 'Sarah Johnson',
      country: '미국',
      text: '드라마로 배우니까 실제 한국인들이 쓰는 표현을 자연스럽게 익힐 수 있어서 좋아요. 특히 자막과 해설이 정말 도움이 됩니다.',
    },
    {
      name: 'Maria Garcia',
      country: '스페인',
      text: '커뮤니티에서 다른 학습자들과 교류하면서 많이 배우고 있어요. 서로 도와가며 공부하니 더 재미있네요!',
    },
    {
      name: 'Alex Chen',
      country: '싱가포르',
      text: '체계적인 커리큘럼과 다양한 콘텐츠 덕분에 꾸준히 실력이 늘고 있어요. 특히 발음 교정 기능이 큰 도움이 됩니다.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-4">학습 후기</h2>
        <p className="text-gray-600 text-center mb-12">실제 학습자들의 생생한 후기</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {users.map(u => (
            <div key={u.name} className="p-6 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <i className="ri-user-line text-xl text-gray-400" />
                </div>
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-gray-600">{u.country}</p>
                </div>
              </div>
              <p className="text-gray-600">"{u.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

type CTAProps = {
  onSignup?: () => void;
};

const CTA = ({ onSignup }: CTAProps) => {
  return (
    <section className="py-20 bg-primary/5">
      <div className="max-w-screen-xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
        <p className="text-gray-600 mb-8">재미있고 효과적인 한국어 학습이 여러분을 기다립니다</p>
        <button
          onClick={onSignup}
          className="px-8 py-4 bg-primary text-white rounded-[8px] text-lg font-medium"
        >
          무료로 시작하기
        </button>
      </div>
    </section>
  );
};

type HomeProps = {
  onSignup?: () => void;
};

const LandingPage = ({ onSignup }: HomeProps) => {
  return (
    <main>
      {/* Hero 섹션 */}
      <Hero onSignup={onSignup} />

      {/* 주요 기능 */}
      <Features />

      {/* 인기 콘텐츠 */}
      <ContentGrid />

      {/* 학습 후기 */}
      <Testimonials />

      {/* CTA */}
      <CTA onSignup={onSignup} />

      {/* 탭/사이드바 포함 메인 콘텐츠 영역 */}
      <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-8 pb-24">
        {/* 메인 영역 */}
      </div>
    </main>
  );
};

// 학습 예시 시작 구간입니다.

type Dialogue = {
  character: string;
  timestamp: string;
  dialogue: string;
  category: string;
  words: { term: string; meaning: string; example?: string }[];
  cultureNote: string;
};

const initialDialogues: Dialogue[] = [
  {
    character: '타요',
    timestamp: '00:32:58 → 00:34:11',
    dialogue: '지금쯤 영화는 끝났겠지 얼마나 재미있었을까',
    category: '추측/가정; 감탄문',
    words: [
      { term: '지금쯤', meaning: 'by now / at this time', example: '지금쯤 집에 도착했겠지.' },
      { term: '끝났겠지', meaning: 'must have ended (추측)', example: '수업은 끝났겠지.' },
      { term: '얼마나', meaning: 'how much / how', example: '얼마나 예뻤을까.' },
    ],
    cultureNote:
      '‘~겠지’는 추측을 나타내는 표현으로, 누군가의 상태나 상황을 조심스럽게 예상할 때 사용합니다. ‘얼마나 ~었을까’는 감탄과 궁금증을 동시에 표현합니다.',
  },
  {
    character: '라니',
    timestamp: '00:09:34 → 00:10:23',
    dialogue: '용기의 하트 덕분이에요',
    category: '감사 표현',
    words: [
      { term: '덕분이에요', meaning: 'thanks to (you/it)', example: '친구 덕분이에요.' },
      { term: '용기', meaning: 'courage', example: '용기를 내서 발표했어요.' },
    ],
    cultureNote:
      '‘~덕분이에요’는 한국어에서 상대방에게 감사할 때 자주 쓰이는 표현입니다. 단순한 고마움이 아니라, 상대방의 도움으로 긍정적인 결과가 생겼다는 뉘앙스를 담고 있습니다.',
  },
  {
    character: '기타',
    timestamp: '01:33:50 → 01:34:42',
    dialogue: '열심히 일한 뒤에 씻으니까',
    category: '시간 표현',
    words: [
      { term: '뒤에', meaning: 'after', example: '수업이 끝난 뒤에 밥을 먹었어요.' },
      { term: '씻다', meaning: 'to wash', example: '손을 씻으세요.' },
    ],
    cultureNote:
      '‘~한 뒤에’는 어떤 행동이 끝난 후 다음 행동이 이어짐을 나타냅니다. 일상 회화에서 시간 순서를 설명할 때 자주 쓰입니다.',
  },
];

function WordExplanation({
  words,
}: {
  words: { term: string; meaning: string; example?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {words.map((w, i) => (
        <div key={i} className="p-3 border rounded-lg bg-white shadow-sm hover:bg-gray-50">
          <h4 className="font-semibold">{w.term}</h4>
          <p className="text-sm text-gray-600">{w.meaning}</p>
          {w.example && <p className="text-xs text-gray-400 mt-1">예: {w.example}</p>}
        </div>
      ))}
    </div>
  );
}

function CultureNote({ note }: { note: string }) {
  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h4 className="font-semibold mb-2">문화 노트</h4>
      <p className="text-sm text-gray-700">{note}</p>
    </div>
  );
}

const LearningPage = () => {
  const [selected, setSelected] = useState<Dialogue | null>(null);
  const [activeTab, setActiveTab] = useState<'words' | 'culture'>('words');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 영상 플레이어 */}
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-xl">
        🎬 영상 플레이어 (데모)
      </div>

      {/* 자막 리스트 */}
      <div>
        <h2 className="text-xl font-bold mb-2">자막</h2>
        <ul className="space-y-2">
          {initialDialogues.map((d, idx) => (
            <li
              key={idx}
              onClick={() => setSelected(selected?.dialogue === d.dialogue ? null : d)}
              className="p-3 bg-white rounded-lg shadow cursor-pointer hover:bg-primary/5"
            >
              <p className="font-medium">{d.dialogue}</p>
              <p className="text-sm text-gray-500">
                {d.character} · {d.timestamp}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* 학습 카드 */}
      {selected && (
        <div className="p-4 bg-primary/5 rounded-xl shadow-md space-y-4">
          <h3 className="text-lg font-semibold">학습 카드</h3>
          <p>
            <strong>한국어:</strong> {selected.dialogue}
          </p>
          <p>
            <strong>영어:</strong> (자동 번역 자리)
          </p>
          <p>
            <strong>학습 포인트:</strong> {selected.category}
          </p>

          {/* 탭 메뉴 */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('words')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'words' ? 'bg-primary text-white' : 'bg-white text-gray-600 border'
              }`}
            >
              단어 설명
            </button>
            <button
              onClick={() => setActiveTab('culture')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'culture' ? 'bg-primary text-white' : 'bg-white text-gray-600 border'
              }`}
            >
              문화 노트
            </button>
          </div>

          {/* 탭 내용 */}
          {activeTab === 'words' ? (
            <WordExplanation words={selected.words} />
          ) : (
            <CultureNote note={selected.cultureNote} />
          )}

          <button
            onClick={() => setSelected(null)}
            className="mt-3 px-4 py-2 bg-primary text-white rounded-lg"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
};

// 학습 예시 끝 구간입니다.

// 진정한 홈페이지입니다. start
type Stats = {
  due: number; // 오늘 복습 예정 개수
  newWords: number; // 오늘 추가한 단어 수
  streak: number; // 연속 학습 일수
  dailyGoal: number; // 오늘 목표(단어 수)
  completedToday: number; // 오늘 완료(단어 수)
};

const Greeting = ({
  userName = '김민지',
  stats,
}: {
  userName?: string;
  stats?: Partial<Stats>;
}) => {
  const now = new Date();
  const greetingText = getGreeting(now);
  const dateText = formatKoreanDate(now);

  // 데모용 기본값 (실데이터 연결 전까지)
  const { due = 18, newWords = 5, streak = 7, dailyGoal = 20, completedToday = 15 } = { ...stats };

  const progress = Math.min(100, Math.round((completedToday / dailyGoal) * 100));
  const r = 40;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - progress / 100);

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        {/* 좌측: 인사 + 날짜 + 작은 통계칩 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {greetingText}, {userName}님!
          </h1>
          <p className="text-gray-600">{dateText}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <StatPill
              icon={<Clock className="w-4 h-4" />}
              label="오늘 복습 예정"
              value={`${due}개`}
            />
            <StatPill
              icon={<Plus className="w-4 h-4" />}
              label="신규 단어"
              value={`${newWords}개`}
            />
            <StatPill
              icon={<Flame className="w-4 h-4" />}
              label="연속 학습"
              value={`${streak}일`}
            />
          </div>
        </div>

        {/* 우측: 오늘 목표 링 */}
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 mb-3">
            <svg viewBox="0 0 100 100" className="w-24 h-24">
              {/* ↓ 여기 소문자 circle이어야 함! (lucide의 Circle 아이콘 아님) */}
              <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={offset}
                className="text-primary transition-[stroke-dashoffset] duration-500"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-xl font-bold text-primary">{progress}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-600">오늘 목표 {dailyGoal}개</p>
        </div>
      </div>

      {/* 퀵 액션 */}
    </div>
  );
};

const StatPill = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border text-gray-700">
    {icon}
    <span className="text-gray-500">{label}</span>
    <strong className="text-gray-900">{value}</strong>
  </span>
);

const QuickAction = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border rounded-lg hover:bg-gray-50 active:scale-[0.99] transition"
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

function getGreeting(d = new Date()) {
  const h = d.getHours();
  if (h < 6) return '좋은 새벽이에요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

function formatKoreanDate(d = new Date()) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' }).format(d);
}

interface ProgressCardProps {
  title: string;
  episode: string;
  progress: number;
  timeLeft: string;
  color?: string;
  image: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  episode,
  progress,
  timeLeft,
  color = 'primary',
  image,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="aspect-video relative">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-3">{episode}</p>
        <div className="flex items-center justify-between">
          <span className={`text-${color}-500 font-semibold`}>{progress}% 완료</span>
          <span className="text-gray-500 text-sm">{timeLeft} 남음</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className={`bg-${color}-500 h-2 rounded-full`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
const RecentProgress = () => {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">최근 학습 진도</h2>
        <a
          href="#"
          className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          계속 학습하기 <i className="ri-arrow-right-line"></i>
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressCard
          title="우리들의 블루스"
          episode="Episode 5 · Scene 3"
          progress={75}
          timeLeft="15분"
          color="primary"
          image={imgSrc}
        />
        <ProgressCard
          title="놀면 뭐하니?"
          episode="Episode 2 · Scene 1"
          progress={30}
          timeLeft="25분"
          color="orange"
          image={imgSrc}
        />
        <ProgressCard
          title="기생충"
          episode="Episode 1 · Scene 2"
          progress={60}
          timeLeft="20분"
          color="green"
          image={imgSrc}
        />
      </div>
    </section>
  );
};

const imgSrc = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d';

interface RecommendationCardProps {
  title: string;
  episode: string;
  duration: string;
  recommendRate: string;
  image: string;
  badge?: { text: string; color: string };
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  title,
  episode,
  duration,
  recommendRate,
  image,
  badge,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="aspect-video relative">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        {badge && (
          <div
            className={`absolute top-3 left-3 bg-${badge.color}-500 text-white px-2 py-1 rounded text-xs font-semibold`}
          >
            {badge.text}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{episode}</p>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <i className="ri-time-line"></i>
            {duration}
          </span>
          <span className="flex items-center gap-1">
            <i className="ri-eye-line"></i>
            {recommendRate} 추천
          </span>
        </div>
      </div>
    </div>
  );
};
const Recommendations = () => {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">오늘의 추천</h2>
        <a
          href="#"
          className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          더보기 <i className="ri-arrow-right-line"></i>
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RecommendationCard
          title="도깨비"
          episode="Episode 1 · Scene 4"
          duration="8분"
          recommendRate="94%"
          image={imgSrc}
          badge={{ text: 'NEW', color: 'primary' }}
        />
        <RecommendationCard
          title="무한도전"
          episode="Episode 3 · Scene 2"
          duration="12분"
          recommendRate="86%"
          image={imgSrc}
        />
        <RecommendationCard
          title="KBS 뉴스"
          episode="Episode 2 · Scene 1"
          duration="15분"
          recommendRate="92%"
          image={imgSrc}
          badge={{ text: 'LIVE', color: 'red' }}
        />
      </div>
    </section>
  );
};

const HomePage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Greeting />
        <RecentProgress />
        <Recommendations />
        {/* 오늘의 추천 컴포넌트도 같은 방식으로 구성 */}
        <section className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">주간 학습 통계</h3>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">학습 분야별 진행도</h3>
          </div>
        </section>
      </main>
    </div>
  );
};

// 진정한 홈페이지입니다. end

const App = () => {
  const [a, setA] = useState('');
  return (
    <PostProvider>
      <Router>
        {/* <div className="min-h-screen flex flex-col bg-[#f9fbf9]"> */}
        {/* 공통 헤더 */}
        <TopHeader />

        <main className="flex-1 pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<LandingPage />}></Route>
            <Route path="/landing" element={<LandingPage />}></Route>
            <Route path="/signup" element={<SignUpPage />}></Route>
            <Route path="/signin" element={<SignInPage />}></Route>
            <Route path="/profile" element={<ProfilePage />}></Route>
            <Route path="/studyList" element={<StudyListPage />}></Route>
            <Route path="/study" element={<StudyPage />}></Route>
            <Route path="/voca" element={<VocaPage />}></Route>
            <Route path="/communitywrite" element={<CommunityWritePage />}></Route>
            <Route path="/communitylist" element={<CommunityListPage />}></Route>
            <Route path="/communitydetail/:id" element={<CommunityDetailPage />}></Route>
            <Route path="/notfound" element={<NotFound />}></Route>
          </Routes>
        </main>

        {/* <Footer /> */}
        <div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden />
        {/* </div> */}
      </Router>
    </PostProvider>
  );
};

export default App;

import { Badge, Film, Languages, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from './TempHomePage';
import { useAuth } from '@/contexts/AuthContext';

type HeroProps = {
  onSignup?: () => void;
};

const Hero = ({ onSignup }: HeroProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleClick = () => {
    if (user) {
      // 로그인 상태 → /social 이동
      navigate('/socialss');
    } else {
      // 로그아웃 상태 → /test 이동
      navigate('/signin');
    }
  };

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
          <div className="flex gap-4">
            <button
              onClick={handleClick}
              className="px-8 py-4 bg-primary text-white rounded-[8px] text-lg font-medium"
            >
              시작하기
            </button>
            {/* <button
              onClick={() => navigate('/studylist')}
              className="px-8 py-4 bg-primary text-white rounded-[8px] text-lg font-medium"
            >
              둘러보기
            </button> */}
          </div>
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
      id: 1,
      level: '초급',
      title: '사랑의 불시착',
      subtitle: '운명적인 만남으로 시작되는 달달한 로맨스',
      image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/wgwl0HLr2SfLshntt0krZgu7GWn.jpg',
      time: '5분',
      meta: '20개 대화',
    },
    {
      id: 2,
      level: '중급',
      title: '런닝맨',
      subtitle: '재미있는 예능 속 다양한 한국어 표현',
      image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/3SRAHhwS8B08GnjkRR4Otf8kEWK.jpg',
      time: '8분',
      meta: '30개 대화',
    },
    {
      id: 3,
      level: '고급',
      title: '기생충',
      subtitle: '긴장감 넘치는 스토리 속 고급 한국어',
      image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg',
      time: '10분',
      meta: '40개 대화',
    },
    {
      id: 4,
      level: '고급',
      title: '자이언트',
      subtitle: '악역의 명대사로 배우는 고급 한국어',
      image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/oYXxJqTEBL10zIgLlyb4K1PQEKM.jpg',
      time: '10분',
      meta: '17개 대화',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-4">인기 학습 콘텐츠</h2>
        <p className="text-gray-600 text-center mb-12">많은 학습자들이 선택한 인기 콘텐츠</p>
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
        </div> */}

        <div className="grid-cards">
          {contents.map(course => (
            <Link key={course.id} to={`/courses/${course.id}`}>
              <Card
                id={course.id}
                image={course.image}
                title={course.title}
                subtitle={course.subtitle}
                meta={`${course.time} · ${course.meta}`}
              />
            </Link>
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
  const navigate = useNavigate();
  return (
    <section className="py-20 bg-primary/5">
      <div className="max-w-screen-xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
        <p className="text-gray-600 mb-8">재미있고 효과적인 한국어 학습이 여러분을 기다립니다</p>
        {/* <button
          onClick={() => navigate('/home')}
          className="px-8 py-4 bg-primary text-white rounded-[8px] text-lg font-medium"
        >
          무료로 시작하기
        </button> */}

        {/* <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/test')}
            className="px-8 py-4 bg-primary text-white rounded-[8px] text-lg font-medium"
          >
            시작하기
          </button>
          <button
            onClick={() => navigate('/studylist')}
            className="px-8 py-4 bg-primary text-white rounded-[8px] text-lg font-medium"
          >
            둘러보기
          </button>
        </div> */}
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
      {/* <Features /> */}

      {/* 인기 콘텐츠 */}
      {/* <ContentGrid /> */}

      {/* 학습 후기 */}
      {/* <Testimonials /> */}

      {/* CTA */}
      <CTA onSignup={onSignup} />

      {/* 탭/사이드바 포함 메인 콘텐츠 영역 */}
      {/* <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-8 pb-24">
      </div> */}
    </main>
  );
};

export default LandingPage;

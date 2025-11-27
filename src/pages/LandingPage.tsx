import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Languages, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

import { useAuth } from '@/contexts/AuthContext';
import GuideModal, { isGuideModalDismissed } from '@/components/common/GuideModal';
import { Card } from './TempHomePage';

type HeroProps = {
  onSignup?: () => void;
};

const Hero = ({ onSignup }: HeroProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = () => {
    if (onSignup) {
      onSignup();
      return;
    }

    if (user) {
      navigate('/finalhome');
    } else {
      navigate('/signin');
    }
  };

  return (
    <motion.section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-white to-sky-50 min-h-screen flex items-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* 부드러운 배경 장식 */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="w-full max-w-screen-xl mx-auto px-6 pt-24 pb-20 flex flex-col lg:flex-row items-center gap-12">
        {/* 왼쪽 텍스트 영역 */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          {/* 상단 작은 배지 */}
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/70 px-3 py-1 text-[11px] font-medium text-primary shadow-sm backdrop-blur mx-auto lg:mx-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            K-콘텐츠 기반 한국어 학습 플랫폼
          </motion.div>

          <h1 className="max-w-xl mx-auto lg:mx-0 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-gray-900 break-keep">
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
              콘텐츠로 언어를 배우고
            </span>
            <br className="hidden sm:block" />{' '}
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
              문화로 연결되는 경험
            </span>
          </h1>

          <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 break-keep">
            드라마, 예능, 영화 장면으로 배우는 살아있는 표현들.
            <br className="hidden md:block" />전 세계 친구들과 함께 쓰고, 고치고, 나누는 한국어 학습
            공간 ARA
          </p>

          {/* 핵심 포인트 3개 */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 text-[11px] sm:text-sm text-gray-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm border border-gray-100">
              <Film className="w-4 h-4 text-primary" />
              실제 드라마·예능 장면
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm border border-gray-100">
              <Languages className="w-4 h-4 text-primary" />
              다국어 번역
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm border border-gray-100">
              <Users className="w-4 h-4 text-primary" />
              글로벌 학습 커뮤니티
            </span>
          </div>

          {/* CTA 영역 */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            <button
              onClick={handleClick}
              className="inline-flex items-center justify-center rounded-[10px] bg-primary px-7 py-3 text-sm sm:text-base font-semibold text-white shadow-md shadow-primary/30 transition hover:-translate-y-[1px] hover:bg-primary/90"
            >
              바로 시작하기
            </button>
            <button
              type="button"
              onClick={() => navigate('/studylist')}
              className="inline-flex items-center justify-center rounded-[10px] border border-primary/20 bg-white/80 px-6 py-3 text-xs sm:text-sm font-medium text-primary shadow-sm backdrop-blur transition hover:bg-primary/5"
            >
              콘텐츠 둘러보기
            </button>
          </div>
        </div>

        {/* 오른쪽 이미지 / 카드 영역 */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <motion.div
            className="relative w-full max-w-[360px] sm:max-w-[400px]"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* 메인 일러스트 카드 */}
            <div className="relative rounded-3xl bg-white/80 p-4 sm:p-5 shadow-xl shadow-sky-100 border border-white/80 backdrop-blur">
              <div className="overflow-hidden rounded-2xl bg-gray-100">
                <img
                  src="https://readdy.ai/api/search-image?query=korean%20learning%20concept%2C%20modern%20illustration%2C%20person%20studying%20with%20laptop%2C%20books%20and%20korean%20text%2C%20high%20quality%20digital%20art&width=600&height=600&seq=1&orientation=squarish"
                  alt="Korean Learning"
                  className="w-full h-auto object-cover"
                  draggable={false}
                />
              </div>

              {/* 작은 정보 바 */}
              <div className="mt-4 space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-gray-700">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] sm:text-xs font-medium text-primary">
                    LIVE
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    지금 128명이 함께 학습 중
                  </span>
                </div>
                <p className="text-gray-800 font-medium text-sm break-keep">
                  &ldquo;이 장면에서 한국인은 이렇게 말해요&rdquo;
                </p>
                <p className="text-[11px] text-gray-500 break-keep">
                  대사·표현·문화까지 한 번에 정리된 대화 스크립트로 배우는 한국어.
                </p>
              </div>
            </div>

            {/* 떠 있는 작은 카드들 */}
            <motion.div
              className="absolute -right-6 top-8 hidden sm:block"
              animate={{ y: [2, -2, 2] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="rounded-2xl bg-white/90 px-4 py-3 text-[11px] shadow-lg border border-gray-100">
                <div className="font-medium text-gray-700 mb-1">오늘의 표현</div>
                <div className="text-[10px] text-gray-500">
                  &ldquo;설레다&rdquo; · &ldquo;막상막하&rdquo;
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* 스크롤 유도 인디케이터 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center text-[11px] text-gray-400">
        <span>Scroll to explore</span>
        <span className="mt-1 animate-bounce text-lg">⌄</span>
      </div>
    </motion.section>
  );
};

// 사용자 고민 섹션 – 말풍선 느낌
const ProblemSection = () => {
  const problems = [
    '자막 없이 드라마를 보고 싶은데, 어휘가 잘 안 외워져요.',
    '교과서 표현과 실제 사람들이 쓰는 말이 너무 달라요.',
    '배운 표현을 써보고 싶은데, 쓸 곳이 마땅치 않아요.',
    '내 수준에 딱 맞는 콘텐츠를 찾기가 너무 어려워요.',
    '혼자 공부하니까 동기부여가 금방 떨어져요.',
  ];

  return (
    <motion.section
      id="problems"
      className="bg-sky-50/40 min-h-screen flex items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-screen-xl mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 break-keep">
            혹시 이런 고민, 해본 적 있나요?
          </h2>
          <p className="text-gray-600 text-sm md:text-base break-keep">
            ARA는 실제 학습자들이 가장 많이 이야기한 고민에서 출발했습니다.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {problems.map((text, idx) => (
            <div key={text} className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <motion.div
                className="max-w-[80%] rounded-2xl bg-white px-4 py-3 text-sm text-left shadow-sm border border-sky-100"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ amount: 0.4, once: true }}
                transition={{ duration: 0.4, delay: 0.05 * idx }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">learner #{idx + 1}</span>
                  <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-[2px] text-[10px] text-sky-700 border border-sky-100">
                    real 고민
                  </span>
                </div>
                <p className="text-gray-800 break-keep">{text}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// ARA 핵심 특징 – 타임라인 구조 (동그라미 제거, 막대만)
const SolutionSection = () => {
  const items = [
    {
      title: '장면 중심 학습',
      desc: '드라마·예능 한 장면을 기준으로 어휘, 표현, 문화까지 한 번에 정리합니다.',
    },
    {
      title: '사용하면서 배우는 구조',
      desc: '피드·DM에서 실제로 표현을 쓰고, AI가 자연스러운 문장으로 다듬어 줍니다.',
    },
    {
      title: '글로벌 커뮤니티',
      desc: '다른 나라 친구들의 모국어와 한국어가 섞인 타임라인에서 자연스럽게 언어 감각을 키웁니다.',
    },
  ];

  return (
    <motion.section
      id="features"
      className="bg-white min-h-screen flex items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-screen-xl mx-auto px-6 py-20 grid gap-10 md:gap-16 md:grid-cols-[0.75fr,1.25fr] items-start">
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 break-keep">왜 ARA인가요?</h2>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed break-keep">
            단어만 외우는 학습이 아니라,
            <span className="font-semibold"> 콘텐츠 속 흐름과 감정까지 함께 기억되는 학습</span>
            을 목표로 만들었습니다.
            <br />
            학습과 커뮤니티, 두 가지 경험이 한 화면 안에서 자연스럽게 이어지도록 설계했어요.
          </p>
        </div>

        <div className="relative">
          {/* 타임라인 라인 (동그라미 제거) */}
          <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/40 via-sky-200 to-transparent" />
          <div className="space-y-8">
            {items.map((item, index) => (
              <motion.div
                key={item.title}
                className="relative pl-8"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ amount: 0.3, once: true }}
                transition={{ duration: 0.4, delay: 0.06 * index }}
              >
                <div className="rounded-2xl bg-gray-50 px-4 py-3 md:px-5 md:py-4 shadow-sm border border-gray-100">
                  <div className="text-xs uppercase tracking-[0.12em] text-primary/70 mb-1">
                    feature 0{index + 1}
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1.5 break-keep">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed break-keep">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

// 인기 콘텐츠 – Swiper 슬라이드 (드래그, 네비, 페이지네이션 / 자동슬라이드 X)
const PopularContentSection = () => {
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

  const navigate = useNavigate();

  return (
    <motion.section
      id="contents"
      className="bg-sky-50/60 min-h-screen flex items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-screen-xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-keep">
              이런 콘텐츠로 배우게 돼요
            </h2>
            <p className="text-gray-600 text-sm md:text-base break-keep">
              실제로 많은 학습자들이 선택한 K-콘텐츠들을 기반으로 학습 플로우가 구성됩니다.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-white/90 px-3 py-1 text-xs text-gray-500 border border-sky-100">
            오늘 업데이트된 장면 · <span className="font-semibold text-primary">+12</span>
          </span>
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination]}
            loop={false}
            grabCursor
            slidesPerView={1}
            spaceBetween={16}
            speed={450}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
            }}
            pagination={{ clickable: true }}
            navigation={{
              prevEl: '.pop-prev',
              nextEl: '.pop-next',
            }}
            onBeforeInit={swiper => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (swiper.params.navigation as any).prevEl = '.pop-prev';
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (swiper.params.navigation as any).nextEl = '.pop-next';
            }}
            style={
              {
                '--swiper-pagination-color': 'rgb(0,191,165)',
              } as any
            }
            className="w-full"
          >
            {contents.map(course => (
              <SwiperSlide key={course.id} className="pb-10">
                <div
                  className="h-full cursor-pointer"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <Card
                    id={course.id}
                    image={course.image}
                    title={course.title}
                    subtitle={course.subtitle}
                    meta={`${course.time} · ${course.meta}`}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* ✅ 커스텀 화살표 버튼 – 디자인 + z-index 업 */}
          <button
            type="button"
            className="pop-prev absolute -left-9 top-1/2 -translate-y-1/2 hidden md:flex
             h-12 w-12 items-center justify-center
             rounded-full bg-white/95 shadow-lg border border-primary/20
             text-primary text-2xl leading-none
             hover:bg-primary hover:text-white hover:shadow-xl
             transition-all duration-200 z-20 backdrop-blur"
          >
            ‹
          </button>
          <button
            type="button"
            className="pop-next absolute -right-9 top-1/2 -translate-y-1/2 hidden md:flex
             h-12 w-12 items-center justify-center
             rounded-full bg-white/95 shadow-lg border border-primary/20
             text-primary text-2xl leading-none
             hover:bg-primary hover:text-white hover:shadow-xl
             transition-all duration-200 z-20 backdrop-blur"
          >
            ›
          </button>
        </div>
      </div>
    </motion.section>
  );
};

// 후기 섹션 – Swiper 슬라이드 (드래그 + 페이지네이션 + 부드러운 자동슬라이드)
const TestimonialsSection = () => {
  const users = [
    {
      name: 'Sarah Johnson',
      country: '미국 · US',
      text: '드라마로 배우니까 실제 한국인들이 쓰는 표현을 자연스럽게 익힐 수 있어서 좋아요. 특히 자막과 해설이 정말 도움이 됩니다.',
    },
    {
      name: 'Maria Garcia',
      country: '스페인 · ES',
      text: '커뮤니티에서 다른 학습자들과 교류하면서 많이 배우고 있어요. 서로 도와가며 공부하니 더 재미있네요!',
    },
    {
      name: 'Alex Chen',
      country: '싱가포르 · SG',
      text: '체계적인 커리큘럼과 다양한 콘텐츠 덕분에 꾸준히 실력이 늘고 있어요. 특히 발음 교정 기능이 큰 도움이 됩니다.',
    },
  ];

  return (
    <motion.section
      id="testimonials"
      className="bg-white min-h-screen flex items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-screen-xl mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 break-keep">
            ARA를 먼저 경험한 학습자들의 이야기
          </h2>
          <p className="text-gray-600 text-sm md:text-base break-keep">
            단순한 후기가 아니라, ARA를 통해 일상의 한국어가 어떻게 달라졌는지 담았습니다.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={users.length > 1}
            grabCursor
            slidesPerView={1}
            speed={450}
            style={
              {
                '--swiper-pagination-color': 'rgb(0,191,165)',
              } as any
            }
            className="w-full"
          >
            {users.map(user => (
              <SwiperSlide key={user.name} className="pb-8">
                <div className="relative rounded-2xl bg-gray-50 px-5 py-6 shadow-sm border border-gray-100">
                  <div className="absolute -top-3 left-5 text-3xl text-primary/20">&ldquo;</div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-sky-400 text-white flex items-center justify-center text-sm font-semibold">
                      {user.name.split(' ')[0][0]}
                      {user.name.split(' ')[1]?.[0] ?? ''}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                      <p className="text-[11px] text-gray-500">{user.country}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed break-keep">
                    &quot;{user.text}&quot;
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </motion.section>
  );
};

type CTAProps = {
  onSignup?: () => void;
};

const CTASection = ({ onSignup }: CTAProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onSignup) {
      onSignup();
      return;
    }
    navigate('/signin');
  };

  return (
    <motion.section
      id="cta"
      className="bg-gradient-to-b from-sky-50 to-white min-h-screen flex items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-screen-xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs text-gray-500 border border-gray-100 mb-4">
          오늘 가입한 학습자 <span className="font-semibold text-primary">+42</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 break-keep">
          한국어를 &apos;공부&apos;가 아니라
          <br />
          <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
            &apos;경험&apos;으로 시작해 보세요
          </span>
        </h2>
        <p className="text-gray-600 mb-8 text-sm md:text-base max-w-xl mx-auto break-keep">
          지금 가입하면, 가장 인기 있는 드라마 장면으로 만드는 나만의 첫 번째 학습 코스를 바로
          시작할 수 있어요.
        </p>
        <button
          onClick={handleClick}
          className="inline-flex items-center justify-center rounded-[10px] bg-primary px-9 py-3 text-base font-semibold text-white shadow-md shadow-primary/30 transition hover:-translate-y-[1px] hover:bg-primary/90"
        >
          무료로 시작하기
        </button>
      </div>
    </motion.section>
  );
};

type HomeProps = {
  onSignup?: () => void;
};

const LANDING_GUIDE_KEY = 'ara-landing-guide';

const LANDING_GUIDE_SLIDES = [
  { id: 'landing-1', image: '/images/landing_guide_1.png', alt: 'ARA 이용 방법 안내 1' },
  { id: 'landing-2', image: '/images/landing_guide_2.png', alt: 'ARA 이용 방법 안내 2' },
  { id: 'landing-3', image: '/images/landing_guide_3.png', alt: 'ARA 이용 방법 안내 3' },
  { id: 'landing-4', image: '/images/landing_guide_4.gif', alt: 'ARA 이용 방법 안내 4' },
  { id: 'landing-5', image: '/images/landing_guide_5.gif', alt: 'ARA 이용 방법 안내 5' },
  { id: 'landing-6', image: '/images/landing_guide_6.png', alt: 'ARA 이용 방법 안내 6' },
];

type SectionId = 'hero' | 'problems' | 'features' | 'contents' | 'testimonials' | 'cta';

// 오른쪽 섹션 미니 내비 + 상단 진행 바 + 풀페이지 스크롤
const LandingPage = ({ onSignup }: HomeProps) => {
  const [showGuide, setShowGuide] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const isScrollingRef = useRef(false);

  const sectionOrder: SectionId[] = [
    'hero',
    'problems',
    'features',
    'contents',
    'testimonials',
    'cta',
  ];

  useEffect(() => {
    if (!isGuideModalDismissed(LANDING_GUIDE_KEY)) {
      setShowGuide(true);
    }
  }, []);

  // 스크롤 진행도 + 현재 섹션 계산
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setScrollProgress(progress);

      let current: SectionId = 'hero';
      let minDelta = Infinity;

      sectionOrder.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const delta = Math.abs(rect.top - 80);
        if (delta < minDelta) {
          minDelta = delta;
          current = id;
        }
      });

      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionOrder]);

  // 휠 한 번에 한 섹션 이동
  useEffect(() => {
    const wheelHandler = (e: WheelEvent) => {
      const deltaY = e.deltaY;
      if (Math.abs(deltaY) < 30) return;

      e.preventDefault();
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;

      const currentIndex = sectionOrder.indexOf(activeSection);
      let nextIndex = currentIndex;

      if (deltaY > 0 && currentIndex < sectionOrder.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (deltaY < 0 && currentIndex > 0) {
        nextIndex = currentIndex - 1;
      }

      const targetId = sectionOrder[nextIndex];
      const el = document.getElementById(targetId);
      if (el) {
        const top = el.offsetTop;
        window.scrollTo({ top, behavior: 'smooth' });
      }

      window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 600);
    };

    window.addEventListener('wheel', wheelHandler as any, { passive: false });
    return () => window.removeEventListener('wheel', wheelHandler as any);
  }, [activeSection, sectionOrder]);

  const scrollToSection = (id: SectionId) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.offsetTop;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <main className="relative">
      {/* 상단 스크롤 진행 바 */}
      <div className="fixed left-0 top-0 z-40 w-full h-0.5 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-primary via-sky-400 to-emerald-400 transition-[width]"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* 오른쪽 섹션 미니 내비 */}
      <div className="fixed right-4 top-1/2 z-30 -translate-y-1/2 hidden lg:flex flex-col gap-3">
        {[
          { id: 'hero' as SectionId, label: 'Top' },
          { id: 'problems' as SectionId, label: 'Problems' },
          { id: 'features' as SectionId, label: 'Features' },
          { id: 'contents' as SectionId, label: 'Contents' },
          { id: 'testimonials' as SectionId, label: 'Stories' },
          { id: 'cta' as SectionId, label: 'Start' },
        ].map(({ id, label }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className="group relative flex items-center justify-end"
            >
              <span className="mr-2 hidden text-[11px] text-gray-500 group-hover:inline">
                {label}
              </span>
              <span
                className={`h-2.5 rounded-full transition-all ${
                  isActive
                    ? 'w-5 bg-primary'
                    : 'w-2 bg-gray-300 group-hover:w-3 group-hover:bg-primary/60'
                }`}
              />
            </button>
          );
        })}
      </div>

      <GuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        slides={LANDING_GUIDE_SLIDES}
        storageKey={LANDING_GUIDE_KEY}
      />

      <Hero onSignup={onSignup} />
      <ProblemSection />
      <SolutionSection />
      <PopularContentSection />
      <TestimonialsSection />
      <CTASection onSignup={onSignup} />
    </main>
  );
};

export default LandingPage;

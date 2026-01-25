import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

type SlideItem = {
  id: string | number;
  title: string;
  subtitle?: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaPath?: string;
  thumbnail: string;
  alt?: string;
};

const SLIDES: SlideItem[] = [
  {
    id: 'preview',
    title: '이야기로 배우는 한국어 표현',
    subtitle: '상황 속 대화로 표현과 뉘앙스를 자연스럽게',
    bullets: ['대화 → 표현 이해', '사용 상황 & 문화 팁', '짧은 연습 문제 포함'],
    ctaLabel: '에피소드 미리보기',
    ctaPath: '/studyList',
    thumbnail: '/images/right_slider_1.png',
    alt: '이야기 기반 에피소드 학습 화면',
  },
  {
    id: 'folktale',
    title: '전래동화·설화로 만나는 한국어',
    subtitle: '옛이야기를 현대 한국어로 다시 읽어요',
    bullets: ['전래동화 & 설화 콘텐츠', '표현 속 문화와 배경 설명', '입문자용 추천 묶음'],
    ctaLabel: '동화 콘텐츠 미리보기',
    ctaPath: '/studyList',
    thumbnail: '/images/right_slider_2.jpg',
    alt: '한국 전래동화 및 설화 학습 콘텐츠',
  },
  {
    id: 'community',
    title: '전 세계 친구들과 함께 연습',
    subtitle: '여러 언어권 학습자와 문장을 나누고 피드백을 받아요',
    bullets: ['다국어 사용자 커뮤니티', '짧은 문장 교류', '표현/문화 팁 공유'],
    ctaLabel: '커뮤니티 미리보기',
    ctaPath: '/finalhome',
    thumbnail: '/images/right_slider_3.png',
    alt: '글로벌 커뮤니티 활동 예시',
  },
];

export default function RightHeroSlider() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[360px] sm:max-w-[420px] max-h-[520px]">
      <div
        className="
      relative rounded-[26px]
      bg-white/[0.06] dark:bg-white/[0.03]
      border border-black/[0.04] dark:border-white/[0.06]
      backdrop-blur-[10px]
      shadow-[0_10px_30px_rgba(0,0,0,0.05)]
      p-[6px] sm:p-2
      overflow-hidden
    "
      >
        {/* 슬라이드(움직이는 내용) */}
        <div className="relative">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{
              delay: 4500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            style={
              {
                '--swiper-pagination-color': '#00bfa5',
                '--swiper-pagination-bullet-inactive-color': '#9ca3af',
                '--swiper-pagination-bullet-inactive-opacity': '0.5',
              } as React.CSSProperties
            }
            className="hero-slider"
            pagination={{ clickable: true }}
            loop
            aria-live="polite"
          >
            {SLIDES.map((s, idx) => (
              <SwiperSlide key={s.id}>
                <article
                  className="
                relative rounded-3xl
               
                p-4 sm:p-5
          
                flex flex-col h-full
              "
                  aria-labelledby={`hero-slide-title-${s.id}`}
                >
                  <div className="relative w-full h-48 xs:h-56 sm:h-60 md:h-64 overflow-hidden rounded-2xl bg-gray-100 dark:bg-background/70">
                    <img
                      src={s.thumbnail}
                      alt={s.alt ?? s.title}
                      className="w-full h-full object-cover"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      draggable={false}
                    />
                  </div>

                  <div className="mt-4">
                    <h3
                      id={`hero-slide-title-${s.id}`}
                      className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100"
                    >
                      {s.title}
                    </h3>

                    {s.subtitle && (
                      <p className="text-[12px] sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {s.subtitle}
                      </p>
                    )}

                    {s.bullets && (
                      <ul className="mt-3 text-[12px] text-gray-600 flex flex-col justify-center dark:text-gray-300 space-y-1">
                        {s.bullets.slice(0, 3).map((b, idx2) => (
                          <li key={idx2} className="flex items-start gap-2">
                            <span className="mt-0.5 inline-block w-2 h-2 rounded-full bg-primary" />
                            <span className="-translate-y-1">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(s.ctaPath ?? '/studylist')}
                        className="inline-flex items-center justify-center rounded-[10px] bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-primary/90"
                        aria-label={s.ctaLabel ?? '자세히 보기'}
                      >
                        {s.ctaLabel ?? '자세히 보기'}
                      </button>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
}

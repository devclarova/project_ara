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
    title: '드라마 장면으로 배우는 표현',
    subtitle: '실제 대사와 자막, 상황 설명을 한눈에',
    bullets: ['대사 → 표현 해석', '사용 상황 & 문화 팁', '짧은 연습 문제 포함'],
    ctaLabel: '학습 미리보기',
    ctaPath: '/studyList',
    thumbnail: '/images/right_slider_1.png',
    alt: '드라마 장면 기반 학습 화면 미리보기',
  },
  {
    id: 'popular',
    title: '지금 가장 많이 보는 콘텐츠',
    subtitle: '다른 학습자들이 자주 듣는 코스를 한 번에',
    bullets: ['레벨별 인기 코스', '짧게 끝나는 영상 모음', '입문자용 추천 묶음'],
    ctaLabel: '인기 콘텐츠 보기',
    ctaPath: '/studyList',
    thumbnail: '/images/right_slider_2.jpg',
    alt: '인기 학습 콘텐츠 썸네일',
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
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{
          delay: 4500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true, // ✅ 추가
        }}
        style={
          {
            '--swiper-pagination-color': '#00bfa5', // 활성화된 dot 색상
            '--swiper-pagination-bullet-inactive-color': '#9ca3af', // 비활성 dot
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
              className="relative rounded-3xl bg-white/95 dark:bg-secondary p-4 sm:p-5 border border-white/60 dark:border-slate-700 flex flex-col h-full"
              aria-labelledby={`hero-slide-title-${s.id}`}
            >
              <div className="relative w-full h-48 xs:h-56 sm:h-60 md:h-64 overflow-hidden rounded-2xl bg-gray-100 dark:bg-background/70">
                <img
                  src={s.thumbnail}
                  alt={s.alt ?? s.title}
                  className="w-full h-full object-cover"
                  loading={idx === 0 ? "eager" : "lazy"}
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
                    {s.bullets.slice(0, 3).map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
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
  );
}

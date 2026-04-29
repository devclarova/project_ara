import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import 'swiper/css';
import 'swiper/css/pagination';

const GUIDE_SLIDES = [
  { id: 1, image: '/images/landing_guide_1.png' },
  { id: 2, image: '/images/landing_guide_2.png' },
  { id: 3, image: '/images/landing_guide_3.png' },
  { id: 4, image: '/images/landing_guide_4.gif' },
  { id: 5, image: '/images/landing_guide_5.gif' },
  { id: 6, image: '/images/landing_guide_6.png' },
];

export default function HowItWorksSection() {
  const { t } = useTranslation();
  const swiperRef = useRef<any>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // ✅ 섹션이 화면에 등장하면 슬라이드 초기화
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && swiperRef.current) {
          swiperRef.current.slideTo(0);
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.section
      id="how-it-works"
      ref={sectionRef}
      className="relative overflow-hidden min-h-[calc(100vh-100px)] flex items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* 배경 장식 */}

      {/* 🔧 히어로와 동일한 패딩으로 조정 */}
      <div className="w-full max-w-screen-xl mx-auto px-6 pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            {t('landing.how_it_works_badge')}
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900 dark:text-gray-100 break-keep">
            {t('landing.how_it_works_title')}
          </h2>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          style={
            {
              '--swiper-pagination-color': '#00bfa5',
              '--swiper-pagination-bullet-inactive-color': '#9ca3af',
              '--swiper-pagination-bullet-inactive-opacity': '0.5',
            } as React.CSSProperties
          }
          pagination={{ clickable: true }}
          loop
          slidesPerView={1}
          className="w-full max-w-[900px] mx-auto"
          onSwiper={swiper => (swiperRef.current = swiper)}
        >
          {GUIDE_SLIDES.map(slide => (
            <SwiperSlide key={slide.id} className="pb-10">
              <div className="w-full flex justify-center">
                <div className="inline-flex items-center justify-center rounded-3xl bg-white/95 dark:bg-secondary/80 shadow-md border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
                  <img
                    src={slide.image}
                    alt={t('landing.guide_alt', { index: slide.id })}
                    className="block h-auto max-h-[520px] max-w-[80vw] sm:max-w-[560px] object-contain dark:brightness-90"
                    draggable={false}
                  />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </motion.section>
  );
}

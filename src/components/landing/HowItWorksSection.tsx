import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useEffect, useRef } from 'react';

import 'swiper/css';
import 'swiper/css/pagination';

const GUIDE_SLIDES = [
  { id: 1, image: '/images/landing_guide_1.png', alt: 'ARA 가이드 1' },
  { id: 2, image: '/images/landing_guide_2.png', alt: 'ARA 가이드 2' },
  { id: 3, image: '/images/landing_guide_3.png', alt: 'ARA 가이드 3' },
  { id: 4, image: '/images/landing_guide_4.gif', alt: 'ARA 가이드 4' },
  { id: 5, image: '/images/landing_guide_5.gif', alt: 'ARA 가이드 5' },
  { id: 6, image: '/images/landing_guide_6.png', alt: 'ARA 가이드 6' },
];

export default function HowItWorksSection() {
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
      className="relative overflow-hidden min-h-[calc(100vh-100px)] flex items-center bg-white dark:bg-background"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/25" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/40" />

      {/* 🔧 히어로와 동일한 패딩으로 조정 */}
      <div className="w-full max-w-screen-xl mx-auto px-6 pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            HOW IT WORKS
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900 dark:text-gray-100 break-keep">
            ARA 학습 흐름이 이렇게 진행돼요
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
                    alt={slide.alt}
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

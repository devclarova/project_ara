import { Swiper } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import type { ReactNode } from 'react';

type BaseCarouselProps = {
  children: ReactNode;
  slidesPerView?: number;
  spaceBetween?: number;
  autoplay?: boolean;
  loop?: boolean;
  className?: string;
};

export default function BaseCarousel({
  children,
  slidesPerView = 1,
  spaceBetween = 16,
  autoplay = false,
  loop = false,
  className = '',
}: BaseCarouselProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <Swiper
        modules={[Pagination, Autoplay]}
        loop={loop}
        slidesPerView={slidesPerView}
        spaceBetween={spaceBetween}
        speed={500}
        grabCursor
        pagination={{ clickable: true }}
        autoplay={
          autoplay
            ? {
                delay: 4500,
                disableOnInteraction: false,
              }
            : undefined
        }
        // ✅ 반응형 레이아웃 변경 시 강제로 다시 계산하도록
        observer
        observeParents
        observeSlideChildren
        onResize={swiper => {
          // Swiper가 devtools로 viewport를 줄였을 때도 즉시 width 다시 계산
          swiper.update();
        }}
        style={
          {
            '--swiper-pagination-color': 'rgb(0,191,165)',
          } as any
        }
        className="w-full max-w-full"
      >
        {children}
      </Swiper>
    </div>
  );
}

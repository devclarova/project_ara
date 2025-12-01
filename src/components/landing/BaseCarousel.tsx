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
  swiperClassName?: string;
};

export default function BaseCarousel({
  children,
  slidesPerView = 1,
  spaceBetween = 16,
  autoplay = false,
  loop = false,
  className = '',
  swiperClassName = '',
}: BaseCarouselProps) {
  return (
    <div className={`relative w-full group ${className}`}>
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
                pauseOnMouseEnter: true, // ✅ 바로 이 기능!
              }
            : undefined
        }
        observer
        observeParents
        observeSlideChildren
        onResize={swiper => swiper.update()}
        style={
          {
            '--swiper-pagination-color': 'rgb(0,191,165)',
          } as any
        }
        className={`w-full max-w-full landing-swiper ${swiperClassName}`}
      >
        {children}
      </Swiper>
    </div>
  );
}

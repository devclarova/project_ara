/**
 * 플로팅 상단 이동 인터랙션 유닛(Floating Scroll-to-Top Interaction Unit):
 * - 목적(Why): 긴 페이지 탐색 시 사용자가 즉각적으로 페이지 최상단으로 복귀할 수 있는 편의 기능을 제공함
 * - 방법(How): 윈도우 스크롤 옵저버를 통해 특정 임계값(300px) 초과 시 버튼을 노출하며, 부드러운 스크롤링(Smooth Scrolling) API를 호출하여 시각적 연속성을 유지함
 */
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  className?: string;
}

export default function ScrollToTopButton({ className }: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Threshold Visibility: Toggles the floating button display state upon reaching the 300px vertical scroll offset.
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    // Graphic Normalization: Defines vector-based silhouettes for optimal clarity across high-DPI displays.
    const premiumPath = "M23 10c-3 0-5.5 2.5-7.5 5-2-4-4-7.5-8.5-7.5-3.5 0-6.5 2.5-8 5.5l-.5 2c2-3 5-5 8.5-5 4 0 6.5 3.5 7.5 8 1-4.5 3.5-8 7.5-8l-.5 2c-.1.3-.5.5-.5.5z";
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed z-50
        flex items-center justify-center w-12 h-12
        rounded-full shadow-lg transition-all duration-300
        bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm
        dark:bg-white/20 dark:hover:bg-white/30 dark:text-white
        hover:-translate-y-1
        ${className || 'bottom-10 right-10'}
      `}
      aria-label="맨 위로 스크롤"
    >
      {/* Render Integrity: Employs a static Lucide icon path for consistent visual weight and zero-runtime-latency rendering. */}
      <ArrowUp className="w-6 h-6" />
    </button>
  );
}

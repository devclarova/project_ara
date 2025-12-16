import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  className?: string;
}

export default function ScrollToTopButton({ className }: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // 300px 이상 스크롤 시 표시
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
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
      <ArrowUp className="w-6 h-6" />
    </button>
  );
}

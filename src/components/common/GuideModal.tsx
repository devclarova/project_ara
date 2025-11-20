import { useEffect, useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

type GuideSlide = {
  id: string;
  image: string;
  alt?: string;
};

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: GuideSlide[];
  storageKey?: string;

  prevLabel?: string;
  nextLabel?: string;
  completeLabel?: string;
  closeLabel?: string;
  neverShowLabel?: string;
}

const DEFAULT_STORAGE_KEY = 'ara-guide-modal-dismissed';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -120 : 120,
    opacity: 0,
  }),
};

export default function GuideModal({
  isOpen,
  onClose,
  slides,
  storageKey = DEFAULT_STORAGE_KEY,
  prevLabel = '이전',
  nextLabel = '다음',
  completeLabel = '완료',
  closeLabel = '닫기',
  neverShowLabel = '다시는 안 보기',
}: GuideModalProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const total = slides.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const primaryLabel = isLast ? completeLabel : nextLabel;

  useEffect(() => {
    if (isOpen) {
      setIndex(0);
      setDirection(0);
    }
  }, [isOpen]);

  const handlePrev = () => {
    if (isFirst) return;
    setDirection(-1);
    setIndex(prev => prev - 1);
  };

  const handleNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    setDirection(1);
    setIndex(prev => prev + 1);
  };

  const handleDotClick = (i: number) => {
    if (i === index) return;
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  const handleNeverShow = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, 'true');
      }
    } catch {
      // ignore
    }
    onClose();
  };

  // 드래그
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 60;
    if (info.offset.x < -swipeThreshold && !isLast) {
      handleNext();
    } else if (info.offset.x > swipeThreshold && !isFirst) {
      handlePrev();
    }
  };

  const currentSlide = slides[index];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 bg-white dark:bg-neutral-900 inline-flex flex-col"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
          >
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition"
              aria-label="닫기"
            >
              <X size={18} />
            </button>

            {/* 이미지 뷰포트 */}
            <div
              className="
    relative overflow-hidden rounded-t-3xl flex items-center justify-center
    bg-black/5 dark:bg-neutral-800
    w-[90vw] max-w-[600px]     /* 데스크톱 최대 */
    h-[60vh] max-h-[500px]     /* 적당한 높이 */
    sm:max-w-[500px]           /* 태블릿 */
    md:max-w-[600px]           /* 데스크톱 */
  "
            >
              <AnimatePresence custom={direction} initial={false} mode="wait">
                <motion.img
                  key={currentSlide.id}
                  src={currentSlide.image}
                  alt={currentSlide.alt}
                  className="block w-full h-full object-contain"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    type: 'tween',
                    duration: 0.35,
                    ease: 'easeInOut',
                  }}
                  drag="x"
                  dragElastic={0.15}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                />
              </AnimatePresence>

              {/* 왼쪽/오른쪽 버튼은 그대로 유지 */}
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 
                 inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 
                 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                  aria-label={prevLabel}
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {!isLast && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 
                 inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 
                 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                  aria-label={primaryLabel}
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </div>

            {/* 하단 컨트롤 */}
            <div className="w-full bg-white dark:bg-neutral-900 px-3.5 sm:px-4 md:px-5 py-2.5 sm:py-3 flex flex-col gap-2">
              {/* 페이지 인디케이터 */}
              <div className="flex justify-center gap-1.5 mb-0.5">
                {slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => handleDotClick(i)}
                    className={[
                      'h-2 rounded-full transition-all',
                      i === index
                        ? 'w-4 bg-[var(--ara-primary,#00BFA5)]'
                        : 'w-2 bg-gray-300 dark:bg-gray-600',
                    ].join(' ')}
                    aria-label={`${i + 1}번째 안내로 이동`}
                  />
                ))}
              </div>

              {/* 버튼 영역 */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleNeverShow}
                  className={[
                    'w-full sm:w-auto',
                    'px-3 py-1.5 text-xs sm:text-sm rounded-xl',
                    'text-gray-500 dark:text-gray-300',
                    'border border-gray-200 dark:border-gray-700',
                    'bg-white dark:bg-neutral-900',
                    'hover:bg-primary/10 dark:hover:bg-primary/10',
                    'transition',
                  ].join(' ')}
                >
                  {neverShowLabel}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={[
                    'w-full sm:w-auto',
                    'px-3 py-1.5 text-xs sm:text-sm rounded-xl',
                    'border border-transparent',
                    'text-gray-600 dark:text-gray-200',
                    'bg-primary/10 dark:bg-primary/10',
                    'hover:bg-primary/30 dark:hover:bg-primary/30',
                    'transition',
                  ].join(' ')}
                >
                  {closeLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** 다시는 안보기 여부 확인 헬퍼 */
export function isGuideModalDismissed(storageKey: string = DEFAULT_STORAGE_KEY): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(storageKey) === 'true';
  } catch {
    return false;
  }
}

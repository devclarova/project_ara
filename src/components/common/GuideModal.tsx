import { useEffect, useState, useRef } from 'react';
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

// 🔹 아주 미세한 좌우 이동 + 페이드
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 12 : -12,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -12 : 12,
    opacity: 0,
  }),
};

import { useTranslation } from 'react-i18next';

export default function GuideModal({
  isOpen,
  onClose,
  slides,
  storageKey = DEFAULT_STORAGE_KEY,
  prevLabel,
  nextLabel,
  completeLabel,
  closeLabel,
  neverShowLabel,
}: GuideModalProps) {
  const { t } = useTranslation();
  
  const finalPrevLabel = prevLabel ?? t('study.guide.prev');
  const finalNextLabel = nextLabel ?? t('study.guide.next');
  const finalCompleteLabel = completeLabel ?? t('study.guide.start');
  const finalCloseLabel = closeLabel ?? t('study.guide.close');
  const finalNeverShowLabel = neverShowLabel ?? t('study.guide.never_show');

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // ✅ 이동 방향: -1(이전), 1(다음)
  const modalContentRef = useRef<HTMLDivElement>(null);

  const total = slides.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const primaryLabel = isLast ? finalCompleteLabel : finalNextLabel;

  useEffect(() => {
    if (isOpen) {
      setIndex(0);
      setDirection(0); // 처음 열릴 때는 방향 0

      // 바깥 스크롤 차단
      const body = document.body;
      const originalOverflow = body.style.overflow;
      const originalTouchAction = (body.style as any).touchAction;

      const preventScroll = (e: Event) => {
        // 모달 내부 요소에서 발생한 이벤트는 허용
        if (modalContentRef.current && modalContentRef.current.contains(e.target as Node)) {
          return;
        }
        e.preventDefault();
      };

      body.style.overflow = 'hidden';
      (body.style as any).touchAction = 'none';
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('mousewheel', preventScroll, { passive: false });

      return () => {
        body.style.overflow = originalOverflow || '';
        (body.style as any).touchAction = originalTouchAction || '';
        document.removeEventListener('touchmove', preventScroll);
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('mousewheel', preventScroll);
      };
    }
  }, [isOpen]);

  const handlePrev = () => {
    if (isFirst) return;
    setDirection(-1); // ✅ 왼쪽(이전)으로 이동
    setIndex(prev => prev - 1);
  };

  const handleNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    setDirection(1); // ✅ 오른쪽(다음)으로 이동
    setIndex(prev => prev + 1);
  };

  const handleDotClick = (i: number) => {
    if (i === index) return;
    setDirection(i > index ? 1 : -1); // ✅ 점프할 때도 방향 계산
    setIndex(i);
  };

  const handleNeverShow = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, 'true');
      }
    } catch {}
    onClose();
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 60;
    if (info.offset.x < -swipeThreshold && !isLast) {
      // 왼쪽으로 스와이프 = 다음
      setDirection(1);
      handleNext();
    } else if (info.offset.x > swipeThreshold && !isFirst) {
      // 오른쪽으로 스와이프 = 이전
      setDirection(-1);
      handlePrev();
    }
  };

  const currentSlide = slides[index];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            ref={modalContentRef}
            className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 bg-white dark:bg-neutral-900 inline-flex flex-col"
            style={{
              width: 'min(90vw, 640px)',
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
              className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition"
              aria-label="닫기"
            >
              <X size={18} />
            </button>

            {/* 이미지 뷰포트 */}
            <div
              onMouseDown={e => e.preventDefault()}
              className="
                relative overflow-hidden rounded-t-3xl
                flex items-center justify-center
                bg-black/5 dark:bg-neutral-800
                px-4 py-4
                select-none
              "
            >
              <div className="relative w-full flex items-center justify-center">
                {/* ✅ direction을 custom으로 넘겨서 항상 올바른 방향으로 슬라이드 */}
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.img
                    key={currentSlide.id}
                    src={currentSlide.image}
                    alt={currentSlide.alt}
                    draggable={false}
                    className="
                      block
                      max-w-full
                      max-h-[60vh]
                      object-contain
                      select-none
                    "
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      duration: 0.22,
                      ease: 'easeInOut',
                    }}
                    drag="x"
                    dragElastic={0.12}
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                  />
                </AnimatePresence>
              </div>

              {/* 좌우 버튼 */}
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 
                    inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 
                    rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                  aria-label={finalPrevLabel}
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
              <div className="flex justify-center gap-1.5 mb-0.5">
                {slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => handleDotClick(i)}
                    className={[
                      'h-2 w-2.5 rounded-full transition-colors',
                      i === index
                        ? 'bg-[var(--ara-primary,#00BFA5)]'
                        : 'bg-gray-300 dark:bg-gray-600',
                    ].join(' ')}
                    aria-label={`${i + 1}번째 안내로 이동`}
                  />
                ))}
              </div>

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
                  {finalNeverShowLabel}
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
                  {finalCloseLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function isGuideModalDismissed(storageKey: string = DEFAULT_STORAGE_KEY): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(storageKey) === 'true';
  } catch {
    return false;
  }
}

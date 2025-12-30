import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type ModalImageSliderProps = {
  allImages: string[];
  modalIndex: number;
  setModalIndex: (value: number | ((prev: number) => number)) => void;
  onClose: () => void;
};

export default function ModalImageSlider({
  allImages,
  modalIndex,
  setModalIndex,
  onClose,
}: ModalImageSliderProps) {
  // 이동 방향 상태
  const [direction, setDirection] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [blockClick, setBlockClick] = useState(false);

  // 스크롤 잠금 Hook
  useBodyScrollLock(true); // 항상 열려있으므로 true

  // ESC 로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    // 모달 바깥 overlay 클릭하시 닫힘
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] cursor-default"
      onClick={e => {
        if (isDragging) return; // 드래그 중 → 닫힘 금지
        if (blockClick) return; // 드래그 직후 click 버블 → 닫힘 금지

        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-[min(750px,90vw)] h-[min(90vh,900px)] bg-white/90 dark:bg-black/30 backdrop-blur-md flex items-center justify-center rounded-xl overflow-hidden select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-700 dark:text-white text-3xl bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 w-10 h-10 rounded-full z-[10001] flex items-center justify-center transition-colors border border-gray-300 dark:border-white/20"
        >
          <i className="ri-close-line" />
        </button>

        {/* 이미지 wrapper */}
        <div
          className="relative w-full h-full max-w-6xl flex flex-col items-center justify-center p-4 z-[10000] overscroll-contain"
          onClick={e => e.stopPropagation()}
          data-scroll-lock-scrollable=""
        >
          {/* 이미지 안 카운터 */}
          {allImages.length > 1 && (
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/60 backdrop-blur-sm text-gray-900 dark:text-white text-xs px-3 py-1 rounded-full z-40">
              {modalIndex + 1} / {allImages.length}
            </div>
          )}

          {/* 메인 이미지 */}
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.img
              key={allImages[modalIndex]}
              src={allImages[modalIndex]}
              draggable={false}
              className="max-h-full max-w-full object-contain z-10"
              custom={direction}
              variants={{
                enter: d => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: d => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              // 드래그 가능
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragStart={() => {
                setIsDragging(true);
                setBlockClick(true);
              }}
              onDragEnd={(e, info) => {
                setIsDragging(false);
                setTimeout(() => setBlockClick(false), 100);

                const threshold = 80;
                // 오른쪽 → 왼쪽 swipe (다음 이미지)
                if (info.offset.x < -threshold && modalIndex < allImages.length - 1) {
                  setDirection(1);
                  setModalIndex(prev => prev + 1);
                }
                // 왼쪽 → 오른쪽 swipe (이전 이미지)
                else if (info.offset.x > threshold && modalIndex > 0) {
                  setDirection(-1);
                  setModalIndex(prev => prev - 1);
                }
              }}
            />
          </AnimatePresence>
        </div>

        {/* 왼쪽 버튼 */}
        {modalIndex > 0 && (
          <button
            onClick={e => {
              e.stopPropagation();
              setDirection(-1);
              setModalIndex(prev => prev - 1);
            }}
            className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 text-gray-700 dark:text-white text-4xl w-8 h-8 rounded-full flex justify-center items-center z-30"
          >
            <span className="absolute -translate-y-1 -translate-x-0.7">‹</span>
          </button>
        )}

        {/* 오른쪽 버튼 */}
        {modalIndex < allImages.length - 1 && (
          <button
            onClick={e => {
              e.stopPropagation();
              setDirection(1);
              setModalIndex(prev => prev + 1);
            }}
            className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 text-gray-700 dark:text-white text-4xl w-8 h-8 rounded-full flex justify-center items-center z-30"
          >
            <span className="absolute -translate-y-1 -translate-x-0.7">›</span>
          </button>
        )}

        {/* 하단 점 인디케이터 */}
        {allImages.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={e => {
                  e.stopPropagation();

                  if (i === modalIndex) return;

                  setDirection(i > modalIndex ? 1 : -1);
                  setModalIndex(i);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === modalIndex
                    ? 'bg-gray-800 dark:bg-white scale-125'
                    : 'bg-gray-400 dark:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

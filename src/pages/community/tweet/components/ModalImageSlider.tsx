import { motion, useAnimationControls, type PanInfo } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const [direction, setDirection] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [blockClick, setBlockClick] = useState(false);

  // 트랙용
  const viewportRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const controls = useAnimationControls();

  const spring = { type: 'spring', stiffness: 320, damping: 34, mass: 0.9, bounce: 0 } as const;

  const clamp = (n: number) => Math.max(0, Math.min(allImages.length - 1, n));

  // ±1장만 드래그 가능하게 제한
  const leftBound = width ? -Math.min(modalIndex + 1, allImages.length - 1) * width : 0;
  const rightBound = width ? -Math.max(modalIndex - 1, 0) * width : 0;

  useBodyScrollLock(true);

  // ESC 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // 키보드 좌우 이동
      // if (e.key === 'ArrowRight') setModalIndex(i => clamp(i + 1));
      // if (e.key === 'ArrowLeft') setModalIndex(i => clamp(i - 1));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // viewport width 측정
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => setWidth(el.getBoundingClientRect().width);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // index 변경 시 트랙 위치 애니메이션 (width 변경 때는 set만)
  const prevWidthRef = useRef(0);
  useEffect(() => {
    if (!width) return;

    if (prevWidthRef.current !== width) {
      controls.set({ x: -modalIndex * width });
      prevWidthRef.current = width;
      return;
    }

    controls.start({ x: -modalIndex * width, transition: spring });
  }, [modalIndex, width, controls]);

  // 다음/이전 미리 로드
  useEffect(() => {
    const preload = (src?: string) => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    };
    preload(allImages[modalIndex + 1]);
    preload(allImages[modalIndex - 1]);
  }, [allImages, modalIndex]);

  const snapTo = (nextIndex: number) => {
    const next = clamp(nextIndex);

    if (!width) return;

    // 먼저 트랙 이동
    controls.start({ x: -next * width, transition: spring });

    // 같은 인덱스면 제자리로만 스냅
    if (next === modalIndex) {
      if (width) controls.start({ x: -modalIndex * width, transition: spring });
      return;
    }

    setDirection(next > modalIndex ? 1 : -1);
    setModalIndex(next);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] cursor-default"
      onClick={e => {
        if (isDragging) return;
        if (blockClick) return;
        if (e.target === e.currentTarget) onClose();
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
          className="relative w-full h-full max-w-6xl flex flex-col items-center justify-center p-4 z-10 overscroll-contain"
          onClick={e => e.stopPropagation()}
          data-scroll-lock-scrollable=""
        >
          {/* 카운터 */}
          {allImages.length > 1 && (
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/60 backdrop-blur-sm text-gray-900 dark:text-white text-xs px-3 py-1 rounded-full z-40">
              {modalIndex + 1} / {allImages.length}
            </div>
          )}

          {/* viewport */}
          <div ref={viewportRef} className="relative w-full h-full overflow-hidden">
            {/* 트랙 */}
            <motion.div
              className="flex w-full h-full"
              style={{ touchAction: 'pan-y' }}
              drag="x"
              dragElastic={0.12}
              dragMomentum={false}
              dragConstraints={{ left: leftBound, right: rightBound }}
              animate={controls}
              onDragStart={() => {
                setIsDragging(true);
                setBlockClick(true);
              }}
              onDragEnd={(_, info: PanInfo) => {
                setIsDragging(false);
                setTimeout(() => setBlockClick(false), 120);

                if (!width) return;

                const threshold = width * 0.35;
                let next = modalIndex;

                if (info.offset.x < -threshold || info.velocity.x < -800) next = modalIndex + 1;
                else if (info.offset.x > threshold || info.velocity.x > 800) next = modalIndex - 1;

                snapTo(next);
              }}
            >
              {allImages.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="shrink-0 w-full h-full flex items-center justify-center"
                >
                  <img
                    src={src}
                    draggable={false}
                    className="max-h-full max-w-full object-contain"
                    loading={i === modalIndex ? 'eager' : 'lazy'}
                    decoding="async"
                    alt=""
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* 왼쪽 버튼 */}
        {modalIndex > 0 && (
          <button
            onClick={e => {
              e.stopPropagation();
              snapTo(modalIndex - 1);
            }}
            className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white text-4xl rounded-full w-8 h-8 flex items-center justify-center z-50"
          >
            <span className="absolute -translate-y-1 -translate-x-0.7">‹</span>
          </button>
        )}

        {/* 오른쪽 버튼 */}
        {modalIndex < allImages.length - 1 && (
          <button
            onClick={e => {
              e.stopPropagation();
              snapTo(modalIndex + 1);
            }}
            className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white text-4xl w-8 h-8 rounded-full flex items-center justify-center z-50"
          >
            <span className="absolute -translate-y-1 -translate-x-0.7">›</span>
          </button>
        )}

        {/* 하단 점 */}
        {allImages.length > 1 && (
          <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={e => {
                  e.stopPropagation();
                  snapTo(i);
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

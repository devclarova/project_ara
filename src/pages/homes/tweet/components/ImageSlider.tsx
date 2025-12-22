import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

type ImageSliderProps = {
  allImages: string[];
  currentImage: number;
  setCurrentImage: (value: number | ((prev: number) => number)) => void;
  setDirection: (dir: number) => void;
  direction: number;
  onOpen?: (index: number) => void;
};

export default function ImageSlider({
  allImages,
  currentImage,
  setCurrentImage,
  setDirection,
  direction,
  onOpen,
}: ImageSliderProps) {
  const [startX, setStartX] = useState(0);
  const [dragged, setDragged] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setDragged(false);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const diff = Math.abs(e.clientX - startX);

    // 움직임이 있으면 → 드래그
    if (diff > 5) {
      setDragged(true);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 움직임이 없었고(클릭), 좌클릭인 경우만 (onClick은 기본적으로 좌클릭에만 반응하지만 안전장치)
    if (!dragged) {
      onOpen?.(currentImage);
    }
  };

  return (
    <div
      className="mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative"
      onClick={e => e.stopPropagation()} 
    >
      <div className="relative w-full aspect-[4/3] max-h-[500px] bg-black/5 dark:bg-black/20 flex items-center justify-center">
        {/* 페이지 표시 */}
        {allImages.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full z-20">
            {currentImage + 1} / {allImages.length}
          </div>
        )}

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.img
            key={allImages[currentImage]}
            src={allImages[currentImage]}
            // 드래그 vs 클릭 판단
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            draggable={false}
            className="absolute w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            custom={direction}
            variants={{
              enter: d => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: d => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(e, info) => {
              const threshold = 80;

              if (info.offset.x < -threshold && currentImage < allImages.length - 1) {
                setDirection(1);
                setCurrentImage(prev => prev + 1);
              } else if (info.offset.x > threshold && currentImage > 0) {
                setDirection(-1);
                setCurrentImage(prev => prev - 1);
              }
            }}
          />
        </AnimatePresence>

        {/* 왼쪽 버튼 */}
        {currentImage > 0 && (
          <button
            onClick={e => {
              e.stopPropagation();
              setDirection(-1);
              setCurrentImage(prev => prev - 1);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white text-4xl rounded-full w-8 h-8 flex items-center justify-center"
          >
            <span className="absolute -translate-y-1 -translate-x-0">‹</span>
          </button>
        )}

        {/* 오른쪽 버튼 */}
        {currentImage < allImages.length - 1 && (
          <button
            onClick={e => {
              e.stopPropagation();
              setDirection(1);
              setCurrentImage(prev => prev + 1);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white text-4xl w-8 h-8 rounded-full flex items-center justify-center"
          >
            <span className="absolute -translate-y-1 -translate-x-0">›</span>
          </button>
        )}

        {/* 하단 점 */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={e => {
                  e.stopPropagation();
                  setDirection(i > currentImage ? 1 : -1);
                  setCurrentImage(i);
                }}
                className={`w-2 h-2 rounded-full ${i === currentImage ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { AnimatePresence, motion } from 'framer-motion';

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
  return (
    <div
      className="mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative"
      onClick={e => e.stopPropagation()}
    >
      <div className="relative w-full h-[450px] bg-black/5 dark:bg-black/20 flex items-center justify-center">
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
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onOpen?.(currentImage);
            }}
            draggable={false}
            className="absolute w-full h-full object-cover"
            custom={direction}
            variants={{
              enter: (d: number) => ({
                x: d > 0 ? 40 : -40,
              }),
              center: { x: 0 },
              exit: (d: number) => ({
                x: d > 0 ? -40 : 40,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              const threshold = 60;
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
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ‹
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
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ›
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

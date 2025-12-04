import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

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
  const [showImageModal, setShowImageModal] = useState(false);

  // 이미지 모달 ESX 로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowImageModal(false);
      }
    };

    if (showImageModal) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImageModal]);

  return (
    <div className=" relative w-[min(750px,90vw)] h-[min(90vh,900px)] bg-black/20 backdrop-blur-md flex items-center justify-center rounded-xl overflow-hidden select-none">
      {/* 카운터 */}
      {allImages.length > 1 && (
        <div className="absolute top-[120px] right-6 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full z-40">
          {modalIndex + 1} / {allImages.length}
        </div>
      )}

      {/* ===== 메인 이미지 ===== */}
      <AnimatePresence mode="wait" initial={false} custom={modalIndex}>
        <motion.img
          key={allImages[modalIndex]}
          src={allImages[modalIndex]}
          className="max-h-[80vh] max-w-[95%] object-contain drop-shadow-2xl"
          draggable={false}
          custom={modalIndex}
          variants={{
            enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            const threshold = 60;

            if (info.offset.x < -threshold && modalIndex < allImages.length - 1) {
              setModalIndex(prev => prev + 1);
            } else if (info.offset.x > threshold && modalIndex > 0) {
              setModalIndex(prev => prev - 1);
            }
          }}
        />
      </AnimatePresence>

      {/* 닫기 버튼 */}
      <button
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 text-white text-3xl bg-black/40 hover:bg-black/60 w-10 h-10 rounded-full z-[3000] flex items-center justify-center"
      >
        ✕
      </button>

      {/* 🔵 왼쪽 버튼 */}
      {modalIndex > 0 && (
        <button
          onClick={e => {
            e.stopPropagation();
            setModalIndex(prev => prev - 1);
          }}
          className="
            absolute left-4 top-1/2 -translate-y-1/2 
            bg-black/40 hover:bg-black/70 backdrop-blur-md 
            text-white text-4xl w-12 h-12 rounded-full 
            flex justify-center items-center z-30
          "
        >
          ‹
        </button>
      )}

      {/* 🔵 오른쪽 버튼 */}
      {modalIndex < allImages.length - 1 && (
        <button
          onClick={e => {
            e.stopPropagation();
            setModalIndex(prev => prev + 1);
          }}
          className="
            absolute right-4 top-1/2 -translate-y-1/2 
            bg-black/40 hover:bg-black/70 backdrop-blur-md 
            text-white text-4xl w-12 h-12 rounded-full 
            flex justify-center items-center z-30
          "
        >
          ›
        </button>
      )}

      {/* 🔵 하단 점 인디케이터 */}
      {allImages.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={e => {
                e.stopPropagation();
                setModalIndex(i);
              }}
              className={`
              w-2.5 h-2.5 rounded-full 
              transition-all 
              ${i === modalIndex ? 'bg-white scale-125' : 'bg-white/40'}
            `}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import type React from 'react';
import { motion, useAnimationControls, type PanInfo } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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
  onOpen,
}: ImageSliderProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const controls = useAnimationControls();

  // 클릭 vs 드래그 판별(모달 오픈 방지)
  const startXRef = useRef(0);
  const draggedRef = useRef(false);
  const draggingRef = useRef(false);

  const clamp = (n: number) => Math.max(0, Math.min(allImages.length - 1, n));

  const spring = { type: 'spring', stiffness: 320, damping: 34, mass: 0.9, bounce: 0 } as const;

  const snapTo = (nextIndex: number) => {
    const next = clamp(nextIndex);

    if (next === currentImage) {
      // 제자리로 되돌릴 때만 애니메이션
      if (width) controls.start({ x: -currentImage * width, transition: spring });
      return;
    }

    setDirection(next > currentImage ? 1 : -1);
    setCurrentImage(next);
  };

  // 현재 기준으로 한 장만 드래그 가능하게 제한
  const leftBound = width ? -Math.min(currentImage + 1, allImages.length - 1) * width : 0;
  const rightBound = width ? -Math.max(currentImage - 1, 0) * width : 0;

  // 뷰포트 너비 추적 (리사이즈 대응)
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => setWidth(el.getBoundingClientRect().width);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const prevWidthRef = useRef(0);

  useEffect(() => {
    if (!width) return;

    // width가 바뀐 경우: 위치만 즉시 맞추고(점프 방지) 애니메이션은 하지 않음
    if (prevWidthRef.current !== width) {
      controls.set({ x: -currentImage * width });
      prevWidthRef.current = width;
      return;
    }

    // 인덱스가 바뀐 경우: 현재 위치(드래그 끝난 위치)에서 목표로 자연스럽게 이동
    controls.start({ x: -currentImage * width, transition: spring });
  }, [currentImage, width, controls, spring]);

  // 다음/이전 미리 로드(모달에서 체감 큼)
  useEffect(() => {
    const preload = (src?: string) => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    };
    preload(allImages[currentImage + 1]);
    preload(allImages[currentImage - 1]);
  }, [allImages, currentImage]);

  const onPointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    draggedRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (Math.abs(e.clientX - startXRef.current) > 6) draggedRef.current = true;
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!draggedRef.current && !draggingRef.current) {
      onOpen?.(currentImage);
    }
  };

  const onDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    draggingRef.current = false;

    if (!width) return;

    // 현재 트랙 위치 기반으로 가장 가까운 인덱스로 스냅
    const currentX = -currentImage * width + info.offset.x;
    let next = Math.round(-currentX / width);

    // 빠른 플릭(관성) 보정
    if (Math.abs(info.velocity.x) > 800) {
      next = info.velocity.x < 0 ? currentImage + 1 : currentImage - 1;
    }

    snapTo(next);
  };

  return (
    <div
      className="mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative"
      onClick={e => e.stopPropagation()}
    >
      <div
        ref={viewportRef}
        className="relative w-full aspect-[4/3] max-h-[500px] bg-black/5 dark:bg-black/20 overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onClick={onClick}
      >
        {/* 페이지 표시 */}
        {allImages.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full z-20">
            {currentImage + 1} / {allImages.length}
          </div>
        )}

        {/* 트랙(이미지들이 옆으로 이어짐) */}
        <motion.div
          className="flex w-full h-full"
          style={{ touchAction: 'pan-y' }}
          drag="x"
          dragElastic={0.12}
          dragMomentum={false} // 관성 제거
          dragConstraints={{ left: leftBound, right: rightBound }} // ±1장 제한
          onDragStart={() => {
            draggingRef.current = true;
            draggedRef.current = true;
          }}
          onDragEnd={(_, info) => {
            draggingRef.current = false;
            if (!width) return;

            const threshold = width * 0.5;
            let next = currentImage;

            if (info.offset.x < -threshold || info.velocity.x < -800) next = currentImage + 1;
            else if (info.offset.x > threshold || info.velocity.x > 800) next = currentImage - 1;

            snapTo(next); // 한 장만 스냅
          }}
          animate={controls}
        >
          {allImages.map((src, i) => (
            <div key={`${src}-${i}`} className="shrink-0 w-full h-full">
              <img
                src={src}
                draggable={false}
                className="w-full h-full object-cover"
                loading={i === currentImage ? 'eager' : 'lazy'}
                decoding="async"
                alt=""
              />
            </div>
          ))}
        </motion.div>

        {/* 왼쪽 버튼 */}
        {currentImage > 0 && (
          <button
            onClick={e => {
              e.stopPropagation();
              snapTo(currentImage - 1);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white text-4xl rounded-full w-8 h-8 flex items-center justify-center z-20"
          >
            <span className="absolute -translate-y-1 -translate-x-0">‹</span>
          </button>
        )}

        {/* 오른쪽 버튼 */}
        {currentImage < allImages.length - 1 && (
          <button
            onClick={e => {
              e.stopPropagation();
              snapTo(currentImage + 1);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white text-4xl w-8 h-8 rounded-full flex items-center justify-center z-20"
          >
            <span className="absolute -translate-y-1 -translate-x-0">›</span>
          </button>
        )}

        {/* 하단 점 */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={e => {
                  e.stopPropagation();
                  snapTo(i);
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

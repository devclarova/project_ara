export type Dir = 'forward' | 'backward';
const SHIFT = 80;

export const slideVariants = {
  initial: (dir: Dir) => ({
    x: dir === 'forward' ? SHIFT : -SHIFT, // 다음 단계: 오른쪽→왼쪽
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.28 }, // ← ease 제거 (타입 에러 방지)
  },
  exit: (dir: Dir) => ({
    x: dir === 'forward' ? -SHIFT : SHIFT,
    opacity: 0,
    transition: { duration: 0.22 }, // ← ease 제거 (타입 에러 방지)
  }),
} as const;
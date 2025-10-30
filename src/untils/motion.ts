export const slideVariants = {
  initial: (dir: 'forward' | 'backward') => ({ x: dir === 'forward' ? 40 : -40, opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.25 } },
  exit: (dir: 'forward' | 'backward') => ({
    x: dir === 'forward' ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.22 },
  }),
} as const;
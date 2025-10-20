import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type Step = 1 | 2 | 3;

type Props = {
  current: Step;
  onStepChange?: (next: Step) => void; // 숫자/라벨 클릭 이동
};

type AnimState = {
  connector: number | null;
  dir: 'forward' | 'backward';
  tick: number;
};

export default function SignUpStepper({ current, onStepChange }: Props) {
  const steps = [
    { n: 1 as Step, label: '동의' },
    { n: 2 as Step, label: '정보 입력' },
    { n: 3 as Step, label: '프로필' },
  ] as const;

  const prevRef = useRef<Step>(current);
  const [anim, setAnim] = useState<AnimState>({ connector: null, dir: 'forward', tick: 0 });

  useEffect(() => {
    const prev = prevRef.current;
    if (prev !== current) {
      const dir: 'forward' | 'backward' = current > prev ? 'forward' : 'backward';
      const connector = (dir === 'forward' ? prev - 1 : current - 1) as number;
      setAnim({ connector, dir, tick: Date.now() });
      prevRef.current = current;
    }
  }, [current]);

  const go = (next: Step) => onStepChange?.(next);

  return (
    <ol className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6" aria-label="회원가입 단계">
      {steps.map((s, i) => {
        const isActive = current === s.n;
        const isDone = current > s.n;
        const isLast = i === steps.length - 1;

        return (
          <li key={s.n} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(s.n)}
              className={[
                'group flex items-center gap-2 sm:gap-3 select-none focus:outline-none',
                isActive
                  ? 'text-black dark:text-white'
                  : isDone
                    ? 'text-gray-800 dark:text-gray-200'
                    : 'text-gray-500 dark:text-gray-400',
              ].join(' ')}
              aria-current={isActive ? 'step' : undefined}
            >
              <span
                className={[
                  'grid place-items-center w-7 h-7 sm:w-8 sm:h-8 rounded-md border',
                  'font-semibold text-xs sm:text-sm transition-all',
                  isActive
                    ? 'border-[var(--ara-primary)] text-[var(--ara-primary)] ring-2 ring-[var(--ara-ring)] bg-white dark:bg-neutral-900'
                    : isDone
                      ? 'border-gray-400 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-gray-100'
                      : 'border-gray-300 bg-white dark:bg-neutral-900 text-gray-500',
                ].join(' ')}
              >
                {s.n}
              </span>

              <span
                className={[
                  'font-medium text-sm sm:text-base transition-colors truncate',
                  isActive ? 'text-gray-900 dark:text-white' : '',
                ].join(' ')}
              >
                {s.label}
              </span>
            </button>

            {!isLast && (
              <Connector
                index={i}
                done={isDone}
                anim={anim.connector === i ? { dir: anim.dir, tick: anim.tick } : null}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** 커넥터(구분선): 선은 항상 유지. 화살표 '대가리'(chevron)만 선 중앙을 따라 이동/오버슈트 후 사라짐. */
function Connector({
  index,
  done,
  anim,
}: {
  index: number;
  done: boolean;
  anim: { dir: 'forward' | 'backward'; tick: number } | null;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [trackW, setTrackW] = useState(0);
  const trackWClass = 'w-24 sm:w-32';

  const trackColor = useMemo(() => (done ? 'var(--ara-primary)' : 'rgba(107,114,128,0.7)'), [done]);

  const headPx = 16;
  const liftPx = Math.round(headPx * 0.5);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => setTrackW(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!anim) return;
    setShow(true);
  }, [anim?.tick]);

  const shortenPx = 2; // ★ 1~2px 정도 짧게 멈춤
  const startX = anim?.dir === 'forward' ? -headPx / 2 : trackW - headPx / 2;
  const endX = anim?.dir === 'forward' ? trackW - headPx / 2 - shortenPx : -headPx / 2 + shortenPx;

  return (
    <div className="relative mx-2 sm:mx-3 shrink-0">
      <div
        ref={trackRef}
        className={['h-[2px] rounded', trackWClass].join(' ')}
        style={{ backgroundColor: trackColor }}
      />

      <AnimatePresence>
        {anim && show && trackW > 0 && (
          <motion.div
            key={`${index}-${anim.tick}`}
            className={`absolute left-0 ${trackWClass} pointer-events-none`}
            style={{ top: `calc(50% - ${liftPx}px)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.span
              className="absolute inline-flex items-center justify-center"
              style={{ width: headPx, height: headPx, color: trackColor }}
              initial={{ x: startX }}
              animate={{ x: endX }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
              onAnimationComplete={() => setShow(false)}
              aria-hidden
            >
              {anim.dir === 'forward' ? (
                <svg width={headPx} height={headPx} viewBox="0 0 12 12" fill="none">
                  <polyline
                    points="3,2 9,6 3,10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width={headPx} height={headPx} viewBox="0 0 12 12" fill="none">
                  <polyline
                    points="9,2 3,6 9,10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

export type Step = 1 | 2 | 3;

type Props = {
  current: Step;
  onStepChange?: (next: Step) => void;
  guard?: (from: Step, to: Step) => boolean | Promise<boolean>;
  onBeforeChange?: (from: Step, to: Step) => void | Promise<void>;
};

// 경유 애니메이션을 위한 시퀀스 상태
type AnimSeq = {
  path: number[]; // 지나갈 커넥터 인덱스들: [0] = 1-2, [1] = 2-3
  dir: 'forward' | 'backward';
  step: number; // 지금 재생 중인 path 인덱스
  tick: number; // 키 리셋용
} | null;

export default function SignUpStepper({ current, onStepChange, guard, onBeforeChange }: Props) {
  const steps = [
    { n: 1 as Step, label: '동의' },
    { n: 2 as Step, label: '정보 입력' },
    { n: 3 as Step, label: '프로필' },
  ] as const;

  const prevRef = useRef<Step>(current);
  const [anim, setAnim] = useState<AnimSeq>(null);
  const [pendingTarget, setPendingTarget] = useState<Step | null>(null);

  // prev→current 이동 시, 지나갈 커넥터 경로 계산
  useEffect(() => {
    const prev = prevRef.current;
    if (prev === current) return;
    const dir: 'forward' | 'backward' = current > prev ? 'forward' : 'backward';

    const from = Math.min(prev, current);
    const to = Math.max(prev, current);
    const forwardPath = Array.from({ length: to - from }, (_, i) => from - 1 + i);
    const path = dir === 'forward' ? forwardPath : [...forwardPath].reverse();

    setAnim({ path, dir, step: 0, tick: Date.now() });
    prevRef.current = current;
  }, [current]);

  // 버튼 클릭 처리 (1↔3 점프 시 2를 실제 경유)
  const go = async (next: Step) => {
    if (next === current) return;

    const tryMove = async (from: Step, to: Step) => {
      const ok = (await guard?.(from, to)) ?? true;
      if (!ok) return false;
      onStepChange?.(to);
      return true;
    };

    // 1↔3 점프 → 2 경유
    if (Math.abs(next - current) === 2) {
      setPendingTarget(next);
      await tryMove(current, 2);
      return;
    }

    // 인접 이동
    await tryMove(current, next);
  };

  // 커넥터 하나의 애니메이션이 끝났을 때
  const handleConnectorDone = async () => {
    setAnim(prev => {
      if (!prev) return null;
      const nextStep = prev.step + 1;
      if (nextStep >= prev.path.length) return null; // 시퀀스 종료
      return { ...prev, step: nextStep, tick: Date.now() + nextStep };
    });

    const a = anim;
    if (!a) return;
    const finished = a.step + 1 >= a.path.length;

    // 전체 경로가 끝났고 pending이 있으면 최종 목적지로 이동
    if (finished && pendingTarget != null) {
      const target = pendingTarget;
      setPendingTarget(null);
      const ok = (await guard?.(2, target)) ?? true;
      if (ok) onStepChange?.(target);
    }
  };

  return (
    <div
      aria-label="회원가입 단계"
      className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center w-full mb-4 sm:mb-6"
    >
      {steps.map((s, i) => {
        const isActive = current === s.n;
        const isDone = current > s.n;
        const isLast = i === steps.length - 1;

        return (
          <div key={s.n} className="contents">
            {/* 버튼 */}
            <button
              type="button"
              onClick={() => void go(s.n)}
              className={[
                'group flex items-center gap-2 sm:gap-3 select-none focus:outline-none',
                isLast ? 'justify-self-end text-right' : '',
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

            {/* 커넥터 */}
            {!isLast && (
              <Connector
                index={i}
                done={current > i + 1}
                anim={
                  anim && anim.path[anim.step] === i ? { dir: anim.dir, tick: anim.tick } : null
                }
                onDone={handleConnectorDone}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 커넥터(구분선) */
function Connector({
  index,
  done,
  anim,
  onDone,
}: {
  index: number;
  done: boolean;
  anim: { dir: 'forward' | 'backward'; tick: number } | null;
  onDone: () => void | Promise<void>;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [trackW, setTrackW] = useState(0);

  // ✅ 선 색상 동일
  const trackColor = useMemo(() => (done ? 'var(--ara-primary)' : 'rgba(107,114,128,0.7)'), [done]);

  // ✅ 화면 너비에 따라 화살표/이동량만 살짝 조절
  const [sizes, setSizes] = useState({ head: 16, lift: 8, shorten: 2 });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 768) {
        setSizes({ head: 16, lift: 8, shorten: 2 }); // md 이상: 기존 값
      } else if (w >= 640) {
        setSizes({ head: 14, lift: 7, shorten: 2 }); // sm~md: 약간 축소
      } else {
        setSizes({ head: 12, lift: 6, shorten: 1 }); // <sm: 조금 더 축소
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const headPx = sizes.head;
  const liftPx = sizes.lift;

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

  const startX = anim?.dir === 'forward' ? -headPx / 2 : trackW - headPx / 2;
  const endX =
    anim?.dir === 'forward' ? trackW - headPx / 2 - sizes.shorten : -headPx / 2 + sizes.shorten;

  return (
    <div className="relative w-[60px] sm:w-[70px] md:w-[105px] justify-self-center">
      <div
        ref={trackRef}
        className="h-[2px] rounded w-full"
        style={{ backgroundColor: trackColor }}
      />
      <AnimatePresence>
        {anim && show && trackW > 0 && (
          <motion.div
            key={`${index}-${anim.tick}`}
            className="absolute left-0 w-full pointer-events-none"
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
              onAnimationComplete={() => {
                setShow(false);
                void onDone();
              }}
              aria-hidden
            >
              {anim?.dir === 'forward' ? (
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

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type Step = 1 | 2 | 3;

type Props = {
  current: Step;
  onStepChange?: (next: Step) => void;
  guard?: (from: Step, to: Step) => boolean | Promise<boolean>;
};

type AnimSeq = {
  path: number[];
  dir: 'forward' | 'backward';
  step: number;
  tick: number;
} | null;

const STEP_SIZE = 28;
const STEP_COL = 'minmax(48px, auto)';

export default function SignUpStepper({ current, onStepChange, guard }: Props) {
  const { t } = useTranslation();

  const steps = [
    { n: 1 as Step, label: t('signup.step_agreement') },
    { n: 2 as Step, label: t('signup.step_info') },
    { n: 3 as Step, label: t('signup.step_profile') },
  ] as const;

  const prevRef = useRef<Step>(current);
  const [anim, setAnim] = useState<AnimSeq>(null);
  const [pendingTarget, setPendingTarget] = useState<Step | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === current) return;

    const dir = current > prev ? 'forward' : 'backward';
    const from = Math.min(prev, current);
    const to = Math.max(prev, current);

    const forwardPath = Array.from({ length: to - from }, (_, i) => from - 1 + i);
    const path = dir === 'forward' ? forwardPath : [...forwardPath].reverse();

    setAnim({ path, dir, step: 0, tick: Date.now() });
    prevRef.current = current;
  }, [current]);

  const go = async (next: Step) => {
    if (next === current) return;

    const canMove = async (from: Step, to: Step) => {
      const ok = (await guard?.(from, to)) ?? true;
      if (ok) onStepChange?.(to);
      return ok;
    };

    if (Math.abs(next - current) === 2) {
      setPendingTarget(next);
      await canMove(current, 2);
      return;
    }

    await canMove(current, next);
  };

  const handleConnectorDone = async () => {
    setAnim(prev => {
      if (!prev) return null;
      const nextStep = prev.step + 1;
      if (nextStep >= prev.path.length) return null;
      return { ...prev, step: nextStep, tick: Date.now() + nextStep };
    });

    if (!anim) return;
    if (anim.step + 1 >= anim.path.length && pendingTarget) {
      const target = pendingTarget;
      setPendingTarget(null);
      const ok = (await guard?.(2, target)) ?? true;
      if (ok) onStepChange?.(target);
    }
  };

  return (
    <div className="w-full max-w-[380px] mx-auto mt-4 mb-2 p-1">
      <div
        className="grid items-start"
        style={{
          gridTemplateColumns: `${STEP_COL} 1fr ${STEP_COL} 1fr ${STEP_COL}`,
        }}
      >
        {steps.map((s, i) => {
          const isActive = current === s.n;
          const isDone = current > s.n;
          const isLast = i === steps.length - 1;

          return (
            <div key={s.n} className="contents">
              {/* Step */}
              <div className="flex flex-col items-center pb-1">
                <button
                  type="button"
                  onClick={() => void go(s.n)}
                  className="flex flex-col items-center"
                >
                  <span
                    className={[
                      'grid place-items-center w-6 h-6 rounded-md border text-xs font-semibold',
                      'ring-offset-2',
                      isActive
                        ? 'border-[var(--ara-primary)] text-[var(--ara-primary)] ring-2 ring-[var(--ara-ring)]'
                        : isDone
                        ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                    ].join(' ')}
                  >
                    {s.n}
                  </span>

                  <span className="mt-2 text-[11px] text-center leading-tight text-gray-500 dark:text-gray-400">
                    {s.label}
                  </span>
                </button>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="flex items-center h-6 px-1">
                  <Connector
                    done={current > i + 1}
                    anim={
                      anim && anim.path[anim.step] === i
                        ? { dir: anim.dir, tick: anim.tick }
                        : null
                    }
                    onDone={handleConnectorDone}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= Connector ================= */


function Connector({
  done,
  anim,
  onDone,
}: {
  done: boolean;
  anim: { dir: 'forward' | 'backward'; tick: number } | null;
  onDone: () => void | Promise<void>;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [trackW, setTrackW] = useState(0);

  const trackColor = useMemo(
    () => (done ? 'var(--ara-primary)' : 'rgba(107,114,128,0.5)'),
    [done]
  );

  const [sizes, setSizes] = useState({ head: 16 });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 768) {
        setSizes({ head: 16 });
      } else if (w >= 640) {
        setSizes({ head: 14 });
      } else {
        setSizes({ head: 12 });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const headPx = sizes.head;
  // SVG viewBox is 0..12.
  // Forward: Tip at 9, Tail at 3.
  // Backward: Tip at 3, Tail at 9.
  // We want visual tip/tail to touch 0 or trackW.
  // Scale factor = headPx / 12.
  // Visual offset = 3 * (headPx / 12) = 0.25 * headPx.
  // Visual width = (9-3) * scale = 0.5 * headPx.
  //
  // Forward (>):
  // Start: Tail at 0. x + 0.25*h = 0 => x = -0.25*h
  // End: Tip at W. x + 0.75*h = W => x = W - 0.75*h
  //
  // Backward (<):
  // Start: Tail at W. x + 0.75*h = W => x = W - 0.75*h
  // End: Tip at 0. x + 0.25*h = 0 => x = -0.25*h

  const offsetStart = -0.25 * headPx;
  const offsetEnd = trackW - 0.75 * headPx;

  const startX = anim?.dir === 'forward' ? offsetStart : offsetEnd;
  const endX = anim?.dir === 'forward' ? offsetEnd : offsetStart;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => setTrackW(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative w-full h-[1.5px]">
      <div
        ref={trackRef}
        className="absolute inset-0 top-1/2 -translate-y-1/2"
        style={{ backgroundColor: trackColor }}
      >
        <AnimatePresence>
          {anim && trackW > 0 && (
            <motion.span
              key={anim.tick}
              className="absolute inline-flex items-center justify-center pointer-events-none"
              style={{
                width: headPx,
                height: headPx,
                color: trackColor,
                top: `calc(50% - ${headPx / 2}px)`, // center vert
              }}
              initial={{ x: startX }}
              animate={{ x: endX }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              onAnimationComplete={() => void onDone()}
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
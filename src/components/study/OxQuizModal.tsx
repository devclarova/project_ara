import { useEffect, useMemo, useState } from 'react';
import type { VocabItem } from './QuizMenuModal';
import ConfirmModal from '../common/ConfirmModal';

type OxQuestion = {
  term: string;
  shownMeaning: string;
  correctMeaning: string;
  isTrue: boolean;
};

export default function OxQuizModal({
  isOpen,
  onClose,
  pool,
}: {
  isOpen: boolean;
  onClose: () => void;
  pool: VocabItem[];
}) {
  const DURATION = 60;
  const PENALTY = 2;

  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState<OxQuestion | null>(null);
  const [feedback, setFeedback] = useState<null | { pick: 'O' | 'X'; ok: boolean }>(null);
  const [finished, setFinished] = useState(false);
  const [shake, setShake] = useState(false);
  const [penaltyFlash, setPenaltyFlash] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const [wrongHistory, setWrongHistory] = useState<
    { term: string; shown: string; correct: string; answer: 'O' | 'X' }[]
  >([]);

  const canMakeFalse = pool.length >= 2;

  const makeQuestion = (): OxQuestion | null => {
    if (pool.length === 0) return null;

    const base = pool[Math.floor(Math.random() * pool.length)];
    const correctMeaning = base.meaning;
    const makeTrue = !canMakeFalse ? true : Math.random() < 0.5;

    if (makeTrue) {
      return {
        term: base.term,
        shownMeaning: correctMeaning,
        correctMeaning,
        isTrue: true,
      };
    }

    const others = pool.filter(v => v.meaning !== correctMeaning);
    const wrong = others[Math.floor(Math.random() * others.length)].meaning;

    return {
      term: base.term,
      shownMeaning: wrong,
      correctMeaning,
      isTrue: false,
    };
  };

  const resetAll = () => {
    setTimeLeft(DURATION);
    setScore(0);
    setFinished(false);
    setWrongHistory([]);
    setQ(makeQuestion());
  };

  useEffect(() => {
    if (!isOpen) return;
    resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 타이머
  useEffect(() => {
    if (!isOpen || finished) return;

    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [isOpen, finished]);

  const progress = useMemo(() => (timeLeft / DURATION) * 100, [timeLeft]);

  const answer = (pick: 'O' | 'X') => {
    if (!q || feedback || finished) return;

    const isPickTrue = pick === 'O';
    const ok = isPickTrue === q.isTrue;

    setFeedback({ pick, ok });

    if (ok) {
      setScore(s => s + 1);
    } else {
      setTimeLeft(prev => {
        const newTime = prev - PENALTY;
        if (newTime <= 0) {
          setFinished(true);
          return 0;
        }
        return newTime;
      });

      // ❌ 패널티 표시 (상단 중앙)
      setPenaltyFlash(true);
      setTimeout(() => setPenaltyFlash(false), 650);

      // 💥 흔들림
      setShake(true);
      setTimeout(() => setShake(false), 400);

      // ❌ 틀린 문제 기록
      setWrongHistory(prev => [
        ...prev,
        {
          term: q.term,
          shown: q.shownMeaning,
          correct: q.correctMeaning,
          answer: pick,
        },
      ]);
    }

    setTimeout(() => {
      setFeedback(null);
      if (!finished) setQ(makeQuestion());
    }, 400);
  };

  const getRank = () => {
    if (score >= 35) return { emoji: '👑', text: '괴물급 스피드!' };
    if (score >= 25) return { emoji: '🔥', text: '엄청 잘했어요!' };
    if (score >= 15) return { emoji: '👏', text: '좋아요!' };
    return { emoji: '💪', text: '다음엔 더 높게!' };
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes shakeX {
          0% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
          100% { transform: translateX(0); }
        }
        .shake-x {
          animation: shakeX 0.4s ease;
        }

        /* 중앙 -2초 표시: 위로 살짝 뜨면서 사라짐 */
        @keyframes penaltyPop {
          0% { opacity: 0; transform: translateY(6px) scale(0.98); }
          20% { opacity: 1; transform: translateY(0) scale(1); }
          80% { opacity: 1; transform: translateY(-2px) scale(1); }
          100% { opacity: 0; transform: translateY(-8px) scale(1.02); }
        }
        .penalty-pop {
          animation: penaltyPop 0.65s ease forwards;
        }
      `}</style>

      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

        <div
          className={`relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden ${
            shake ? 'shake-x' : ''
          }`}
          onMouseDownCapture={e => e.stopPropagation()}
          onTouchStartCapture={e => e.stopPropagation()}
        >
          {!finished ? (
            <>
              {/* 상단 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold text-gray-900 dark:text-white">OX 스피드</div>

                <button
                  onClick={() => setConfirmClose(true)}
                  className="h-9 w-9 rounded-full flex items-center justify-center
               bg-gray-100 hover:bg-gray-200
               dark:bg-white/10 dark:hover:bg-white/15
               transition"
                  aria-label="닫기"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-700 dark:text-gray-200"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* 타이머 */}
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    timeLeft <= 10 ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* 상단 정보 (가운데에 -2초) */}
              <div className="relative flex items-center justify-between mb-6">
                <div className="font-semibold text-gray-600 dark:text-gray-300">⏱ {timeLeft}s</div>

                {/* 가운데 슬롯 */}
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
                  {penaltyFlash && (
                    <div className="penalty-pop text-red-500 font-extrabold text-lg">
                      -{PENALTY}초 ⏳
                    </div>
                  )}
                </div>

                <div className="font-bold text-gray-900 dark:text-white">점수 {score}</div>
              </div>

              <div className="rounded-3xl ring-1 ring-gray-200 dark:ring-gray-700 p-5 bg-gray-50 dark:bg-gray-800/40 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{q?.term}</div>
                <div className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                  “ {q?.shownMeaning} ”
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {(['O', 'X'] as const).map(btn => (
                  <button
                    key={btn}
                    onClick={() => answer(btn)}
                    className={`py-4 rounded-2xl font-extrabold text-xl transition ${
                      feedback?.pick === btn
                        ? feedback.ok
                          ? 'bg-emerald-500 text-white scale-[1.05]'
                          : 'bg-red-500 text-white scale-[1.05]'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:scale-[1.03]'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {(() => {
                const r = getRank();
                return (
                  <div className="text-center">
                    <div className="text-6xl mb-3">{r.emoji}</div>
                    <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                      {r.text}
                    </div>
                    <div className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                      최종 점수: {score}
                    </div>

                    {/* 틀린 문제 목록 */}
                    {wrongHistory.length > 0 && (
                      <div className="text-left mt-6">
                        <div className="font-semibold mb-3 text-gray-800 dark:text-gray-200">
                          ❌ 틀렸던 문제
                        </div>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                          {wrongHistory.map((w, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm"
                            >
                              <div className="font-semibold">{w.term}</div>
                              <div className="text-gray-500">
                                제시: “{w.shown}” · 네 답: {w.answer}
                              </div>
                              <div className="text-emerald-500">정답: “{w.correct}”</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 justify-center mt-8">
                      <button
                        onClick={resetAll}
                        className="px-5 py-2 rounded-xl bg-emerald-500 text-white"
                      >
                        다시하기
                      </button>
                      <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl ring-1 ring-gray-300"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* 확인 모달 */}
          <ConfirmModal
            open={confirmClose}
            title="정말 닫으시겠습니까?"
            description="현재 진행 상황은 저장되지 않습니다."
            confirmText="닫기"
            cancelText="계속하기"
            onCancel={() => setConfirmClose(false)}
            onConfirm={onClose}
          />
        </div>
      </div>
    </>
  );
}

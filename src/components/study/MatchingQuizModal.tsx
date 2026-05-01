import { useEffect, useMemo, useRef, useState } from 'react';
import type { VocabItem } from './QuizMenuModal';
import ConfirmModal from '../common/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Volume2 } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

type Line = { x1: number; y1: number; x2: number; y2: number };
type Pair = {
  id: string;
  term: string;
  meaning: string;
};

export default function MatchingQuizModal({
  isOpen,
  onClose,
  pool,
}: {
  isOpen: boolean;
  onClose: () => void;
  pool: VocabItem[];
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const COUNT = useMemo(() => Math.min(isMobile ? 3 : 5, pool.length), [isMobile, pool.length]);

  const [pairs, setPairs] = useState<Pair[]>([]);
  const [leftItems, setLeftItems] = useState<Pair[]>([]);
  const [rightItems, setRightItems] = useState<Pair[]>([]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  const [matched, setMatched] = useState<string[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [finished, setFinished] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { speakWord } = useTTS();

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});


  useEffect(() => {
    if (!isOpen) return;

    const picked = shuffle(pool)
      .slice(0, COUNT)
      .map(v => ({
        id: v.id,
        term: v.term,
        meaning: v.meaning,
      }));

    setPairs(picked);
    setLeftItems(shuffle(picked));
    setRightItems(shuffle(picked));

    setSelectedLeft(null);
    setSelectedRight(null);
    setMatched([]);
    setLines([]);
    setFinished(false);
    setWrongFlash(false);
    setErrorIds(new Set());
  }, [isOpen, pool, COUNT]);

  const recomputeLines = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const wRect = wrapper.getBoundingClientRect();
    const nextLines: Line[] = [];

    for (const id of matched) {
      const leftEl = leftRefs.current[id];
      const rightEl = rightRefs.current[id];
      if (!leftEl || !rightEl) continue;

      const lRect = leftEl.getBoundingClientRect();
      const rRect = rightEl.getBoundingClientRect();

      let x1: number, y1: number, x2: number, y2: number;

      if (isMobile) {
        x1 = lRect.left + lRect.width / 2 - wRect.left;
        y1 = lRect.bottom - wRect.top;
        x2 = rRect.left + rRect.width / 2 - wRect.left;
        y2 = rRect.top - wRect.top;
      } else {
        x1 = lRect.right - wRect.left;
        y1 = lRect.top + lRect.height / 2 - wRect.top;
        x2 = rRect.left - wRect.left;
        y2 = rRect.top + rRect.height / 2 - wRect.top;
      }

      nextLines.push({ x1, y1, x2, y2 });
    }

    setLines(nextLines);
  };

  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(recomputeLines);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, matched, leftItems, rightItems, isMobile]);

  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => recomputeLines();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, isMobile, matched]);

  useEffect(() => {
    if (!selectedLeft || !selectedRight) return;

    const ok = selectedLeft === selectedRight;

    if (ok) {
      setMatched(prev => (prev.includes(selectedLeft) ? prev : [...prev, selectedLeft]));
    } else {
      setWrongFlash(true);
      setErrorIds(prev => {
        const next = new Set(prev);
        next.add(selectedLeft);
        next.add(selectedRight);
        return next;
      });
      setTimeout(() => setWrongFlash(false), 250);
    }

    const t = setTimeout(() => {
      setSelectedLeft(null);
      setSelectedRight(null);
    }, 250);

    return () => clearTimeout(t);
  }, [selectedLeft, selectedRight]);

  useEffect(() => {
    if (pairs.length > 0 && matched.length === pairs.length) setFinished(true);
  }, [matched, pairs]);

  useEffect(() => {
    if (finished && pairs.length > 0 && user) {
      saveResults();
    }
  }, [finished]);

  const saveResults = async () => {
    try {
      for (const p of pairs) {
        const isWrong = errorIds.has(p.id);
        const original = pool.find(v => v.id === p.id);
        if (!original) continue;

        let nextStatus = original.status || 'unknown';
        let nextCorrectCount = isWrong ? (original.correctCount || 0) : (original.correctCount || 0) + 1;

        if (!isWrong) {
          if (original.status === 'unknown') nextStatus = 'learning';
          else if (original.status === 'learning' && (original.correctCount || 0) >= 1) nextStatus = 'known';
        } else {
          if (original.status === 'known') nextStatus = 'learning';
          else if (original.status === 'learning') {
            nextStatus = 'learning';
            nextCorrectCount = 0;
          }
        }

        await (supabase.from('user_voca') as any)
          .update({
            status: nextStatus,
            correct_count: nextCorrectCount,
            wrong_count: isWrong ? (original.wrongCount || 0) + 1 : (original.wrongCount || 0),
            last_studied_at: new Date().toISOString(),
          } as any)
          .eq('user_id', user?.id)
          .eq('word_key', p.id);
      }

      const finalScore = Math.floor(pairs.length - errorIds.size / 2);
      const accuracy = pairs.length > 0 ? Math.round((finalScore / pairs.length) * 100) : 0;
      await (supabase.from('quiz_results') as any).insert({
        user_id: user?.id,
        quiz_type: 'matching',
        total: pairs.length,
        score: finalScore,
        accuracy: accuracy,
      });
    } catch (err) {
      console.error('[MatchingQuizModal] Failed to save results:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden">
        {!finished ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-900 dark:text-white">
                <div className="text-xl sm:text-2xl font-bold">매칭 퀴즈</div>
                <div className="text-xs sm:text-sm text-gray-500">단어와 뜻을 올바르게 연결하세요</div>
              </div>

              <button
                onClick={() => setConfirmClose(true)}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 transition"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div ref={wrapperRef} className={`relative ${wrongFlash ? 'animate-pulse' : ''}`}>
              <svg className="absolute inset-0 pointer-events-none z-0" width="100%" height="100%">
                {lines.map((line, i) => (
                  <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#10b981" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                ))}
              </svg>

              <div className="relative z-10">
                {isMobile ? (
                  <div className="flex gap-2 justify-center mb-4">
                    <div className="flex flex-col gap-2">
                      {leftItems.map((item: any) => {
                        const isMatched = matched.includes(item.id);
                        const isSelected = selectedLeft === item.id;
                        return (
                          <button
                            key={item.id}
                            ref={el => (leftRefs.current[item.id] = el)}
                            disabled={isMatched}
                            onClick={() => {
                              setSelectedLeft(item.id);
                              speakWord(item.term);
                            }}
                            className={`w-[130px] p-2.5 rounded-xl text-left font-semibold text-sm transition ${isMatched ? 'bg-emerald-500 text-white' : isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                          >
                            {item.term}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-col gap-2">
                      {rightItems.map((item: any) => {
                        const isMatched = matched.includes(item.id);
                        const isSelected = selectedRight === item.id;
                        return (
                          <button
                            key={item.id}
                            ref={el => (rightRefs.current[item.id] = el)}
                            disabled={isMatched}
                            onClick={() => setSelectedRight(item.id)}
                            className={`w-[160px] p-2.5 rounded-xl text-left text-sm transition ${isMatched ? 'bg-emerald-500 text-white' : isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                          >
                            {item.meaning}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start gap-16">
                    <div className="space-y-3 flex flex-col items-start">
                      {leftItems.map((item: any) => {
                        const isMatched = matched.includes(item.id);
                        const isSelected = selectedLeft === item.id;
                        return (
                          <button
                            ref={el => (leftRefs.current[item.id] = el)}
                            key={item.id}
                            disabled={isMatched}
                            onClick={() => {
                              setSelectedLeft(item.id);
                              speakWord(item.term);
                            }}
                            className={`w-[170px] p-3 rounded-xl text-left font-semibold transition ${isMatched ? 'bg-emerald-500 text-white' : isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:scale-[1.02]'}`}
                          >
                            {item.term}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-3 flex flex-col items-end">
                      {rightItems.map((item: any) => {
                        const isMatched = matched.includes(item.id);
                        const isSelected = selectedRight === item.id;
                        return (
                          <button
                            ref={el => (rightRefs.current[item.id] = el)}
                            key={item.id}
                            disabled={isMatched}
                            onClick={() => setSelectedRight(item.id)}
                            className={`w-[260px] p-3 rounded-xl text-left transition ${isMatched ? 'bg-emerald-500 text-white' : isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:scale-[1.02]'}`}
                          >
                            {item.meaning}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl sm:text-6xl mb-4">🎉</div>
            <div className="text-2xl sm:text-3xl font-bold mb-2">완료!</div>
            <div className="text-sm text-gray-500 mb-6">모든 단어를 정확히 연결했습니다.</div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setMatched([]);
                  setLines([]);
                  setErrorIds(new Set());
                  
                  const picked = shuffle(pool)
                    .slice(0, COUNT)
                    .map(v => ({
                      id: v.id,
                      term: v.term,
                      meaning: v.meaning,
                    }));

                  setPairs(picked);
                  setLeftItems(shuffle(picked));
                  setRightItems(shuffle(picked));
                  setTimeout(() => setFinished(false), 0);
                  setSelectedLeft(null);
                  setSelectedRight(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm sm:text-base"
              >
                다시하기
              </button>
              <button onClick={onClose} className="px-5 py-2 rounded-xl ring-1 ring-gray-300 text-sm sm:text-base">닫기</button>
            </div>
          </div>
        )}

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
  );
}

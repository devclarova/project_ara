import { useEffect, useState } from 'react';
import type { VocabItem } from './QuizMenuModal';
import ConfirmModal from '../common/ConfirmModal';

export default function McqQuizModal({
  isOpen,
  onClose,
  pool,
}: {
  isOpen: boolean;
  onClose: () => void;
  pool: VocabItem[];
}) {
  const TOTAL = Math.min(10, pool.length || 1);
  const MAX_LIFE = 3;

  const [questions, setQuestions] = useState<VocabItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [life, setLife] = useState(MAX_LIFE);
  const [combo, setCombo] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [wrongHistory, setWrongHistory] = useState<{ term: string; correct: string }[]>([]);
  const [confirmClose, setConfirmClose] = useState(false);

  const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

  useEffect(() => {
    if (!isOpen) return;

    const picked = pool.length > 0 ? shuffle(pool).slice(0, TOTAL) : [];

    setQuestions(picked);
    setCurrent(0);
    setScore(0);
    setLife(MAX_LIFE);
    setCombo(0);
    setSelected(null);
    setFinished(false);
    setWrongHistory([]);
    setConfirmClose(false);
  }, [isOpen, pool, TOTAL]);

  useEffect(() => {
    if (!questions[current]) return;

    const correct = questions[current].meaning;
    const wrongPool = pool.filter(p => p.meaning !== correct).map(p => p.meaning);

    const wrongs =
      wrongPool.length >= 3
        ? shuffle(wrongPool).slice(0, 3)
        : shuffle([...wrongPool, ...Array(3 - wrongPool.length).fill('보기 없음')]);

    setChoices(shuffle([correct, ...wrongs]));
  }, [current, questions, pool]);

  if (!isOpen) return null;

  const handleSelect = (choice: string) => {
    if (selected) return;

    const correct = questions[current].meaning;
    const isCorrect = choice === correct;

    setSelected(choice);

    if (isCorrect) {
      setScore(s => s + 1);
      setCombo(c => c + 1);

      setTimeout(() => {
        if (current + 1 >= TOTAL) {
          setFinished(true);
        } else {
          setCurrent(c => c + 1);
          setSelected(null);
        }
      }, 800);
    } else {
      setLife(l => l - 1);
      setCombo(0);

      setWrongHistory(prev => {
        // 데이터 영속화 준비 — 오답 발생 시 해당 문항의 메타데이터(용어, 정답)를 히스토리에 기록
        const term = questions[current].term;
        const already = prev.find(p => p.term === term);
        if (already) return prev;
        return [...prev, { term, correct }];
      });

      if (life - 1 <= 0) {
        setTimeout(() => setFinished(true), 700);
      } else {
        setTimeout(() => {
          setSelected(null);
        }, 600);
      }
    }
  };

  const restart = () => {
    const picked = pool.length > 0 ? shuffle(pool).slice(0, TOTAL) : [];

    setQuestions(picked);
    setCurrent(0);
    setScore(0);
    setLife(MAX_LIFE);
    setCombo(0);
    setSelected(null);
    setFinished(false);
    setWrongHistory([]);
    setConfirmClose(false);
  };

  const progress = ((current + 1) / TOTAL) * 100;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div
        className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-y-auto max-h-[85vh]"
        onMouseDownCapture={e => e.stopPropagation()}
        onTouchStartCapture={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold text-gray-900 dark:text-white">4지선다 스피드</div>

          {/* 시각적 피드백 — 오답 발생 시 상단 중앙에 페널티 시간(-2초) 팝업 및 화면 흔들림 효과 트리거 */}
          <button
            onClick={() => setConfirmClose(true)}
            className="h-9 w-9 rounded-full flex items-center justify-center
                       bg-gray-100 hover:bg-gray-200
                       dark:bg-white/10 dark:hover:bg-white/15 transition"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!finished ? (
          <>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                문제 {current + 1} / {TOTAL}
              </div>
              <div className="text-red-500 text-lg">{'❤️'.repeat(life)}</div>
            </div>

            <div className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              {questions[current]?.term}
            </div>

            {combo >= 2 && (
              <div className="text-center mb-4 text-orange-500 font-bold animate-pulse">
                🔥 {combo} 콤보!
              </div>
            )}

            <div className="grid gap-3">
              {choices.map(choice => {
                const correct = questions[current]?.meaning;
                let style =
                  'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:scale-[1.03]';

                if (selected) {
                  if (choice === selected && choice === correct)
                    style = 'bg-emerald-500 text-white border-emerald-500 scale-[1.05]';
                  else if (choice === selected && choice !== correct)
                    style = 'bg-red-500 text-white border-red-500 scale-[1.05]';
                  else
                    style =
                      'bg-gray-200 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700';
                }

                return (
                  <button
                    key={choice}
                    onClick={() => handleSelect(choice)}
                    className={`p-4 rounded-2xl font-medium transition-all duration-200 border text-left ${style}`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              점수: <span className="font-bold">{score}</span>
            </div>
          </>
        ) : (
          <div className="text-center mt-6">
            <div className="text-3xl font-bold mb-4">
              최종 점수: {score} / {TOTAL}
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={restart} className="px-5 py-2 rounded-xl bg-emerald-500 text-white">
                다시하기
              </button>

              <button onClick={onClose} className="px-5 py-2 rounded-xl ring-1 ring-gray-300">
                닫기
              </button>
            </div>
          </div>
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
  );
}

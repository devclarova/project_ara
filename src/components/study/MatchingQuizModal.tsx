import { useEffect, useMemo, useRef, useState } from 'react';
import type { VocabItem } from './QuizMenuModal';
import ConfirmModal from '../common/ConfirmModal';

type Pair = {
  id: string;
  term: string;
  meaning: string;
};

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

type Line = { x1: number; y1: number; x2: number; y2: number };

export default function MatchingQuizModal({
  isOpen,
  onClose,
  pool,
}: {
  isOpen: boolean;
  onClose: () => void;
  pool: VocabItem[];
}) {
  /* =========================
     📱 반응형 인터페이스 — 뷰포트 너비 변화에 따른 레이아웃(세로/가로) 및 선 좌표 동적 대응
  ========================= */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* =========================
     🎯 개수 (모바일 3 / PC 5)
  ========================= */
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

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  /* =========================
     🔄 데이터 셔플링 — 퀴즈 세션 활성화 시 문제 풀(Pool)에서 무작위 샘플링 및 선택지 분산 배치
  ========================= */
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
  }, [isOpen, pool, COUNT]);

  /* =========================
     ✅ 선 좌표 계산 엔진 — 'matched' 상태를 기반으로 SVG 경로(Line)의 시작/끝 좌표를 DOM 기하 구조에 맞게 재계산
     - 윈도우 리사이즈 및 레이아웃 변경 시 좌표 무결성 유지 목적
  ========================= */
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
        // 📱 위(단어) → 아래(뜻) : 세로 연결
        x1 = lRect.left + lRect.width / 2 - wRect.left;
        y1 = lRect.bottom - wRect.top;
        x2 = rRect.left + rRect.width / 2 - wRect.left;
        y2 = rRect.top - wRect.top;
      } else {
        // 💻 좌(단어) → 우(뜻) : 가로 연결
        x1 = lRect.right - wRect.left;
        y1 = lRect.top + lRect.height / 2 - wRect.top;
        x2 = rRect.left - wRect.left;
        y2 = rRect.top + rRect.height / 2 - wRect.top;
      }

      nextLines.push({ x1, y1, x2, y2 });
    }

    setLines(nextLines);
  };

  // matched / 레이아웃 변화 시 선 재계산
  useEffect(() => {
    if (!isOpen) return;
    // DOM 배치가 끝난 뒤 계산
    const raf = requestAnimationFrame(recomputeLines);
    return () => cancelAnimationFrame(raf);
    // leftItems/rightItems 바뀌면 버튼 위치도 바뀜 -> 포함
  }, [isOpen, matched, leftItems, rightItems, isMobile]);

  // 리사이즈 때도 선 재계산
  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => recomputeLines();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, isMobile, matched]);

  /* =========================
     🔗 매칭 무결성 처리 — 활성 선택지 간의 일치 여부 판별 및 시각적 피드백(Flash) 제어
  ========================= */
  useEffect(() => {
    if (!selectedLeft || !selectedRight) return;

    const ok = selectedLeft === selectedRight;

    if (ok) {
      setMatched(prev => (prev.includes(selectedLeft) ? prev : [...prev, selectedLeft]));
    } else {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 250);
    }

    const t = setTimeout(() => {
      setSelectedLeft(null);
      setSelectedRight(null);
    }, 250);

    return () => clearTimeout(t);
  }, [selectedLeft, selectedRight]);

  /* =========================
     🎉 완료 체크
  ========================= */
  useEffect(() => {
    if (pairs.length > 0 && matched.length === pairs.length) setFinished(true);
  }, [matched, pairs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {!finished ? (
          <>
            {/* 상단 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                <div className="text-2xl font-bold">매칭 퀴즈</div>
                <div className="text-sm text-gray-500">단어와 뜻을 올바르게 연결하세요</div>
              </div>

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

            {/* wrapper: 선 기준 좌표계 */}
            <div ref={wrapperRef} className={`relative ${wrongFlash ? 'animate-pulse' : ''}`}>
              {/* 선(SVG)은 항상 아래 */}
              <svg className="absolute inset-0 pointer-events-none z-0" width="100%" height="100%">
                {lines.map((line, i) => (
                  <line
                    key={i}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>

              {/* 버튼/컨텐츠는 항상 위 */}
              <div className="relative z-10">
                {isMobile ? (
                  <>
                    {/* 📱 단어 3열 */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                      {leftItems.map((item: any) => {
                        const isMatched = matched.includes(item.id);
                        const isSelected = selectedLeft === item.id;

                        return (
                          <button
                            ref={el => (leftRefs.current[item.id] = el)}
                            key={item.id}
                            disabled={isMatched}
                            onClick={() => setSelectedLeft(item.id)}
                            className={`
                  w-full p-3 rounded-xl text-center font-semibold transition
                  ${isMatched ? 'bg-emerald-500 text-white' : isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}
                `}
                          >
                            {item.term}
                          </button>
                        );
                      })}
                    </div>

                    {/* 📱 뜻 3열 */}
                    <div className="grid grid-cols-3 gap-3">
                      {rightItems.map((item: any) => {
                        const isMatched = matched.includes(item.id);
                        const isSelected = selectedRight === item.id;

                        return (
                          <button
                            ref={el => (rightRefs.current[item.id] = el)}
                            key={item.id}
                            disabled={isMatched}
                            onClick={() => setSelectedRight(item.id)}
                            className={`
                  w-full p-3 rounded-xl text-center transition
                  ${isMatched ? 'bg-emerald-500 text-white' : isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}
                `}
                          >
                            {item.meaning}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* 💻 PC: 좌/우 flex로 고정 */
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
                            onClick={() => setSelectedLeft(item.id)}
                            className={`
                  w-[170px] p-3 rounded-xl text-left font-semibold transition
                  ${isMatched ? 'bg-emerald-500 text-white' : isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:scale-[1.02]'}
                `}
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
                            className={`
                  w-[260px] p-3 rounded-xl text-left transition
                  ${isMatched ? 'bg-emerald-500 text-white' : isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:scale-[1.02]'}
                `}
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
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-3xl font-bold mb-2">완료!</div>
            <div className="text-gray-500 mb-6">모든 단어를 정확히 연결했습니다.</div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setFinished(false);
                  setMatched([]);
                  setLines([]);
                  setLeftItems(shuffle(pairs));
                  setRightItems(shuffle(pairs));
                  setSelectedLeft(null);
                  setSelectedRight(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-white"
              >
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

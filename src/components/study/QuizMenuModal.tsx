import { useEffect, useMemo, useState } from 'react';
import McqQuizModal from './McqQuizModal';
import MatchingQuizModal from './MatchingQuizModal';
import OxQuizModal from './OxQuizModal';

export type VocabItem = {
  id: string;
  term: string;
  meaning: string;
  wrongCount?: number;
};

export default function QuizMenuModal({
  isOpen,
  onClose,
  totalCount,
  matchingCount,
  pool,
}: {
  isOpen: boolean;
  onClose: () => void;
  totalCount: number;
  matchingCount: number;
  pool: VocabItem[];
}) {
  const cards = useMemo(
    () => [
      {
        key: 'mcq' as const,
        title: '4지선다',
        subtitle: '10문제 · 콤보/하트 · 즉시 채점',
        image: '/images/Multiple_Choice_Quiz.png',
        disabled: totalCount < 4,
        disabledHint: '단어가 4개 이상 필요해요',
      },
      {
        key: 'ox' as const,
        title: 'OX 스피드',
        subtitle: '60초 동안 최대한 많이 맞추기',
        image: '/images/OX_Quiz.png',
        disabled: totalCount < 1,
        disabledHint: '단어가 1개 이상 필요해요',
      },
      {
        key: 'matching' as const,
        title: '매칭 퀴즈',
        subtitle: `${totalCount}개 중 랜덤 연결 학습`,
        image: '/images/Matching_Quiz.png',
        disabled: totalCount < 2,
        disabledHint: '단어가 2개 이상 필요해요',
      },
    ],
    [totalCount, matchingCount],
  );

  const [idx, setIdx] = useState(0);
  const [activeQuiz, setActiveQuiz] = useState<null | 'mcq' | 'ox' | 'matching'>(null);

  useEffect(() => {
    if (isOpen) setIdx(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const c = cards[idx];
  const disabled = c.disabled;
  const isFirst = idx === 0;
  const isLast = idx === cards.length - 1;

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(cards.length - 1, i + 1));

  const openQuiz = (key: 'mcq' | 'ox' | 'matching') => {
    setActiveQuiz(key);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />

      <div
        className="relative w-full sm:max-w-5xl bg-white dark:bg-secondary rounded-3xl ring-1 ring-gray-200 shadow-2xl overflow-y-auto max-h-[80dvh] sm:max-h-[90vh] p-5 sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg sm:text-xl font-bold">퀴즈 선택</div>
            <div className="text-sm text-gray-500 mt-1">내 단어장 {totalCount}개 기반</div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-gray-200 ring-1 ring-gray-200 dark:hover:bg-white/5"
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

        {/* Mobile */}
        <div className="mt-4 sm:hidden">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                openQuiz(c.key);
              }}
              className={`group relative w-full overflow-hidden rounded-3xl ring-1 text-left transition
                ${disabled ? 'ring-gray-200 opacity-60 cursor-not-allowed' : 'ring-gray-200 active:scale-[0.99]'}
              `}
              style={{ aspectRatio: '4 / 5' }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
                style={{ backgroundImage: `url(${c.image})` }}
              />
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              <div className="relative h-full w-full p-5 flex flex-col justify-end">
                <div className="text-white">
                  <div className="text-xl font-extrabold tracking-tight">{c.title}</div>
                  <div className="mt-2 text-xs text-white/80">{c.subtitle}</div>

                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-semibold
                        ${disabled ? 'bg-white/20 text-white/80' : 'bg-emerald-300 text-gray-900'}
                      `}
                    >
                      바로가기
                    </span>
                  </div>

                  {disabled && <div className="mt-3 text-xs text-white/75">{c.disabledHint}</div>}
                </div>
              </div>
            </button>

            {!isFirst && (
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/85 hover:bg-white ring-1 ring-black/10 shadow-sm flex items-center justify-center"
                aria-label="이전 퀴즈"
              >
                ←
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/85 hover:bg-white ring-1 ring-black/10 shadow-sm flex items-center justify-center"
                aria-label="다음 퀴즈"
              >
                →
              </button>
            )}
          </div>

          <div className="mt-2 text-center text-xs text-gray-500">버튼으로 넘겨서 선택해요</div>
        </div>

        {/* Desktop */}
        <div className="mt-5 hidden sm:grid sm:grid-cols-3 gap-4">
          {cards.map(card => {
            const dis = card.disabled;

            return (
              <button
                key={card.key}
                type="button"
                onClick={() => {
                  if (dis) return;
                  openQuiz(card.key);
                }}
                className={`group relative overflow-hidden rounded-3xl ring-1 text-left transition
                  ${dis ? 'ring-gray-200 opacity-60 cursor-not-allowed' : 'ring-gray-200 hover:ring-primary/60'}
                `}
                style={{ aspectRatio: '3 / 4' }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
                  style={{ backgroundImage: `url(${card.image})` }}
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="relative h-full w-full p-5 flex flex-col justify-end">
                  <div className="text-white">
                    <div className="text-xl font-extrabold tracking-tight">{card.title}</div>
                    <div className="mt-2 text-xs text-white/80">{card.subtitle}</div>

                    <div className="mt-4">
                      <span
                        className={`inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-semibold
                          ${dis ? 'bg-white/20 text-white/80' : 'bg-emerald-300 text-gray-900'}
                        `}
                      >
                        바로가기
                      </span>
                    </div>

                    {dis && <div className="mt-3 text-xs text-white/75">{card.disabledHint}</div>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          팁: 4지선다는 보기를 만들기 위해 단어가 4개 이상일 때 가장 자연스러워요.
        </div>
      </div>

      {/* 퀴즈 모달들 */}
      {activeQuiz === 'mcq' && (
        <McqQuizModal isOpen onClose={() => setActiveQuiz(null)} pool={pool} />
      )}

      {activeQuiz === 'ox' && (
        <OxQuizModal isOpen onClose={() => setActiveQuiz(null)} pool={pool} />
      )}
      {activeQuiz === 'matching' && (
        <MatchingQuizModal isOpen onClose={() => setActiveQuiz(null)} pool={pool} />
      )}
    </div>
  );
}

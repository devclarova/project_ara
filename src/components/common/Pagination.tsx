import { useEffect, useMemo, useState } from 'react';

type PaginationProps = {
  totalPages: number;
  page: number;
  onPageChange: (p: number) => void;
  windowSize?: number; // 기본 3
  className?: string; // 래퍼 클래스 커스터마이즈
  autoScrollTop?: boolean; // 숫자 클릭 시 상단 스크롤
};

export default function Pagination({
  totalPages,
  page,
  onPageChange,
  windowSize = 3,
  className = 'flex flex-wrap justify-center items-center gap-2 sm:gap-3 my-6 sm:my-8',
  autoScrollTop = true,
}: PaginationProps) {
  // 현재 묶음의 시작 페이지 (1, 4, 7 ...)
  const [winStart, setWinStart] = useState(1);

  // page가 바뀌면 묶음 동기화 (예: 1~3, 4~6, 7~9 ...)
  useEffect(() => {
    const start = Math.floor((Math.max(1, page) - 1) / windowSize) * windowSize + 1;
    if (start !== winStart) setWinStart(start);
  }, [page, totalPages, windowSize]);

  const winEnd = useMemo(
    () => Math.min(winStart + windowSize - 1, Math.max(1, totalPages)),
    [winStart, windowSize, totalPages],
  );

  if (!totalPages || totalPages <= 1) return null;

  const hasPrevWindow = winStart > 1;
  const hasNextWindow = winEnd < totalPages;

  const lastWindowStart = Math.max(1, (Math.ceil(totalPages / windowSize) - 1) * windowSize + 1);

  const handleNumberClick = (num: number) => {
    onPageChange(num);
    if (autoScrollTop && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={className}>
      {/* 이전 묶음 화살표: 묶음만 이동, 페이지는 그대로 */}
      {hasPrevWindow && (
        <button
          onClick={() => setWinStart(Math.max(1, winStart - windowSize))}
          className="text-sm sm:text-base lg:text-lg text-gray-500 hover:text-gray-900 transition"
          aria-label="Previous pages"
        >
          <i className="ri-arrow-drop-left-line text-3xl transition-transform duration-200 group-hover:-translate-x-1" />
        </button>
      )}

      {/* 숫자 3개(또는 끝에서 부족하면 그만큼)만 노출 */}
      {Array.from({ length: winEnd - winStart + 1 }, (_, i) => winStart + i).map(num => (
        <button
          key={num}
          onClick={() => handleNumberClick(num)}
          className={`px-3 sm:px-4 lg:px-5 py-1 sm:py-1.5 lg:py-2 text-sm sm:text-base lg:text-lg
          ${page === num ? 'text-primary underline' : 'text-gray-700 dark:text-gray-600'} transition`}
          aria-current={page === num ? 'page' : undefined}
        >
          {num}
        </button>
      ))}

      {/* 다음 묶음 화살표: 묶음만 이동, 페이지는 그대로 */}
      {hasNextWindow && (
        <button
          onClick={() => setWinStart(Math.min(lastWindowStart, winStart + windowSize))}
          className="text-sm sm:text-base lg:text-lg text-gray-500 hover:text-gray-900 transition"
          aria-label="Next pages"
        >
          <i className="ri-arrow-drop-right-line text-3xl transition-transform duration-200 group-hover:-translate-x-1" />
        </button>
      )}
    </div>
  );
}

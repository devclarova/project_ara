/**
 * 윈도우 기반 동적 페이지네이션 모듈(Window-based Dynamic Pagination Module):
 * - 목적(Why): 대규모 목록 검색 결과에 대한 효율적인 탐색 경로를 제공하여 서버 부하 분산 및 UX 성능을 개선함
 * - 방법(How): 고정된 윈도우 사이즈(Window Size) 기반의 인덱스 슬라이딩 알고리즘을 적용하여 방대한 페이지 범위를 압축적으로 시각화하고 상단 자동 스크롤(Auto-scroll) 기능을 지원함
 */
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
  // Window-based Indexing: Defines the starting point for the visible range of page numbers (e.g., 1, 4, 7).
  const [winStart, setWinStart] = useState(1);

  // Dynamic Re-indexing: Synchronizes the visible window with the active page index to ensure the current page remains in-view.
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
      {/* Window Navigation (Prev): Shifts the visible page group back by one window unit without modifying selection. */}
      {hasPrevWindow && (
        <button
          onClick={() => setWinStart(Math.max(1, winStart - windowSize))}
          className="text-sm sm:text-base lg:text-lg text-gray-500 hover:text-gray-900 transition"
          aria-label="Previous pages"
        >
          <i className="ri-arrow-drop-left-line text-3xl transition-transform duration-200 group-hover:-translate-x-1" />
        </button>
      )}

      {/* Range-based Rendering: Dynamically generates interactive page number elements for the current visible window. */}
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

      {/* Window Navigation (Next): Shifts the visible page group forward by one window unit without modifying selection. */}
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

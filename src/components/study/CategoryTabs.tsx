import { useCallback, type KeyboardEvent } from 'react';

export type TCategory = '전체' | '드라마' | '영화' | '예능' | '음악';
export const CATEGORIES: TCategory[] = ['전체', '드라마', '영화', '예능', '음악'];

type CategoryTabsProps = {
  active: TCategory;
  onChange: (value: TCategory) => void;
  className?: string;
};

const CategoryTabs = ({ active, onChange, className = '' }: CategoryTabsProps) => {
  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const idx = CATEGORIES.indexOf(active);
      if (idx < 0) return;
      if (e.key === 'ArrowRight') {
        const next = CATEGORIES[(idx + 1) % CATEGORIES.length];
        onChange(next);
      } else if (e.key === 'ArrowLeft') {
        const prev = CATEGORIES[(idx - 1 + CATEGORIES.length) % CATEGORIES.length];
        onChange(prev);
      }
    },
    [active, onChange],
  );

  return (
    <div className={`w-full ${className}`}>
      {/* 모바일 가로 스크롤 + 탭 롤 */}
      <div
        role="tablist"
        aria-label="콘텐츠 카테고리"
        onKeyDown={handleKey}
        className="flex gap-3 xs:gap-3 sm:gap-4 px-1 sm:px-0 min-w-max overflow-x-auto scrollbar-none"
      >
        {CATEGORIES.map(c => {
          const isActive = active === c;
          return (
            <button
              key={c}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${c}`}
              onClick={() => onChange(c)}
              // 밑줄 absolute를 위해 relative 필요, 높이 확보로 레이아웃 점프 방지
              className={[
                'relative px-5 xs:px-4 sm:px-5 py-2.5 sm:py-3',
                'text-sm sm:text-base font-extrabold whitespace-nowrap',
                'transition-colors duration-300',
                isActive ? 'text-primary' : 'text-gray-600 hover:text-black',
              ].join(' ')}
            >
              <span className="inline-block">{c}</span>
              {/* 밑줄: 높이 고정, bottom:-2px로 살짝 내려 깔끔 */}
              <span
                className={[
                  'pointer-events-none absolute left-0 bottom-0 h-[3px] rounded-full',
                  'transition-all duration-300 ease-out',
                  isActive ? 'w-full bg-primary' : 'w-0 bg-transparent',
                ].join(' ')}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;

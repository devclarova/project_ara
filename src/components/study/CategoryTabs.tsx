import { useCallback, type KeyboardEvent } from 'react';

export type TCategory = '전체' | '드라마' | '영화' | '예능' | '음악';
export const CATEGORIES: TCategory[] = ['전체', '드라마', '영화', '예능', '음악'];

type CategoryTabsProps = {
  active: TCategory;
  onChange: (value: TCategory) => void;
  className?: string;
  categories?: { value: TCategory; label: string }[];
};

const DEFAULT_CATEGORIES: { value: TCategory; label: string }[] = CATEGORIES.map(c => ({ value: c, label: c }));

const CategoryTabs = ({ active, onChange, className = '', categories = DEFAULT_CATEGORIES }: CategoryTabsProps) => {
  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const items = categories.map(c => c.value);
      const idx = items.indexOf(active);
      if (idx < 0) return;
      if (e.key === 'ArrowRight') {
        const next = items[(idx + 1) % items.length];
        onChange(next);
      } else if (e.key === 'ArrowLeft') {
        const prev = items[(idx - 1 + items.length) % items.length];
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
        className="flex gap-0 xs:gap-2 sm:gap-3 px-1 sm:px-0 min-w-max overflow-x-auto scrollbar-none"
      >
        {categories.map((item) => {
          const c = item.value;
          const label = item.label;
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
                'relative px-3 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-2 xs:py-2 sm:py-2.5 md:py-3',
                'text-xs sm:text-sm md:text-base font-extrabold whitespace-nowrap',
                'transition-colors duration-300',
                isActive
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-gray-400',
              ].join(' ')}
            >
              <span className="inline-block">{label}</span>
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

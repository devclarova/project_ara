import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CheckboxSquare from '../common/CheckboxSquare';

export type TDifficulty = '' | '초급' | '중급' | '고급';

type FilterValue = string;

interface FilterOption {
  label: string;
  value: string;
}

const DEFAULT_LEVEL_OPTIONS: FilterOption[] = [
  { label: '전체', value: '' },
  { label: '초급', value: '초급' },
  { label: '중급', value: '중급' },
  { label: '고급', value: '고급' },
];

interface FilterDropdownProps {
  value: string;
  onApply: (next: string) => void;
  labelMap?: Record<string, string>;
  options?: FilterOption[];
  title?: string;
}

const FilterDropdown = ({
  value,
  onApply,
  labelMap,
  options = DEFAULT_LEVEL_OPTIONS,
  title = '난이도 선택',
}: FilterDropdownProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 안에서만 쓰는 '초안' 난이도 상태
  const [draft, setDraft] = useState<FilterValue>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={[
          'shrink-0 h-11 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-full',
          'ring-1 ring-gray-200 dark:ring-white/10',
          'bg-white/70 dark:bg-white/5',
          'text-gray-700 dark:text-gray-200',
          'transition-all whitespace-nowrap',
          open
            ? 'ring-primary/50 bg-primary/20 dark:bg-primary/25 text-primary'
            : 'hover:ring-primary/50 hover:bg-primary/20 dark:hover:bg-primary/25 hover:text-primary',
        ].join(' ')}
      >
        <span className="text-sm font-semibold">
          {labelMap
            ? labelMap[value] || options.find(option => option.value === value)?.label || value
            : options.find(option => option.value === value)?.label || value || '필터'}
        </span>

        <i className="ri-filter-line text-lg" />
      </button>

      {open && (
        <div className="absolute right-0 lg:right-auto lg:left-0 mt-2 w-56 rounded-2xl ring-1 ring-gray-200 dark:ring-white/10 bg-white dark:bg-secondary shadow-xl z-[999] overflow-hidden">
          <div className="p-4 space-y-4">
            {/* 난이도 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-100">{title}</h3>
              </div>
              <div className="space-y-2">
                {/* <label className="flex items-center">
                  <CheckboxSquare checked={draft === ''} onChange={() => setDraft('')} />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-100">
                    {labelMap ? labelMap[''] || '전체' : '전체'}
                  </span>
                </label> */}
                {options.map(option => (
                  <label key={option.value} className="flex items-center">
                    <CheckboxSquare
                      checked={draft === option.value}
                      onChange={() => setDraft(option.value)}
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-100">
                      {labelMap ? labelMap[option.value] || option.label : option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 콘텐츠 유형 */}
            {/* <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">콘텐츠 유형</h3>
              <div className="space-y-2">
                {['드라마', '예능', '영화', '음악'].map(label => (
                  <label key={label} className="flex items-center">
                    <input type="checkbox" className="form-checkbox text-primary" />
                    <span className="ml-2 text-sm text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
            </div> */}

            {/* 학습 시간 */}
            {/* <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">학습 시간</h3>
              <div className="space-y-2">
                {['1분 미만', '3분 미만', '5분 미만', '10분 미만', '10분 이상'].map(label => (
                  <label key={label} className="flex items-center">
                    <input type="radio" name="duration" className="form-radio text-primary" />
                    <span className="ml-2 text-sm text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
            </div> */}

            {/* 정렬 */}
            {/* <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">정렬</h3>
              <select className="w-full text-sm text-gray-600 border dark:text-gray-100 dark:bg-secondary border-gray-200 dark:border-gray-500 rounded-button px-3 py-2">
                <option>최신순</option>
                <option>인기순</option>
              </select>
            </div> */}

            <div className="flex justify-end pt-2 gap-2">
              <button
                onClick={() => setOpen(false)} // ← 취소용이라면 OK, 하지만 적용은 아래 버튼에서!
                type="button"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  onApply(draft);
                  setOpen(false);
                }} // 적용하기: onApply 호출 + 닫기
                type="button"
              >
                {t('common.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;

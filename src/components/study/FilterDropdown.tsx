import { useEffect, useRef, useState } from 'react';
import CheckboxSquare from '../common/CheckboxSquare';

export type TDifficulty = '' | '초급' | '중급' | '고급';

interface FilterDropdownProps {
  value: TDifficulty; // 현재 적용된(부모가 들고있는) 난이도
  onApply: (next: TDifficulty) => void; // 적용하기 눌렀을 때 부모로 반영
}

const DIFFS: Exclude<TDifficulty, ''>[] = ['초급', '중급', '고급'];

const FilterDropdown = ({ value, onApply }: FilterDropdownProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 안에서만 쓰는 '초안' 난이도 상태
  const [draft, setDraft] = useState<TDifficulty>(value);

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
          'flex items-center gap-2 px-3 h-10 rounded-button transition-all whitespace-nowrap',
          value
            ? 'text-primary dark:text-primary'
            : 'text-gray-600 dark:text-gray-300 hover:text-black',
        ].join(' ')}
      >
        {value && <span className="text-sm">{value}</span>}
        <i className="ri-filter-line text-2xl" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-secondary rounded-lg shadow-lg border border-gray-100 dark:border-secondary z-[999]">
          <div className="p-4 space-y-4">
            {/* 난이도 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-100">난이도</h3>
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <CheckboxSquare checked={draft === ''} onChange={() => setDraft('')} />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-100">전체</span>
                </label>
                {DIFFS.map(label => (
                  <label key={label} className="flex items-center">
                    <CheckboxSquare
                      key={label}
                      checked={draft === label}
                      onChange={() => setDraft(label)}
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-100">{label}</span>
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
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">정렬</h3>
              <select className="w-full text-sm text-gray-600 border dark:text-gray-100 dark:bg-secondary border-gray-200 dark:border-gray-500 rounded-button px-3 py-2">
                <option>최신순</option>
                <option>인기순</option>
              </select>
            </div>

            <div className="flex justify-end pt-2 gap-2">
              <button
                onClick={() => setOpen(false)} // ← 취소용이라면 OK, 하지만 적용은 아래 버튼에서!
                className="px-3 py-2 text-sm text-gray-700 bg-gray-100 dark:bg-gray-400 dark:hover:bg-gray-500 rounded-button"
                type="button"
              >
                취소
              </button>
              <button
                onClick={() => {
                  onApply(draft);
                  setOpen(false);
                }} // ✅ 적용하기: onApply 호출 + 닫기
                className="px-4 py-2 text-sm text-white bg-primary rounded-button whitespace-nowrap dark:hover:opacity-90"
                type="button"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;

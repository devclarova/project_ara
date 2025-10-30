import { useState } from 'react';

const FilterDropdown = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 text-primary border border-primary rounded-button hover:bg-primary hover:text-white transition-all whitespace-nowrap"
      >
        <i className="ri-filter-line text-sm" />
        필터
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          <div className="p-4 space-y-4">
            {/* 난이도 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">난이도</h3>
              <div className="space-y-2">
                {['초급', '중급', '고급'].map(label => (
                  <label key={label} className="flex items-center">
                    <input type="checkbox" className="form-checkbox text-primary" />
                    <span className="ml-2 text-sm text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 콘텐츠 유형 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">콘텐츠 유형</h3>
              <div className="space-y-2">
                {['드라마', '예능', '영화', '음악'].map(label => (
                  <label key={label} className="flex items-center">
                    <input type="checkbox" className="form-checkbox text-primary" />
                    <span className="ml-2 text-sm text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 학습 시간 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">학습 시간</h3>
              <div className="space-y-2">
                {['5분 이하', '5-10분', '10분 이상'].map(label => (
                  <label key={label} className="flex items-center">
                    <input type="radio" name="duration" className="form-radio text-primary" />
                    <span className="ml-2 text-sm text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 정렬 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">정렬</h3>
              <select className="w-full text-sm text-gray-600 border border-gray-200 rounded-button px-3 py-2">
                <option>최신순</option>
                <option>인기순</option>
                <option>댓글순</option>
              </select>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-white bg-primary rounded-button whitespace-nowrap"
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

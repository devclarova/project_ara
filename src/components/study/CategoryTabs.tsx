const categories = ['전체', '드라마', '영화', '예능', '음악'];

type CategoryTabsProps = {
  active: string; // 현재 선택된 카테고리 (외부에서 제어)
  onChange: (value: string) => void; // 클릭 시 부모로 전달
};

const CategoryTabs = ({ active, onChange }: CategoryTabsProps) => {
  return (
    <div className="w-full">
      <div className="flex gap-3 xs:gap-3 sm:gap-4 mb-6 sm:mb-8 px-1 sm:px-0 min-w-max">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`px-5 xs:px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-medium whitespace-nowrap rounded-button transition-colors ${
              active === c ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;

const categories = ['전체', '드라마', '영화', '예능', '음악'];

type CategoryTabsProps = {
  active: string; // 현재 선택된 카테고리 (외부에서 제어)
  onChange: (value: string) => void; // 클릭 시 부모로 전달
};

const CategoryTabs = ({ active, onChange }: CategoryTabsProps) => {
  return (
    <div className="w-full">
      <div className="flex gap-3 xs:gap-3 sm:gap-4 px-1 sm:px-0 min-w-max">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`relative px-5 xs:px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-extrabold whitespace-nowrap transition-colors duration-300 ${active === c ? 'text-primary' : 'text-gray-600 hover:text-black'}`}
          >
            {c}
            <span
              className={`absolute left-0 bottom-0 h-[3px] rounded-full transition-all duration-300 ease-out ${active === c ? 'w-full bg-primary' : 'w-0 bg-transparent'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;

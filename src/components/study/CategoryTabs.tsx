import { useState } from 'react';

const categories = ['전체', '드라마', '영화', '예능', '음악'];

const CategoryTabs = () => {
  const [active, setActive] = useState('전체');
  return (
    <div className="w-full">
      <div className="flex gap-3 xs:gap-3 sm:gap-4 mb-6 sm:mb-8 px-1 sm:px-0 min-w-max">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setActive(c)}
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

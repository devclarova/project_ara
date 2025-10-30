import { useState } from 'react';

const categories = ['전체', '드라마', '영화', '예능', '음악'];

const CategoryTabs = () => {
  const [active, setActive] = useState('전체');
  return (
    <div className="flex gap-4 mb-8">
      {categories.map(c => (
        <button
          key={c}
          onClick={() => setActive(c)}
          className={`px-6 py-3 font-medium whitespace-nowrap !rounded-button ${
            active === c
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;

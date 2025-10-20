const SearchBar = () => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <i className="ri-search-line text-gray-400"></i>
      </div>
      <input
        type="text"
        placeholder="Search"
        className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full border-none outline-none focus:bg-white focus:ring-2 focus:ring-primary text-sm"
      />
    </div>
  );
};

export default SearchBar;

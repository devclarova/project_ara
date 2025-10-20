// src/pages/ExplorePage.tsx

import SidebarLeft from '../../components/layout/SidebarLeft';
import SidebarRight from '../../components/layout/SidebarRight';

const ExplorePage = () => {
  return (
    <div className="flex max-w-7xl mx-auto bg-white">
      <SidebarLeft />
      <main className="flex-1 min-h-screen border-r border-gray-200">
        <h2 className="text-xl font-semibold px-4 py-3 border-b">Explore</h2>
        <div className="p-6 text-gray-600">트렌드와 추천 콘텐츠를 탐색하세요 🔍</div>
      </main>
      <SidebarRight />
    </div>
  );
};

export default ExplorePage;

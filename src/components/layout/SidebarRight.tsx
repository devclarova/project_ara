// src\components\layout\SidebarRight.tsx
import FollowItem from '../sidebar/FollowItem';
import SearchBar from '../sidebar/SearchBar';
import TrendItem from '../sidebar/TrendItem';

const trends = [
  { category: 'Trending in Technology', tag: '#WebDevelopment', posts: '45.2K' },
  { category: 'Trending in Business', tag: '#StartupLife', posts: '28.7K' },
  { category: 'Trending in Design', tag: '#UIDesign', posts: '19.3K' },
  { category: 'Trending', tag: '#AI', posts: '156K' },
  { category: 'Trending in Productivity', tag: '#RemoteWork', posts: '34.8K' },
];

const follows = [
  {
    name: 'Rachel Green',
    handle: 'rachelgreen_ux',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel',
  },
  {
    name: 'Alex Thompson',
    handle: 'alexthompson_dev',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  },
  {
    name: 'Sophie Wilson',
    handle: 'sophiewilson_mkt',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
  },
];

const SidebarRight = () => {
  return (
    <aside className="w-80 h-screen sticky top-0 flex flex-col bg-white">
      {/* ✅ 고정 검색창 */}
      <div className="p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <SearchBar />
      </div>

      {/* ✅ 스크롤 가능한 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {/* 트렌드 */}
        <section className="bg-muted/50 rounded-2xl p-4">
          <h2 className="text-xl font-bold mb-4">Trends for you</h2>
          <div className="space-y-3">
            {trends.map((t, i) => (
              <TrendItem key={i} {...t} />
            ))}
          </div>
          <button className="text-primary hover:underline mt-3 text-sm">Show more</button>
        </section>

        {/* 추천 팔로우 */}
        <section className="bg-muted/50 rounded-2xl p-4">
          <h2 className="text-xl font-bold mb-4">Who to follow</h2>
          <div className="space-y-3">
            {follows.map((f, i) => (
              <FollowItem key={i} {...f} />
            ))}
          </div>
          <button className="text-primary hover:underline mt-3 text-sm">Show more</button>
        </section>

        {/* 푸터 */}
        <footer className="text-xs text-secondary space-y-2 px-4">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {[
              'Terms of Service',
              'Privacy Policy',
              'Cookie Policy',
              'Accessibility',
              'Ads info',
              'More',
            ].map((text, i) => (
              <a key={i} href="#" className="hover:underline">
                {text}
              </a>
            ))}
          </div>
          <p>© 2025 X Clone</p>
        </footer>
      </div>
    </aside>
  );
};

export default SidebarRight;

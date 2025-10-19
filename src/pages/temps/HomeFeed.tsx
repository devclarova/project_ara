import TweetComposer from '../../components/feed/TweetComposer';
import TweetList from '../../components/feed/TweetList';
import Header from '../../components/layout/Header';
import SidebarLeft from '../../components/layout/SidebarLeft';
import SidebarRight from '../../components/layout/SidebarRight';

const HomeFeed = () => {
  return (
    <div className="flex max-w-7xl mx-auto">
      <SidebarLeft />
      <main className="flex-1 min-h-screen border-r border-gray-200">
        <Header title="Home" />
        <TweetComposer />
        <TweetList />
      </main>
      <SidebarRight />
    </div>
  );
};

export default HomeFeed;

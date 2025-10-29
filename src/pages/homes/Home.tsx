import { useEffect, useState } from 'react';
import ComposeBox from './feature/ComposeBox';
import Sidebar from './feature/Sidebar';
import TrendsPanel from './feature/TrendsPanel';
import TweetCard from './feature/TweetCard';
import TweetModal from './feature/TweetModal';
import { mockTweets } from './mocks/tweets';
import InfiniteScroll from 'react-infinite-scroll-component';

interface Tweet {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  image?: string;
  timestamp: string;
  stats: {
    replies: number;
    retweets: number;
    likes: number;
    bookmarks?: number;
    views: number;
  };
}

function Home() {
  // const [tweets, setTweets] = useState<Tweet[]>(mockTweets);
  const [tweets, setTweets] = useState<Tweet[]>(mockTweets.slice(0, 4));

  const [loading, setLoading] = useState(false);
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Handle new tweet posting
  const handleTweetPost = (newTweet: Tweet) => {
    setTweets(prev => [newTweet, ...prev]);
  };

  // 무한 스크롤
  // const loadMoreTweets = () => {
  //   if (tweets.length > 50) {
  //     // 💡 더 이상 불러올 데이터 없으면 종료
  //     setHasMore(false);
  //     return;
  //   }

  //   const moreTweets = mockTweets.map((tweet, index) => ({
  //     ...tweet,
  //     id: `${tweet.id}-${Date.now()}-${index}`,
  //     timestamp:
  //       Math.random() > 0.5
  //         ? `${Math.floor(Math.random() * 12) + 1}h`
  //         : `${Math.floor(Math.random() * 7) + 1}d`,
  //   }));

  //   setTimeout(() => {
  //     setTweets(prev => [...prev, ...moreTweets]);
  //   }, 800);
  // };

  // 무한 스크롤
  const loadMoreTweets = () => {
    // 한 번에 4개씩 로드
    const nextTweets = mockTweets.slice(tweets.length, tweets.length + 4);

    if (nextTweets.length === 0) {
      // 💡 더 이상 불러올 데이터 없으면 종료
      setHasMore(false);
      return;
    }

    // 800ms 지연 후 추가
    setTimeout(() => {
      setTweets(prev => [...prev, ...nextTweets]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Centered Container for all three sections */}
      <div className="flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl">
          {/* Left Sidebar - Now part of centered layout */}
          <div className="w-20 lg:w-64 flex-shrink-0">
            <div className="fixed w-20 lg:w-64 h-full z-10">
              <Sidebar onTweetClick={() => setShowTweetModal(true)} />
            </div>
          </div>

          {/* Central Content with spacing */}
          <div className="w-full max-w-2xl min-w-[320px] sm:min-w-[400px] mx-6 relative">
            <div className="min-h-screen lg:border-x border-gray-200 relative">
              {/* Fixed Header - positioned within the central content container */}
              <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-20">
                <h1 className="text-xl font-bold text-gray-900">Home</h1>
              </div>

              {/* Content without extra padding since header is now sticky within container */}
              <div>
                {/* Compose Box */}
                <ComposeBox onTweetPost={handleTweetPost} />

                {/* Tweet Feed */}

                <InfiniteScroll
                  dataLength={tweets.length}
                  next={loadMoreTweets}
                  hasMore={hasMore}
                  loader={
                    <div className="p-8 text-center text-gray-500">
                      <div className="inline-flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Loading more tweets...</span>
                      </div>
                    </div>
                  }
                  endMessage={
                    <p className="text-center py-6 text-gray-400">🎉 모든 트윗을 다 봤어요!</p>
                  }
                  scrollThreshold={0.9} // 90% 도달 시 next() 실행
                >
                  {tweets.map(tweet => (
                    <TweetCard key={tweet.id} {...tweet} />
                  ))}
                </InfiniteScroll>
              </div>
            </div>
          </div>

          {/* Right Trends Panel - Now part of centered layout */}
          <div className="hidden xl:block w-80 flex-shrink-0">
            <div className="sticky top-0 h-screen">
              <div className="py-4 h-full">
                <TrendsPanel />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tweet Modal */}
      {showTweetModal && <TweetModal onClose={() => setShowTweetModal(false)} />}
    </div>
  );
}

export default Home;

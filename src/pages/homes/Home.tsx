// Home.tsx

// src/pages/HomeFeed.tsx
import { useState } from 'react';
import ComposeBox from './feature/ComposeBox';
import TweetCard from './feature/TweetCard';
import InfiniteScroll from 'react-infinite-scroll-component';
import { mockTweets } from './mocks/tweets';

interface Tweet {
  id: string;
  user: { name: string; username: string; avatar: string };
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

export default function HomeFeed() {
  const [tweets, setTweets] = useState<Tweet[]>(mockTweets.slice(0, 4));
  const [hasMore, setHasMore] = useState(true);

  const handleTweetPost = (newTweet: Tweet) => {
    setTweets(prev => [newTweet, ...prev]);
  };

  const loadMoreTweets = () => {
    const nextTweets = mockTweets.slice(tweets.length, tweets.length + 4);
    if (nextTweets.length === 0) {
      setHasMore(false);
      return;
    }
    setTimeout(() => setTweets(prev => [...prev, ...nextTweets]), 800);
  };

  return (
    <>
      {/* 이 페이지 전용 헤더 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-20">
        <h1 className="text-xl font-bold text-gray-900">Home</h1>
      </div>

      <div>
        <ComposeBox onTweetPost={handleTweetPost} />

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
          endMessage={<p className="text-center py-6 text-gray-400">🎉 모든 트윗을 다 봤어요!</p>}
          scrollThreshold={0.9}
        >
          {tweets.map(t => (
            <TweetCard key={t.id} {...t} />
          ))}
        </InfiniteScroll>
      </div>
    </>
  );
}

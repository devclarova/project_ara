// src/pages/homes/Home.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ComposeBox from './feature/ComposeBox';
import TweetCard from './feature/TweetCard';
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

export default function Home() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // ✅ Supabase에서 트윗 불러오기
  const fetchTweets = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('tweets')
      .select(
        `
        id,
        content,
        image_url,
        created_at,
        reply_count,
        repost_count,
        like_count,
        bookmark_count,
        view_count,
        profiles (
          nickname,
          user_id,
          avatar_url
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tweets:', error);
      setLoading(false);
      return;
    }

    // ✅ Supabase 데이터를 mockTweet 형태로 변환
    const mapped = data.map((t: any) => ({
      id: t.id,
      user: {
        name: t.profiles?.nickname || 'Unknown',
        username: t.profiles?.user_id || 'anonymous',
        avatar: t.profiles?.avatar_url || '/default-avatar.svg',
      },
      content: t.content,
      image: t.image_url || '',
      timestamp: new Date(t.created_at).toLocaleString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      }),
      stats: {
        replies: t.reply_count ?? 0,
        retweets: t.repost_count ?? 0,
        likes: t.like_count ?? 0,
        bookmarks: t.bookmark_count ?? 0,
        views: t.view_count ?? 0,
      },
    }));

    setTweets(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  // ✅ 새 트윗 작성 시 UI 반영
  const handleTweetPost = (newTweet: Tweet) => {
    setTweets(prev => [newTweet, ...prev]);
  };

  // (선택) 무한 스크롤 구조 유지
  const loadMoreTweets = async () => {
    setHasMore(false); // 현재는 일단 페이지네이션 생략
  };

  return (
    <>
      {/* 상단 헤더 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-20">
        <h1 className="text-xl font-bold text-gray-900">Home</h1>
      </div>

      {/* 트윗 작성 박스 */}
      <ComposeBox onTweetPost={handleTweetPost} />

      {/* 트윗 피드 */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
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
            <p className="text-center py-6 text-gray-400">
              🎉 모든 트윗을 다 봤어요!
            </p>
          }
          scrollThreshold={0.9}
        >
          {tweets.map(t => (
            <TweetCard key={t.id} {...t} />
          ))}
        </InfiniteScroll>
      )}
    </>
  );
}

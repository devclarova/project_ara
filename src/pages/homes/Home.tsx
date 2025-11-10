import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAuth } from '@/contexts/AuthContext';
import TweetCard from './feature/TweetCard';

type TweetUser = {
  name: string;
  username: string;
  avatar: string;
};

type TweetStats = {
  replies: number;
  retweets: number;
  likes: number;
  bookmarks?: number;
  views: number;
};

export type UITweet = {
  id: string;
  user: TweetUser;
  content: string;
  image?: string;
  timestamp: string;
  stats: TweetStats;
};

type OutletCtx = {
  newTweet: UITweet | null;
  setNewTweet: (t: UITweet | null) => void;
  searchQuery: string;
};

let HOME_SCROLL_Y = 0;

export default function Home() {
  const { newTweet, setNewTweet, searchQuery } = useOutletContext<OutletCtx>();
  const { user } = useAuth();
  const [tweets, setTweets] = useState<UITweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const restoredRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      HOME_SCROLL_Y = window.scrollY || window.pageYOffset || 0;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useLayoutEffect(() => {
    if (loading) return;
    if (restoredRef.current) return;
    restoredRef.current = true;
    window.scrollTo({ top: HOME_SCROLL_Y, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [loading]);

  const fetchTweets = async (reset = false) => {
    try {
      setLoading(true);
      let data: any[] = [];

      // ✅ RPC 검색: search_tweets(keyword)
      if (searchQuery.trim()) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_tweets', {
          keyword: searchQuery.trim(),
        });
        if (rpcError) throw rpcError;
        data = rpcData ?? [];
        setHasMore(false); // 검색은 전체 결과 한 번에 표시
      } else {
        // ✅ 일반 피드 (무한 스크롤)
        const from = reset ? 0 : page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: feedData, error } = await supabase
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
            profiles:author_id (
              nickname,
              user_id,
              avatar_url
            )
          `
          )
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        data = feedData ?? [];
        setHasMore(data.length === PAGE_SIZE);
        if (!reset) setPage(prev => prev + 1);
      }

      // ✅ 데이터 매핑
      const mapped: UITweet[] = data.map((t: any) => ({
        id: t.id,
        user: {
          name: t.nickname ?? t.profiles?.nickname ?? 'Unknown',
          username: t.user_id ?? t.profiles?.user_id ?? 'anonymous',
          avatar: t.avatar_url ?? t.profiles?.avatar_url ?? '/default-avatar.svg',
        },
        content: t.content,
        image: t.image_url || undefined,
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

      setTweets(reset ? mapped : [...tweets, ...mapped]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tweets:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets(true);
  }, []);

  useEffect(() => {
    fetchTweets(true);
  }, [searchQuery]);

  useEffect(() => {
    if (newTweet) {
      setTweets(prev => [newTweet, ...prev]);
      setNewTweet(null);
    }
  }, [newTweet, setNewTweet]);

  if (loading && tweets.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-primary" />
      </div>
    );
  }

  return (
    <div className="lg:border-x border-gray-200 dark:border-gray-700 dark:bg-background">
      <div className="sticky top-0 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4 z-20">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {/* {searchQuery.trim() ? `검색 결과: "${searchQuery}"` : '홈'} */}
          홈
        </h1>
      </div>

      {searchQuery.trim() ? (
        <div>
          {tweets.length > 0 ? (
            tweets.map(t => (
              <TweetCard
                key={t.id}
                {...t}
                onDeleted={tweetId => {
                  setTweets(prev => prev.filter(item => item.id !== tweetId));
                }}
              />
            ))
          ) : (
            <p className="text-center py-10 text-gray-500 dark:text-gray-400">
              검색 결과가 없습니다.
            </p>
          )}
        </div>
      ) : (
        <InfiniteScroll
          dataLength={tweets.length}
          next={() => fetchTweets(false)}
          hasMore={hasMore}
          loader={
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 dark:border-primary/80" />
                <span>Loading more tweets...</span>
              </div>
            </div>
          }
          endMessage={
            <p className="text-center py-6 text-gray-400 dark:text-gray-500">
              모든 트윗을 다 봤어요!
            </p>
          }
          scrollThreshold={0.9}
        >
          {tweets.map(t => (
            <TweetCard
              key={t.id}
              {...t}
              onDeleted={tweetId => {
                setTweets(prev => prev.filter(item => item.id !== tweetId));
              }}
            />
          ))}
        </InfiniteScroll>
      )}
    </div>
  );
}

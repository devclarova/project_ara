import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import InfiniteScroll from 'react-infinite-scroll-component';
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
};

export default function Home() {
  const { newTweet, setNewTweet } = useOutletContext<OutletCtx>();
  const [tweets, setTweets] = useState<UITweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  //  트윗 불러오기
  const fetchTweets = async (reset = false) => {
    try {
      const from = reset ? 0 : page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

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
          profiles:author_id (
            nickname,
            user_id,
            avatar_url
          )
        `,
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const mapped: UITweet[] = (data ?? []).map((t: any) => ({
        id: t.id,
        user: {
          name: t.profiles?.nickname || 'Unknown',
          username: t.profiles?.user_id || 'anonymous',
          avatar: t.profiles?.avatar_url || '/default-avatar.svg',
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
      setHasMore(mapped.length === PAGE_SIZE);
      setLoading(false);
      if (!reset) setPage(prev => prev + 1);
    } catch (err) {
      console.error('❌ Error fetching tweets:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets(true);
  }, []);

  // 새 트윗 작성 시 즉시 반영
  useEffect(() => {
    if (newTweet) {
      setTweets(prev => [newTweet, ...prev]);
      setNewTweet(null);
    }
  }, [newTweet, setNewTweet]);

  // 실시간 댓글 반영
  useEffect(() => {
    const replyChannel = supabase
      .channel('tweet-replies-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tweet_replies' },
        payload => {
          const tweetId = (payload.new as any)?.tweet_id;
          if (!tweetId) return;
          setTweets(prev =>
            prev.map(t =>
              t.id === tweetId
                ? { ...t, stats: { ...t.stats, replies: (t.stats.replies ?? 0) + 1 } }
                : t,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(replyChannel);
    };
  }, []);

  //  실시간 좋아요 반영
  useEffect(() => {
    const tweetLikeCountChannel = supabase
      .channel('tweets-likecount-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tweets', filter: 'like_count=not.is.null' },
        payload => {
          const tweetId = (payload.new as any)?.id;
          const likeCount = (payload.new as any)?.like_count;
          if (!tweetId) return;
          setTweets(prev =>
            prev.map(t =>
              t.id === tweetId
                ? { ...t, stats: { ...t.stats, likes: likeCount ?? t.stats.likes } }
                : t,
            ),
          );

          console.log('🔥 like event:', payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tweetLikeCountChannel);
    };
  }, []);

  // 실시간 조회수 반영
  useEffect(() => {
    const viewChannel = supabase
      .channel('tweets-views-realtime')
      .on(
        'postgres_changes',
        // { event: 'UPDATE', schema: 'public', table: 'tweets', filter: 'view_count=not.is.null' },
        { event: 'UPDATE', schema: 'public', table: 'tweets' },
        payload => {
          const tweetId = (payload.new as any)?.id;
          const newViewCount = (payload.new as any)?.view_count;
          if (!tweetId) return;
          setTweets(prev =>
            prev.map(t =>
              t.id === tweetId ? { ...t, stats: { ...t.stats, views: newViewCount } } : t,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(viewChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="lg:border-x border-gray-200">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-20">
        <h1 className="text-xl font-bold text-gray-900">홈</h1>
      </div>

      {/* Infinite Scroll */}
      <InfiniteScroll
        dataLength={tweets.length}
        next={() => fetchTweets(false)}
        hasMore={hasMore}
        loader={
          <div className="p-8 text-center text-gray-500">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
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
  );
}

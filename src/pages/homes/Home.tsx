// ✅ src/pages/homes/Home.tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAuth } from '@/contexts/AuthContext'; // ✅ 로그인 유저 가져오기
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

let HOME_SCROLL_Y = 0;

export default function Home() {
  const { newTweet, setNewTweet } = useOutletContext<OutletCtx>();
  const { user } = useAuth(); // ✅ 로그인 유저 정보
  const [tweets, setTweets] = useState<UITweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const restoredRef = useRef(false);

  // ✅ 스크롤 위치 저장
  useEffect(() => {
    const handleScroll = () => {
      HOME_SCROLL_Y = window.scrollY || window.pageYOffset || 0;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ 스크롤 위치 복원
  useLayoutEffect(() => {
    if (loading) return;
    if (restoredRef.current) return;

    restoredRef.current = true;
    window.scrollTo({
      top: HOME_SCROLL_Y,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });
  }, [loading]);

  // ✅ 트윗 불러오기
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

  // ✅ 새 트윗 작성 시 즉시 반영
  useEffect(() => {
    if (newTweet) {
      setTweets(prev => [newTweet, ...prev]);
      setNewTweet(null);
    }
  }, [newTweet, setNewTweet]);

  // ✅ 실시간 댓글 수 반영 (트리거 기반)
  useEffect(() => {
    const replyCountChannel = supabase
      .channel('tweets-replycount-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
        const tweetId = (payload.new as any)?.id;
        const newReplyCount = (payload.new as any)?.reply_count;
        if (!tweetId) return;

        setTweets(prev =>
          prev.map(t =>
            t.id === tweetId
              ? { ...t, stats: { ...t.stats, replies: newReplyCount ?? t.stats.replies } }
              : t,
          ),
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(replyCountChannel);
    };
  }, []);

  // ✅ 실시간 댓글 삭제 반영
  useEffect(() => {
    const replyDeleteChannel = supabase
      .channel('tweet-replies-delete-realtime')
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tweet_replies' },
        payload => {
          const tweetId = (payload.old as any)?.tweet_id;
          if (!tweetId) return;
          setTweets(prev =>
            prev.map(t =>
              t.id === tweetId
                ? {
                    ...t,
                    stats: {
                      ...t.stats,
                      replies: Math.max((t.stats.replies ?? 1) - 1, 0),
                    },
                  }
                : t,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(replyDeleteChannel);
    };
  }, []);

  // ✅ 실시간 좋아요 반영
  useEffect(() => {
    const likeChannel = supabase
      .channel('tweets-likecount-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
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
      })
      .subscribe();

    return () => {
      supabase.removeChannel(likeChannel);
    };
  }, []);

  // ✅ 실시간 조회수 반영
  useEffect(() => {
    const viewChannel = supabase
      .channel('tweets-views-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
        const tweetId = (payload.new as any)?.id;
        const newViewCount = (payload.new as any)?.view_count;
        if (!tweetId) return;
        setTweets(prev =>
          prev.map(t =>
            t.id === tweetId ? { ...t, stats: { ...t.stats, views: newViewCount } } : t,
          ),
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(viewChannel);
    };
  }, []);

  // ✅ 새 트윗 및 삭제 실시간 반영
  useEffect(() => {
    const tweetRealtimeChannel = supabase
      .channel('tweets-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tweets' },
        async payload => {
          const row = payload.new as any;
          if (row.author_id === user?.id) return;
          if (tweets.some(t => t.id === row.id)) return;

          const { data: prof } = await supabase
            .from('profiles')
            .select('nickname, user_id, avatar_url')
            .eq('id', row.author_id)
            .maybeSingle();

          const uiTweet: UITweet = {
            id: row.id,
            user: {
              name: prof?.nickname ?? 'Unknown',
              username: prof?.user_id ?? 'anonymous',
              avatar: prof?.avatar_url ?? '/default-avatar.svg',
            },
            content: row.content,
            image: row.image_url || undefined,
            timestamp: new Date(row.created_at).toLocaleString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              month: 'short',
              day: 'numeric',
            }),
            stats: {
              replies: row.reply_count ?? 0,
              retweets: row.repost_count ?? 0,
              likes: row.like_count ?? 0,
              bookmarks: row.bookmark_count ?? 0,
              views: row.view_count ?? 0,
            },
          };

          setTweets(prev => [uiTweet, ...prev]);
        },
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tweets' }, payload => {
        const deletedId = (payload.old as any)?.id;
        if (!deletedId) return;
        setTweets(prev => prev.filter(t => t.id !== deletedId));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tweetRealtimeChannel);
    };
  }, [user, tweets]);

  // ✅ 로딩 중 표시
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // ✅ 렌더링
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
          <TweetCard
            key={t.id}
            {...t}
            onDeleted={tweetId => {
              setTweets(prev => prev.filter(item => item.id !== tweetId));
            }}
          />
        ))}
      </InfiniteScroll>
    </div>
  );
}

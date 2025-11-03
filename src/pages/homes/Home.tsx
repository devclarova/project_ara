// src/pages/Home.tsx
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
  const [loading, setLoading] = useState<boolean>(true);

  // 무한스크롤 (필요 시 실제 페이지네이션으로 교체)
  const [hasMore, setHasMore] = useState<boolean>(false);

  // 초기 트윗 로드
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
        profiles:author_id (
          nickname,
          user_id,
          avatar_url
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tweets:', error.message);
      setTweets([]); // 실패 시 빈 배열
      setLoading(false);
      return;
    }

    //  data null-safe 처리
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

    setTweets(mapped);
    setLoading(false);
    setHasMore(false); // 필요 시 실제 페이지네이션으로 true 처리
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  //  모달에서 생성된 새 트윗 즉시 반영
  useEffect(() => {
    if (newTweet) {
      setTweets(prev => [newTweet, ...prev]);
      setNewTweet(null); // 한 번만 반영하도록 초기화
    }
  }, [newTweet, setNewTweet]);

  //  Supabase Realtime (다른 유저 트윗도 실시간 반영)
  useEffect(() => {
    const channel = supabase
      .channel('tweets-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tweets' },
        async payload => {
          try {
            // author 프로필 조인
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nickname, user_id, avatar_url')
              .eq('id', payload.new.author_id)
              .single();

            const incoming: UITweet = {
              id: payload.new.id,
              user: {
                name: profileData?.nickname || 'Unknown',
                username: profileData?.user_id || 'anonymous',
                avatar: profileData?.avatar_url || '/default-avatar.svg',
              },
              content: payload.new.content,
              image: payload.new.image_url || undefined,
              timestamp: new Date(payload.new.created_at).toLocaleString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                month: 'short',
                day: 'numeric',
              }),
              stats: {
                replies: payload.new.reply_count ?? 0,
                retweets: payload.new.repost_count ?? 0,
                likes: payload.new.like_count ?? 0,
                bookmarks: payload.new.bookmark_count ?? 0,
                views: payload.new.view_count ?? 0,
              },
            };

            // 중복 방지 후 prepend
            setTweets(prev => (prev.some(t => t.id === incoming.id) ? prev : [incoming, ...prev]));
          } catch (e) {
            console.error('⚠️ realtime mapping error:', e);
          }
        }
      )
      .subscribe();

    return () => {
      //  cleanup에서 Promise 반환하지 않음 (TS 경고 해결)
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMoreTweets = async () => {
    // 실제 페이지네이션 구현 시 교체
    setHasMore(false);
  };

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-20">
        <h1 className="text-xl font-bold text-gray-900">홈</h1>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <InfiniteScroll
          dataLength={tweets.length}
          next={loadMoreTweets}
          hasMore={hasMore}
          // ✅ 필수 loader prop 제공
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
      )}
    </>
  );
}

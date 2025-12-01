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
  image?: string | string[];
  timestamp: string;
  stats: TweetStats;
};

type OutletCtx = {
  newTweet: UITweet | null;
  setNewTweet: (t: UITweet | null) => void;
  searchQuery: string;
};

type HomeProps = {
  // SnsPage에서 넘기는 searchQuery (optional로 만들어서 /finalhome에서도 사용 가능)
  searchQuery?: string;
};

// 🔹 Outlet이 없을 때 사용할 기본값
const defaultOutletCtx: OutletCtx = {
  newTweet: null,
  setNewTweet: () => {},
  searchQuery: '',
};

let HOME_SCROLL_Y = 0;

export default function Home({ searchQuery }: HomeProps) {
  // 🔹 Outlet context 있으면 받고, 없으면 기본값 사용
  const outletCtx = useOutletContext<OutletCtx | null>() ?? defaultOutletCtx;
  const { newTweet, setNewTweet, searchQuery: outletSearchQuery } = outletCtx;

  // 🔹 props > outlet 순으로 searchQuery 통합
  const mergedSearchQuery = (searchQuery ?? outletSearchQuery ?? '').trim();
  const isSearching = mergedSearchQuery.length > 0;

  const { user } = useAuth();
  const [tweets, setTweets] = useState<UITweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const restoredRef = useRef(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  // 로그인한 유저의 profiles.id 가져오기
  useEffect(() => {
    const loadProfileId = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setMyProfileId(data.id);
    };
    loadProfileId();
  }, [user]);

  // 스크롤 위치 저장
  useEffect(() => {
    const handleScroll = () => {
      HOME_SCROLL_Y = window.scrollY || window.pageYOffset || 0;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 페이지 복귀 시 스크롤 복원
  useLayoutEffect(() => {
    if (loading) return;
    if (restoredRef.current) return;
    restoredRef.current = true;
    window.scrollTo({ top: HOME_SCROLL_Y, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [loading]);

  const fetchTweets = async (reset = false) => {
    if (!reset && loading) return;

    try {
      setLoading(true);
      let data: any[] = [];

      if (mergedSearchQuery) {
        // 검색 모드
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_tweets', {
          keyword: mergedSearchQuery,
        });
        if (rpcError) throw rpcError;
        data = rpcData ?? [];
        setHasMore(false);
      } else {
        // 기본 피드
        const currentPage = reset ? 0 : page;
        const from = currentPage * PAGE_SIZE;
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
          `,
          )
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        data = feedData ?? [];

        setHasMore(data.length === PAGE_SIZE);
        if (reset) setPage(1);
        else setPage(prev => prev + 1);
      }

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

      // 중복 tweet ID 제거
      setTweets(prev => {
        const combined = reset ? mapped : [...prev, ...mapped];
        const unique = combined.filter(
          (t, index, self) => index === self.findIndex(x => x.id === t.id),
        );
        return unique;
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching tweets:', err);
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchTweets(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 검색어 있을 때/없을 때 재로드
  useEffect(() => {
    if (mergedSearchQuery) {
      fetchTweets(true);
    } else {
      // 검색어 지워지면 기본 피드로 복원
      fetchTweets(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedSearchQuery]);

  // 새 트윗 작성 시 즉시 반영 (Outlet context 사용 시에만 의미 있음)
  useEffect(() => {
    if (newTweet) {
      setTweets(prev => [newTweet, ...prev]);
      setNewTweet(null);
    }
  }, [newTweet, setNewTweet]);

  // 실시간 업데이트
  useEffect(() => {
    const updateChannel = supabase
      .channel('tweets-update-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
        const updated = payload.new as any;
        setTweets(prev =>
          prev.map(t =>
            t.id === updated.id
              ? {
                  ...t,
                  stats: {
                    ...t.stats,
                    likes: updated.like_count ?? t.stats.likes,
                    replies: updated.reply_count ?? t.stats.replies,
                    views: updated.view_count ?? t.stats.views,
                  },
                }
              : t,
          ),
        );
      })
      .subscribe();

    const insertChannel = supabase
      .channel('tweets-insert-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tweets' },
        async payload => {
          const newTweet = payload.new as any;
          if (newTweet.author_id === myProfileId) return;

          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, user_id, avatar_url')
            .eq('id', newTweet.author_id)
            .maybeSingle();

          const uiTweet: UITweet = {
            id: newTweet.id,
            user: {
              name: profile?.nickname ?? 'Unknown',
              username: profile?.user_id ?? 'anonymous',
              avatar: profile?.avatar_url ?? '/default-avatar.svg',
            },
            content: newTweet.content,
            image: newTweet.image_url || undefined,
            timestamp: new Date(newTweet.created_at).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            stats: {
              replies: newTweet.reply_count ?? 0,
              retweets: newTweet.repost_count ?? 0,
              likes: newTweet.like_count ?? 0,
              bookmarks: newTweet.bookmark_count ?? 0,
              views: newTweet.view_count ?? 0,
            },
          };

          setTweets(prev => [uiTweet, ...prev]);
        },
      )
      .subscribe();

    const deleteChannel = supabase
      .channel('tweets-delete-realtime')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tweets' }, payload => {
        const deletedId = payload.old.id;
        setTweets(prev => prev.filter(t => t.id !== deletedId));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(updateChannel);
      supabase.removeChannel(insertChannel);
      supabase.removeChannel(deleteChannel);
    };
  }, [myProfileId]);

  if (loading && tweets.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-primary" />
      </div>
    );
  }

  return (
    <div className="border-x border-gray-200 dark:border-gray-700 dark:bg-background">
      <div className="sticky top-0 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4 z-20">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">홈</h1>
      </div>

      {isSearching ? (
        <div>
          {tweets.length > 0 ? (
            tweets.map(t => (
              <TweetCard
                key={t.id}
                {...t}
                dimmed={true} // 🔹 검색 중일 때 글자 톤 다운
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
              dimmed={false}
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

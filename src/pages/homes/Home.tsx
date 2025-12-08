import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAuth } from '@/contexts/AuthContext';
import TweetCard from './feature/TweetCard';
import SnsInlineEditor from '@/components/common/SnsInlineEditor';

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
  searchQuery?: string;
};

const defaultOutletCtx: OutletCtx = {
  newTweet: null,
  setNewTweet: () => {},
  searchQuery: '',
};

let SNS_FEED_CACHE: UITweet[] | null = null;
let SNS_FEED_HAS_MORE = true;
let SNS_FEED_PAGE = 0;

const SNS_LAST_TWEET_ID_KEY = 'sns-last-tweet-id';

export default function Home({ searchQuery }: HomeProps) {
  const outletCtx = useOutletContext<OutletCtx | null>() ?? defaultOutletCtx;
  const { newTweet, setNewTweet, searchQuery: outletSearchQuery } = outletCtx;

  const mergedSearchQuery = (searchQuery ?? outletSearchQuery ?? '').trim();
  const isSearching = mergedSearchQuery.length > 0;

  const { user } = useAuth();
  const [tweets, setTweets] = useState<UITweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const restoredRef = useRef(false);
  const PAGE_SIZE = 10;
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  // ✅ SNS 상세 → /sns 복귀 시: 마지막으로 클릭한 카드 위치로 복원
  useLayoutEffect(() => {
    if (restoredRef.current) return;
    if (loading) return;
    if (tweets.length === 0) return;
    if (typeof window === 'undefined') return;

    const lastId = sessionStorage.getItem(SNS_LAST_TWEET_ID_KEY);
    if (!lastId) {
      restoredRef.current = true;
      return;
    }

    // DOM 렌더가 끝난 뒤에 위치 계산
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-tweet-id="${lastId}"]`);
      if (!el) {
        restoredRef.current = true;
        sessionStorage.removeItem(SNS_LAST_TWEET_ID_KEY);
        return;
      }

      const headerOffset = 96; // 고정 헤더 높이만큼 조정 (필요하면 80~110 사이 조절)
      const y = el.offsetTop - headerOffset;

      window.scrollTo({
        top: y > 0 ? y : 0,
        left: 0,
        behavior: 'auto',
      });

      restoredRef.current = true;
      sessionStorage.removeItem(SNS_LAST_TWEET_ID_KEY);
    });
  }, [loading, tweets.length]);

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

  const fetchTweets = async (reset = false) => {
    if (!reset && loading) return;

    try {
      setLoading(true);
      let data: any[] = [];

      if (mergedSearchQuery) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_tweets', {
          keyword: mergedSearchQuery,
        });
        if (rpcError) throw rpcError;
        data = rpcData ?? [];
        setHasMore(false);
      } else {
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

  // 🔥 초기 로드 + 검색어 변경 시 처리
  useEffect(() => {
    // 1) 검색 중일 때는 캐시를 무시하고 항상 새로 검색
    if (isSearching) {
      fetchTweets(true);
      return;
    }

    // 2) 검색이 아니고, 이전 피드 캐시가 있으면 그걸 우선 사용
    if (SNS_FEED_CACHE) {
      setTweets(SNS_FEED_CACHE);
      setHasMore(SNS_FEED_HAS_MORE);
      setPage(SNS_FEED_PAGE);
      setLoading(false);
      return;
    }

    // 3) 캐시가 없을 때만 서버에서 새로 로드
    fetchTweets(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedSearchQuery, isSearching]);

  // 새 트윗 작성 시 앞에 추가
  useEffect(() => {
    if (newTweet) {
      setTweets(prev => [newTweet, ...prev]);
      setNewTweet(null);
    }
  }, [newTweet, setNewTweet]);

  // 실시간 업데이트 (UPDATE / INSERT / DELETE) - 여기부터는 기존 코드 그대로
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
          const newTweetRow = payload.new as any;
          if (newTweetRow.author_id === myProfileId) return;

          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, user_id, avatar_url')
            .eq('id', newTweetRow.author_id)
            .maybeSingle();

          const uiTweet: UITweet = {
            id: newTweetRow.id,
            user: {
              name: profile?.nickname ?? 'Unknown',
              username: profile?.user_id ?? 'anonymous',
              avatar: profile?.avatar_url ?? '/default-avatar.svg',
            },
            content: newTweetRow.content,
            image: newTweetRow.image_url || undefined,
            timestamp: new Date(newTweetRow.created_at).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            stats: {
              replies: newTweetRow.reply_count ?? 0,
              retweets: newTweetRow.repost_count ?? 0,
              likes: newTweetRow.like_count ?? 0,
              bookmarks: newTweetRow.bookmark_count ?? 0,
              views: newTweetRow.view_count ?? 0,
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

  // 🔥 언마운트 시 현재 피드를 전역 캐시에 저장 (이건 별도 useEffect로!)
  useEffect(() => {
    return () => {
      // 검색 중인 상태에서는 캐시로 안 씀
      if (isSearching) return;

      SNS_FEED_CACHE = tweets;
      SNS_FEED_HAS_MORE = hasMore;
      SNS_FEED_PAGE = page;
    };
  }, [tweets, hasMore, page, isSearching]);

  if (loading && tweets.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-primary" />
      </div>
    );
  }

  return (
    <div className="border-x border-gray-200 dark:border-gray-700 dark:bg-background">
      {/* ✅ 검색 중이 아닐 때만 글쓰기 박스 보여주기 */}
      {!isSearching && (
        <SnsInlineEditor
          mode="tweet"
          onTweetCreated={tweet => {
            // 새 트윗을 피드 맨 앞에 붙이기
            setTweets(prev => [tweet, ...prev]);
          }}
        />
      )}

      {isSearching ? (
        <div>
          {tweets.length > 0 ? (
            tweets.map(t => (
              <TweetCard
                key={t.id}
                {...t}
                dimmed={true}
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

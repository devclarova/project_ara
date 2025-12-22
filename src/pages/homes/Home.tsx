import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useOutletContext, useNavigationType } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import TweetCard from './feature/TweetCard';
import SnsInlineEditor from '@/components/common/SnsInlineEditor';
import { SnsStore } from '@/lib/snsState';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { UITweet } from '@/types/sns';
import type { Database } from '@/types/database';
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
const SNS_LAST_TWEET_ID_KEY = 'sns-last-tweet-id';
const PAGE_SIZE = 10;
export default function Home({ searchQuery }: HomeProps) {
  const outletCtx = useOutletContext<OutletCtx | null>() ?? defaultOutletCtx;
  const { newTweet, setNewTweet, searchQuery: outletSearchQuery } = outletCtx;
  const mergedSearchQuery = (searchQuery ?? outletSearchQuery ?? '').trim();
  const isSearching = mergedSearchQuery.length > 0;
  const { user } = useAuth();
  const [tweets, setTweets] = useState<UITweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Refs
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const restoredRef = useRef(false);
  const myProfileIdRef = useRef<string | null>(null);
  // 1. 내 프로필 ID 로드
  useEffect(() => {
    // 브라우저 기본 스크롤 복원 방지 (우리가 직접 제어)
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const loadProfileId = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) myProfileIdRef.current = data.id;
    };
    loadProfileId();
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, [user]);
  // 2. 통합 데이터 패칭 함수
  type TweetWithProfile = Database['public']['Tables']['tweets']['Row'] & {
    nickname?: string; // from RPC
    user_id?: string; // from RPC
    avatar_url?: string; // from RPC
    profiles?: {
      nickname: string | null;
      user_id: string | null;
      avatar_url: string | null;
    } | null;
  };

  const fetchTweets = useCallback(async (reset = false) => {
    if (loadingRef.current && !reset) return;
    if (!hasMore && !reset) return;
    
    loadingRef.current = true;
    
    // 무한 스크롤 카운트 카드 추가 시 스크롤 위치 저장
    const savedScrollY = !reset ? window.scrollY : 0;
    
    if (reset) {
        setLoading(true);
        pageRef.current = 0;
    }
    try {
      let data: TweetWithProfile[] = [];
      const currentPage = reset ? 0 : pageRef.current;
      if (isSearching) {
        // 검색 모드: RPC 호출
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_tweets', {
          keyword: mergedSearchQuery,
        });
        if (rpcError) throw rpcError;
        data = (rpcData as unknown as TweetWithProfile[]) ?? [];
        setHasMore(false); // 검색은 일단 한번에 다 가져온다고 가정
      } else {
        // 일반 피드 모드
        const from = currentPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data: feedData, error } = await supabase
          .from('tweets')
          .select(`
            id, content, image_url, created_at,
            reply_count, repost_count, like_count, bookmark_count, view_count,
            profiles:author_id ( nickname, user_id, avatar_url )
          `)
          .order('created_at', { ascending: false })
          .range(from, to);
        if (error) throw error;
        // Supabase QueryResponse need casting or generic support, usually returns correct shape but here we enforce it
        data = (feedData as unknown as TweetWithProfile[]) ?? [];
        
        // 다음 페이지 검사
        if (data.length < PAGE_SIZE) setHasMore(false);
        else setHasMore(true);
      }
      const mapped: UITweet[] = data.map((t) => ({
        id: t.id,
        user: {
          name: t.nickname ?? t.profiles?.nickname ?? 'Unknown',
          username: t.user_id ?? t.profiles?.user_id ?? 'anonymous',
          avatar: t.avatar_url ?? t.profiles?.avatar_url ?? '/default-avatar.svg',
        },
        content: t.content,
        image: t.image_url || undefined,
        timestamp: t.created_at || new Date().toISOString(),
        stats: {
          replies: t.reply_count ?? 0,
          retweets: t.repost_count ?? 0,
          likes: t.like_count ?? 0,
          bookmarks: t.bookmark_count ?? 0,
          views: t.view_count ?? 0,
        },
      }));
      // 상태 업데이트
      setTweets(prev => {
        const combined = reset ? mapped : [...prev, ...mapped];
        // 중복 제거
        const seen = new Set();
        return combined.filter(t => {
            if (seen.has(t.id)) return false;
            seen.add(t.id);
            return true;
        });
      });
      if (!isSearching && !reset && data.length > 0) {
          pageRef.current += 1;
      }
    } catch (err) {
      console.error('Error fetching tweets:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      
      // 무한 스크롤 추가 로드 시 스크롤 위치 복원
      if (!reset && savedScrollY > 0) {
        // requestAnimationFrame으로 DOM 렌더링 완료 후 복원
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedScrollY, behavior: 'auto' });
        });
      }
    }
  }, [isSearching, mergedSearchQuery, hasMore]);
  // 3. 초기 로드 및 검색어 변경 감지
  useEffect(() => {
    // 검색 모드면 무조건 새로 로드
    if (isSearching) {
        fetchTweets(true);
        return;
    }
    // 일반 모드: 스토어 캐시 확인 + 상세페이지에서 돌아온 경우(restoredRef)가 아니면 로드
    const cachedFeed = SnsStore.getFeed();
    // 상세페이지 갔다온 경우는 useLayoutEffect에서 복원하므로 fetchTweets 스킵(이미 데이터가 있다고 가정하거나 복원 로직이 처리)
    // 하지만 데이터가 비어있다면 로드해야 함.
    if (cachedFeed && cachedFeed.length > 0 && !restoredRef.current) {
        setTweets(cachedFeed);
        setHasMore(SnsStore.getHasMore());
        pageRef.current = SnsStore.getPage();
        setLoading(false);
    } else {
        // 캐시가 없거나 검색어 변경시
        fetchTweets(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearching, mergedSearchQuery]);
  // 4. 무한 스크롤 연동
  const loadMoreTriggerRef = useInfiniteScroll(() => {
      fetchTweets(false);
  }, hasMore && !isSearching, loadingRef.current);
  // 5. 새 트윗(InlineEditor) 작성 시 처리
  useEffect(() => {
    if (newTweet) {
      setTweets(prev => [newTweet, ...prev]);
      setNewTweet(null); // 사용 후 초기화
    }
  }, [newTweet, setNewTweet]);
  const navType = useNavigationType();
  // 6. 스크롤 위치 복원 (Store 사용 - Main 브랜치의 로직 통합)
  useLayoutEffect(() => {
    // 6-1. 새로운 경로 진입(PUSH)인 경우 모든 스크롤 정보 초기화 후 최상단으로
    if (navType === 'PUSH') {
      restoredRef.current = true;
      sessionStorage.removeItem(SNS_LAST_TWEET_ID_KEY);
      SnsStore.setScrollY(0);
      window.scrollTo(0, 0);
      return;
    }
    // 6-2. 뒤로가기(POP)인 경우에만 복원 시도
    if (restoredRef.current) return;
    if (tweets.length === 0) return;
    if (loading) return;
    const lastId = sessionStorage.getItem(SNS_LAST_TWEET_ID_KEY);
    const cachedScrollY = SnsStore.getScrollY();
    // 복원 시도 시작 시 바로 플래그 세팅하여 중복 실행 방지
    restoredRef.current = true;
    // 1단계: 저장된 좌표값으로 즉시 복원 (가장 빠름)
    if (cachedScrollY > 0) {
      window.scrollTo({ top: cachedScrollY, behavior: 'auto' });
    }
    if (!lastId) return;
    // 2단계: 특정 요소(ID) 기준으로 미세 조정 (정밀함)
    // requestAnimationFrame을 사용하여 DOM 렌더링 후 실행 보장
    requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-tweet-id="${lastId}"]`);
        if (el) {
          const headerOffset = 100; // 헤더 높이 고려
          const rect = el.getBoundingClientRect();
          const absoluteY = window.scrollY + rect.top;
          
          window.scrollTo({ 
            top: Math.max(0, absoluteY - headerOffset), 
            behavior: 'auto' 
          });
          
          sessionStorage.removeItem(SNS_LAST_TWEET_ID_KEY);
        } else {
            // 요소가 늦게 나타날 경우 대비하여 한 번 더 시도
            setTimeout(() => {
                const retryEl = document.querySelector<HTMLElement>(`[data-tweet-id="${lastId}"]`);
                if (retryEl) {
                    const retryRect = retryEl.getBoundingClientRect();
                    const retryAbsoluteY = window.scrollY + retryRect.top;
                    window.scrollTo({ 
                        top: Math.max(0, retryAbsoluteY - 100), 
                        behavior: 'auto' 
                    });
                }
                sessionStorage.removeItem(SNS_LAST_TWEET_ID_KEY);
            }, 100);
        }
    });
  }, [tweets.length, loading, navType]);
  // 7. 언마운트 시 캐시 저장 (Main 브랜치 안전장치 포함)
  useEffect(() => {
    return () => {
        if (!isSearching) {
            SnsStore.setFeed(tweets);
            SnsStore.setHasMore(hasMore);
            SnsStore.setPage(pageRef.current);
            // 현재 스크롤 위치도 캐시에 저장
            SnsStore.setScrollY(window.scrollY);
        }
    };
  }, [tweets, hasMore, isSearching]);
  // 8. 실시간 업데이트
  useEffect(() => {
      const channel = supabase.channel('home-feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tweets' }, async payload => {
          const newTweet = payload.new as Database['public']['Tables']['tweets']['Row'];
          
          // 이미 리스트에 있는지 확인 (낙관적 업데이트 등으로)
          // setTweets 안에서 확인해야 최신 state 반영 가능하지만, 
          // async fetch가 필요하므로 여기서 1차 필터링은 어려움.
          // 일단 fetch 진행.

          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, user_id, avatar_url')
            .eq('id', newTweet.author_id)
            .maybeSingle();

          const formattedTweet: UITweet = {
              id: newTweet.id,
              user: {
                  name: profile?.nickname || 'Unknown',
                  username: profile?.user_id || 'anonymous',
                  avatar: profile?.avatar_url || '/default-avatar.svg',
              },
              content: newTweet.content,
              image: newTweet.image_url || undefined,
              timestamp: newTweet.created_at || new Date().toISOString(),
              stats: {
                  replies: newTweet.reply_count ?? 0,
                  retweets: newTweet.repost_count ?? 0,
                  likes: newTweet.like_count ?? 0,
                  bookmarks: newTweet.bookmark_count ?? 0,
                  views: newTweet.view_count ?? 0,
              },
          };

          setTweets(prev => {
              if (prev.some(t => t.id === formattedTweet.id)) return prev;
              return [formattedTweet, ...prev];
          });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
          const updated = payload.new as Database['public']['Tables']['tweets']['Row'];
          setTweets(prev => prev.map(t => 
             t.id === updated.id 
             ? { ...t, stats: { 
                 ...t.stats, 
                 replies: updated.reply_count ?? 0, 
                 likes: updated.like_count ?? 0, 
                 views: updated.view_count ?? 0 
               } } 
             : t
          ));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tweets' }, payload => {
          setTweets(prev => prev.filter(t => t.id !== payload.old.id));
      })
      .subscribe();
      return () => {
          supabase.removeChannel(channel);
      };
  }, []);
  // 9. 안전장치: 로딩이 너무 오래 걸리면 강제 종료 (Main 브랜치 기능 통합)
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (loading) {
           console.warn('Tweet loading timed out - forcing loading off');
           setLoading(false);
           loadingRef.current = false;
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [loading]);
  if (loading && tweets.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  return (
    <div className="border-x border-gray-200 dark:border-gray-700 dark:bg-background min-h-screen">
      {/* 글쓰기 박스 */}
      {!isSearching && (
        <SnsInlineEditor
          mode="tweet"
          onTweetCreated={tweet => setTweets(prev => [tweet, ...prev])}
          onFocus={() => window.scrollTo({ top: 0, behavior: 'auto' })}
        />
      )}
      {/* 피드 목록 */}
      <div className="flex flex-col">
        {tweets.length === 0 && !loading ? (
           <div className="text-center py-20 text-muted-foreground">
             {isSearching ? '검색 결과가 없습니다.' : '게시글이 없습니다.'}
           </div>
        ) : (
            tweets.map(t => (
                <TweetCard
                    key={t.id}
                    {...t}
                    dimmed={false}
                    onDeleted={tweetId => setTweets(prev => prev.filter(i => i.id !== tweetId))}
                />
            ))
        )}
      </div>
      {/* 무한 스크롤 트리거 */}
      <div ref={loadMoreTriggerRef} className="h-10 flex justify-center items-center py-6">
         {loading && tweets.length > 0 && hasMore && (
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
         )}
         {!hasMore && tweets.length > 0 && (
             <p className="text-sm text-muted-foreground">모든 소식을 확인했습니다.</p>
         )}
      </div>
    </div>
  );
}
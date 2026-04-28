/**
 * 커뮤니티 글로벌 홈 피드 뷰(Community Global Home Feed View):
 * - 목적(Why): 사용자 간 실시간 소통, 트윗 검색, 그리고 최신 피드 조회를 위한 핵심 SNS 인터페이스를 제공함
 * - 방법(How): Supabase Realtime CDC를 활용한 양방향 데이터 바인딩, useInfiniteScroll 플러그인과 세션 스토리지 기반의 스크롤 위치 복원 알고리즘을 적용하여 UX를 극대화함
 */
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useOutletContext, useNavigationType } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import TweetCard from '@/pages/community/feature/TweetCard';
import SnsInlineEditor from '@/components/common/SnsInlineEditor';
import { SnsStore } from '@/lib/snsState';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import type { UITweet } from '@/types/sns';
import type { Database } from '@/types/database';
import { getErrorMessage } from '@/utils/errorMessage';

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
export default function CommunityFeed({ searchQuery }: HomeProps) {
  const { t, i18n } = useTranslation();
  const outletCtx = useOutletContext<OutletCtx | null>() ?? defaultOutletCtx;
  const { newTweet, setNewTweet, searchQuery: outletSearchQuery } = outletCtx;
  const mergedSearchQuery = (searchQuery ?? outletSearchQuery ?? '').trim();
  const isSearching = mergedSearchQuery.length > 0;
  const { user, isAdmin, profileId } = useAuth();
  const { blockedIds } = useBlockedUsers(); // 차단된 유저 목록 가져오기
  const [tweets, setTweets] = useState<UITweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);


  // Refs
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const restoredRef = useRef(false);

  // 1. 내 프로필 ID 로드
  useEffect(() => {
    // 브라우저 기본 스크롤 복원 방지 (우리가 직접 제어)
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // myProfileIdRef.current = profileId; // profileId is now reactive from useAuth, but if needed for refs:
    
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, [profileId]);
  // 2. 통합 데이터 패칭 함수
  type TweetWithProfile = Database['public']['Tables']['tweets']['Row'] & {
    nickname?: string; // from RPC
    user_id?: string; // from RPC
    avatar_url?: string; // from RPC
    deleted_at?: string | null; // Manually added
    is_hidden?: boolean | null; // ✅ Added
    profiles?: {
      id: string; // ✅ Added
      nickname: string | null;
      user_id: string | null;
      avatar_url: string | null;
      banned_until?: string | null;
      plan?: 'free' | 'basic' | 'premium';
      country?: string | null;
    } | null;
  };

  const fetchTweets = useCallback(
    async (reset = false) => {
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
          const { data: rpcData, error: rpcError } = await (supabase as any).rpc('search_tweets', {
            keyword: mergedSearchQuery,
          });
          if (rpcError) throw rpcError;
          data = (rpcData as unknown as TweetWithProfile[]) ?? [];
          setHasMore(false); // 검색은 일단 한번에 다 가져온다고 가정
        } else {
          // 일반 피드 모드
          const from = currentPage * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;
          const { data: feedData, error } = await (supabase.from('tweets') as any)
            .select(
              `
            id, content, image_url, created_at, updated_at, deleted_at, is_hidden,
            reply_count, repost_count, like_count, bookmark_count, view_count,
            profiles:author_id ( 
              id, nickname, user_id, avatar_url, banned_until, plan, country
            )
          `,
            )
            .order('created_at', { ascending: false })
            .range(from, to);
          if (error) throw error;
          // Supabase QueryResponse need casting or generic support, usually returns correct shape but here we enforce it
          data = (feedData as unknown as TweetWithProfile[]) ?? [];

          // 다음 페이지 검사
          if (data.length < PAGE_SIZE) setHasMore(false);
          else setHasMore(true);
        }

        // 3. 현재 페이지 트윗들의 '좋아요' 상태를 일괄 조회 (로그인 시)
        let likedIds = new Set<string>();
        if (profileId && data.length > 0) {
          const tweetIds = data.map(d => d.id);
          const { data: likeData } = await (supabase.from('tweet_likes') as any)
            .select('tweet_id')
            .eq('user_id', profileId)
            .in('tweet_id', tweetIds);
          
          if (likeData) {
            likedIds = new Set(likeData.map((l: any) => l.tweet_id));
          }
        }

        // 4. 작성자들의 국가 정보를 전역에서 일괄 조회 (Optimize)
        let countryMap = new Map<string, { name: string; flag_url: string }>();
        const countryIds = Array.from(new Set(
          data.map(d => d.profiles?.country).filter(Boolean) as string[]
        ));

        if (countryIds.length > 0) {
          const { data: countryData } = await (supabase.from('countries') as any)
            .select('id, name, flag_url')
            .in('id', countryIds);
          
          if (countryData) {
            countryData.forEach((c: any) => {
              countryMap.set(String(c.id), { name: c.name, flag_url: c.flag_url });
            });
          }
        }
        const mapped: UITweet[] = data.map(tweet => {
          const tRecord = tweet as Record<string, unknown>;
          return {
            id: tweet.id,
            user: {
              id: tweet.profiles?.id ?? (tRecord.author_id as string) ?? '',
              name: tweet.profiles?.nickname ?? t('common.unknown', 'Unknown'),
              username: tweet.profiles?.user_id ?? tweet.profiles?.nickname ?? t('common.anonymous', 'anonymous'),
              avatar: tweet.profiles?.avatar_url ?? '/default-avatar.svg',
              banned_until: tweet.profiles?.banned_until ?? null,
              plan: tweet.profiles?.plan ?? 'free',
              countryFlag: tweet.profiles?.country ? countryMap.get(String(tweet.profiles.country))?.flag_url : null,
              countryName: tweet.profiles?.country ? countryMap.get(String(tweet.profiles.country))?.name : null,
            },
            content: tweet.content,
            image: tweet.image_url ?? undefined,
            timestamp: tweet.created_at ?? new Date().toISOString(),
            createdAt: tweet.created_at ?? undefined,
            updatedAt: (tRecord.updated_at as string) || undefined,
            deleted_at: tweet.deleted_at,
            liked: likedIds.has(tweet.id),
            stats: {
              replies: tweet.reply_count ?? 0,
              retweets: tweet.repost_count ?? 0,
              likes: tweet.like_count ?? 0,
              bookmarks: tweet.bookmark_count ?? 0,
              views: tweet.view_count ?? 0,
            },
            is_hidden: tweet.is_hidden ?? false,
          };
        });
        // 상태 업데이트
        setTweets(prev => {
          const combined = reset ? mapped : [...prev, ...mapped];
          // 중복 제거 및 차단된 유저 필터링
          const seen = new Set();
          return combined.filter(t => {
            if (t.is_hidden && !isAdmin) return false;
            if (t.user.id && blockedIds.includes(t.user.id)) return false; // 차단 필터링 (profiles.id UUID 기준)
            if (seen.has(t.id)) return false;
            seen.add(t.id);
            return true;
          });
        });
        if (!isSearching && !reset && data.length > 0) {
          pageRef.current += 1;
        }
      } catch (err: unknown) {
        console.error('피드 불러오기 실패:', getErrorMessage(err));
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
    },
    [isSearching, mergedSearchQuery, hasMore, blockedIds, isAdmin],
  );

  // blockedIds 변경 시 기존 트윗 목록에서 차단된 유저 제거
  useEffect(() => {
    if (blockedIds.length === 0) return;
    setTweets(prev => prev.filter(t => !blockedIds.includes(t.user.id)));
  }, [blockedIds]);

  // 3. 초기 로드 및 검색어 변경 감지
  useEffect(() => {
    // 검색 모드면 무조건 새로 로드
    if (isSearching) {
      fetchTweets(true);
      return;
    }
    // 일반 모드: 스토어 캐시 확인 + 상세페이지에서 돌아온 경우(restoredRef)가 아니면 로드
    const cachedFeed = SnsStore.getFeed();
    if (cachedFeed && cachedFeed.length > 0 && !restoredRef.current) {
      // [수정] 캐시 데이터에서도 숨김 게시물은 실시간으로 걸러냄 (관리자 예외)
      const filteredCache = cachedFeed.filter((t: UITweet) => isAdmin || !t.is_hidden);
      setTweets(filteredCache);
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
  const loadMoreTriggerRef = useInfiniteScroll(
    () => {
      fetchTweets(false);
    },
    hasMore && !isSearching,
    loadingRef.current,
  );
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
          behavior: 'auto',
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
              behavior: 'auto',
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
    // 8-1. 트윗 변경 (INSERT/UPDATE/DELETE)
    const tweetChannel = supabase
      .channel('home-feed-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tweets' },
        async payload => {
          const newTweet = payload.new as Database['public']['Tables']['tweets']['Row'] & {
            deleted_at?: string | null;
            is_hidden?: boolean | null;
          };

          const { data: profile } = await (supabase.from('profiles') as any)
            .select('id, nickname, user_id, avatar_url, banned_until, plan')
            .eq('id', newTweet.author_id)
            .maybeSingle();

          const formattedTweet: UITweet = {
            id: newTweet.id,
            user: {
              id: profile?.id || '00000000-0000-0000-0000-000000000000',
              name: profile?.nickname || t('common.unknown'),
              username: profile?.user_id || t('common.anonymous'),
              avatar: profile?.avatar_url || '/default-avatar.svg',
              banned_until: profile?.banned_until ?? null,
              plan: profile?.plan,
            },
            content: newTweet.content,
            image: newTweet.image_url || undefined,
            timestamp: newTweet.created_at || new Date().toISOString(),
            createdAt: newTweet.created_at || new Date().toISOString(),
            deleted_at: newTweet.deleted_at,
            stats: {
              replies: newTweet.reply_count ?? 0,
              retweets: newTweet.repost_count ?? 0,
              likes: newTweet.like_count ?? 0,
              bookmarks: newTweet.bookmark_count ?? 0,
              views: newTweet.view_count ?? 0,
            },
          };

          setTweets(prev => {
            if (newTweet.is_hidden && !isAdmin) return prev; // [추가] 숨김 게시물은 실시간 피드에서 즉시 제외
            if (blockedIds.includes(formattedTweet.user.id)) return prev;
            if (prev.some(t => t.id === formattedTweet.id)) return prev;
            return [formattedTweet, ...prev];
          });
        },
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
        const updated = payload.new as Database['public']['Tables']['tweets']['Row'] & { is_hidden?: boolean };
        
        // [추가] 만약 업데이트된 트윗이 '숨김' 상태가 되었다면 일반 유저의 목록에서 즉시 제거
        if (updated.is_hidden && !isAdmin) {
          setTweets(prev => prev.filter(t => t.id !== updated.id));
          return;
        }

        setTweets(prev =>
          prev.map(t =>
            t.id === updated.id
              ? {
                  ...t,
                  stats: {
                    ...t.stats,
                    replies: updated.reply_count ?? 0,
                    likes: updated.like_count ?? 0,
                    views: updated.view_count ?? 0,
                  },
                }
              : t,
          ),
        );
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tweets' }, payload => {
        setTweets(prev => prev.filter(t => t.id !== payload.old.id));
      })
      .subscribe();

    // 8-2. 작성자 프로필 변경 (제재 상태 실시간 반영)
    const profileChannel = supabase
      .channel('home-feed-author-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        type ProfileUpdate = { id: string; user_id: string; banned_until?: string | null; plan?: 'free' | 'basic' | 'premium' };
        const updated = payload.new as ProfileUpdate;
        if (updated.banned_until === undefined) return;
          setTweets(prev =>
            prev.map(t => {
              // 프로필 PK(id) 또는 인증 ID(user_id)로 매칭
              if (
                String(t.user.id) === String(updated.id) ||
                String(t.user.username) === String(updated.user_id)
              ) {
                return {
                  ...t,
                  user: { ...t.user, banned_until: updated.banned_until, plan: updated.plan },
                };
              }
              return t;
            }),
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tweetChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [blockedIds, t]); // t를 의존성에 추가 (번역 갱신용)
  // 9. 안전장치: 로딩이 너무 오래 걸리면 강제 종료 (Main 브랜치 기능 통합)
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (loading) {
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
            {isSearching ? t('community.no_results') : t('community.no_posts')}
          </div>
        ) : (
          tweets.map((t, index) => (
            <TweetCard
              key={t.id}
              {...t}
              content={t.content}
              dimmed={false}
              onDeleted={tweetId => setTweets(prev => prev.filter(i => i.id !== tweetId))}
              onUpdated={(id, updates) => {
                setTweets(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
                SnsStore.updateTweet(id, updates);
              }}
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
          <p className="text-sm text-muted-foreground">{t('community.all_posts_loaded')}</p>
        )}
      </div>
    </div>
  );
}

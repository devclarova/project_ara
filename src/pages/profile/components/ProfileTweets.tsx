import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import TweetCard from '@/pages/community/feature/TweetCard';
import { ReplyCard } from '@/pages/community/tweet/components/ReplyCard';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { FeedItem, UIPost, UIReply } from '@/types/sns';
import { tweetService } from '@/services/tweetService';
import { useNavigate } from 'react-router-dom';
interface ProfileTweetsProps {
  activeTab: string;
  userProfile: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  onItemClick?: (item: FeedItem) => void;
  onProfileClick?: (username: string) => void;
  disableInteractions?: boolean;
}
const PAGE_SIZE = 10;
export default function ProfileTweets({
  activeTab,
  userProfile,
  onItemClick,
  onProfileClick,
  disableInteractions = false,
}: ProfileTweetsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { blockedIds } = useBlockedUsers(); // 차단 목록 가져오기
  const [tweets, setTweets] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [viewerProfileId, setViewerProfileId] = useState<string | null>(null);

  const goTweet = useCallback(
    (tweetId: string) => {
      navigate(`/sns/${tweetId}`, {
        state: { focus: { type: 'tweet', id: tweetId } },
      });
    },
    [navigate],
  );

  const goReply = useCallback(
    (tweetId: string, replyId: string) => {
      navigate(`/sns/${tweetId}?reply=${replyId}`, {
        state: { highlightCommentId: replyId },
      });
    },
    [navigate],
  );

  // Race Condition 방지를 위한 Ref
  const activeTabRef = useRef(activeTab);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  // 좋아요 탭 전용: 전체 ID 리스트 캐싱 (페이지네이션용)
  const likedItemsRef = useRef<
    { type: 'post' | 'reply'; id: string; date: string; likedAt: string }[]
  >([]);

  const patchViewerLikes = useCallback(
    async (items: FeedItem[]) => {
      // 기본: 전부 "내가 좋아요 안함"으로 초기화
      const setFlag = (it: FeedItem, liked: boolean) =>
        ({
          ...(it as any),
          // TweetCard/ReplyCard가 어떤 키를 쓰든 최대한 커버
          isLiked: liked,
          is_liked: liked,
          liked: liked,
          likedByMe: liked,
          viewerLiked: liked,
        }) as FeedItem;

      if (!viewerProfileId || items.length === 0) {
        return items.map(it => setFlag(it, false));
      }

      const postIds = items.filter(i => i.type !== 'reply').map(i => i.id);
      const replyIds = items.filter(i => i.type === 'reply').map(i => i.id);

      const likedSet = new Set<string>();

      const [{ data: postLikes }, { data: replyLikes }] = await Promise.all([
        postIds.length
          ? supabase
              .from('tweet_likes')
              .select('tweet_id')
              .eq('user_id', viewerProfileId)
              .in('tweet_id', postIds)
          : Promise.resolve({ data: [] as any[] }),

        replyIds.length
          ? supabase
              .from('reply_likes')
              .select('reply_id')
              .eq('user_id', viewerProfileId)
              .in('reply_id', replyIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      postLikes?.forEach(r => likedSet.add(`post:${r.tweet_id}`));
      replyLikes?.forEach(r => likedSet.add(`reply:${r.reply_id}`));

      return items.map(it => setFlag(it, likedSet.has(`${it.type}:${it.id}`)));
    },
    [viewerProfileId],
  );

  useEffect(() => {
    setEditingReplyId(null);
  }, [activeTab, userProfile.id]);

  // 탭 변경 시 초기화
  useEffect(() => {
    activeTabRef.current = activeTab;
    setTweets([]); // 화면 클리어
    pageRef.current = 0;
    likedItemsRef.current = []; // 탭 변경 시 캐시 초기화
    setHasMore(true);
    setLoading(true); // 로딩 스피너 즉시 표시
    // 데이터 로드
    fetchTweets(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userProfile.id, blockedIds]); // blockedIds 추가
  const fetchTweets = async (reset = false) => {
    const currentTab = activeTabRef.current;

    // 이미 로딩 중이고, 리셋이 아니면 스킵 (중복 로딩 방지)
    if (loadingRef.current && !reset) return;
    // 더 가져올 게 없는데 리셋이 아니면 스킵
    if (!hasMore && !reset) return;
    loadingRef.current = true;
    if (reset) setLoading(true); // 첫 로드/리셋일 때만 로딩 표시
    try {
      const pageToLoad = reset ? 0 : pageRef.current;
      let newData: FeedItem[] = [];
      // 1) 내가 쓴 게시글
      if (currentTab === 'posts') {
        newData = await tweetService.getPosts(userProfile.id, pageToLoad, blockedIds);
      }
      // 2) 내가 쓴 댓글
      else if (currentTab === 'replies') {
        newData = await tweetService.getReplies(userProfile.id, pageToLoad, blockedIds);
      }
      // 3) 좋아요한 글
      else if (currentTab === 'likes') {
        const { items, allLikedItems } = await tweetService.getLikedItems(
          userProfile.id,
          pageToLoad,
          pageToLoad === 0 ? undefined : likedItemsRef.current,
        );

        // "내가 좋아요 했는지" 기준으로 하트 상태 다시 덮어쓰기
        const viewerPatched = await patchViewerLikes(items);

        // 차단 유저 필터
        const filteredItems = viewerPatched.filter(
          item => !blockedIds.includes(item.user.username),
        );

        if (pageToLoad === 0 && allLikedItems) likedItemsRef.current = allLikedItems;
        newData = filteredItems;
      }

      // 요청 완료 후 탭이 바뀌었으면(사용자가 그새 다른 탭 클릭) 결과 버림
      if (activeTabRef.current !== currentTab) return;
      if (reset) {
        setTweets(newData);
      } else {
        // 기존 데이터에 추가 (중복 제거)
        setTweets(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          return [...prev, ...newData.filter(t => !existingIds.has(t.id))];
        });
      }
      // 더보기 가능 여부 판단
      if (currentTab === 'likes') {
        // 좋아요는 전체 리스트 길이를 알기 때문에 정확히 계산 가능
        const totalCount = likedItemsRef.current.length;
        const currentCount = (pageToLoad + 1) * PAGE_SIZE;
        setHasMore(currentCount < totalCount);
      } else {
        // 일반 게시글/댓글은 받아온 개수로 판단
        if (newData.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
      // 다음 페이지 준비 (성공했을 때만)
      if (newData.length > 0 || (currentTab === 'likes' && likedItemsRef.current.length > 0)) {
        pageRef.current += 1;
      }
    } catch (error) {
      // 에러 로깅 생략
    } finally {
      // 탭이 여전히 같을 때만 로딩 해제
      if (activeTabRef.current === currentTab) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  };
  // 무한 스크롤 트리거
  const loadMoreRef = useInfiniteScroll(
    () => {
      fetchTweets(false);
    },
    hasMore,
    loading, // 세 번째 필수 인자 전달
  );
  // 실시간 업데이트 (stats 및 제재 상태 반영)
  useEffect(() => {
    if (!userProfile?.id) return;

    // 1. 게시글 실시간 통계 업데이트
    const tweetChannel = supabase
      .channel(`profile-tweets-realtime-${userProfile.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
        const updated = payload.new as any;
        setTweets(prev =>
          prev.map(t =>
            t.id === updated.id
              ? {
                  ...t,
                  stats: {
                    ...t.stats,
                    replies: updated.reply_count,
                    likes: updated.like_count,
                    views: updated.view_count,
                  },
                }
              : t,
          ),
        );
      })
      .subscribe();

    // 2. 작성자 프로필 실시간 동기화 (제재 뱃지용)
    const profileChannel = supabase
      .channel(`profile-authors-sync-${userProfile.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        const updated = payload.new as any;
        if (updated.banned_until !== undefined) {
          setTweets(prev =>
            prev.map(t => {
              if (
                String(t.user.username) === String(updated.user_id) ||
                String((t as any).author_id) === String(updated.id)
              ) {
                return {
                  ...t,
                  user: { ...t.user, banned_until: updated.banned_until },
                };
              }
              return t;
            }),
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tweetChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [userProfile.id]);
  if (loading && tweets.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!loading && tweets.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        {activeTab === 'posts' && '작성한 게시글이 없습니다.'}
        {activeTab === 'replies' && '작성한 답글이 없습니다.'}
        {activeTab === 'likes' && '마음에 들어한 글이 없습니다.'}
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex flex-col gap-4 pb-10">
        {tweets.map(item =>
          item.type === 'reply' ? (
            <ReplyCard
              key={item.id}
              reply={item}
              highlight={false}
              editingReplyId={editingReplyId}
              setEditingReplyId={setEditingReplyId}
              onUnlike={(id: string) => {
                if (activeTab === 'likes') setTweets(prev => prev.filter(t => t.id !== id));
              }}
              onClick={(replyId, tweetId) => {
                // 댓글카드 클릭 → 해당 트윗 상세 + 댓글 위치로
                goReply(tweetId, replyId);
                onItemClick?.(item);
              }}
              onAvatarClick={onProfileClick}
              disableInteractions={disableInteractions}
            />
          ) : (
            <TweetCard
              key={item.id}
              {...item}
              onUnlike={id => {
                if (activeTab === 'likes') setTweets(prev => prev.filter(t => t.id !== id));
              }}
              onClick={tweetId => {
                // 트윗카드 클릭 → 해당 트윗 상세로
                goTweet(tweetId);
                onItemClick?.(item);
              }}
              onAvatarClick={onProfileClick}
              disableInteractions={disableInteractions}
            />
          ),
        )}

        {/* 로딩 인디케이터 (무한 스크롤용) */}
        <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
          {loading && tweets.length > 0 && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          )}
        </div>
      </div>
    </div>
  );
}

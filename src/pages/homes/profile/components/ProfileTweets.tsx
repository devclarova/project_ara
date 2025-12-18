import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import TweetCard from '../../feature/TweetCard';
import { ReplyCard } from '../../tweet/components/ReplyCard';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { FeedItem, UIPost, UIReply } from '@/types/sns';
import { tweetService } from '@/services/tweetService';
interface ProfileTweetsProps {
  activeTab: string;
  userProfile: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}
const PAGE_SIZE = 10;
export default function ProfileTweets({ activeTab, userProfile }: ProfileTweetsProps) {
  const [tweets, setTweets] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Race Condition 방지를 위한 Ref
  const activeTabRef = useRef(activeTab);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  // 좋아요 탭 전용: 전체 ID 리스트 캐싱 (페이지네이션용)
  const likedItemsRef = useRef<{ type: 'post' | 'reply'; id: string; date: string; likedAt: string }[]>([]);
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
  }, [activeTab, userProfile.id]);
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
        newData = await tweetService.getPosts(userProfile.id, pageToLoad);
      } 
      // 2) 내가 쓴 댓글
      else if (currentTab === 'replies') {
        newData = await tweetService.getReplies(userProfile.id, pageToLoad);
      } 
      // 3) 좋아요한 글
      else if (currentTab === 'likes') {
        const { items, allLikedItems } = await tweetService.getLikedItems(
          userProfile.id, 
          pageToLoad, 
          likedItemsRef.current // 캐싱된 전체 리스트 전달
        );
        
        // 첫 로드(또는 갱신) 시 전체 리스트를 받아와 캐시 업데이트
        if (allLikedItems && allLikedItems.length > 0) {
           likedItemsRef.current = allLikedItems;
        }
        newData = items;
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
      console.error('Error fetching tweets:', error);
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
    loading // 세 번째 필수 인자 전달
  );
  // 실시간 업데이트 (좋아요/댓글 수 등 stats 반영)
  useEffect(() => {
    if (!userProfile?.id) return;
    // channel 변수명을 일관되게 유지 (cleanup 함수와의 호환성)
    const channel = supabase
      .channel(`profile-realtime-${userProfile.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
        const updated = payload.new as any;
        setTweets(prev => prev.map(t => 
           t.id === updated.id 
           ? { ...t, stats: { ...t.stats, replies: updated.reply_count, likes: updated.like_count, views: updated.view_count } } 
           : t
        ));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
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
    <div className="flex flex-col gap-4 pb-10">
      {tweets.map(item =>
        item.type === 'reply' ? (
          <ReplyCard
            key={item.id}
            reply={item}
            highlight={false}
            onUnlike={id => {
               // 좋아요 탭에서는 좋아요 취소 시 목록에서 즉시 제거
               if (activeTab === 'likes') {
                 setTweets(prev => prev.filter(t => t.id !== id));
               }
            }}
          />
        ) : (
          <TweetCard
            key={item.id}
            {...item}
            onUnlike={id => {
               if (activeTab === 'likes') {
                 setTweets(prev => prev.filter(t => t.id !== id));
               }
            }}
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
  );
}
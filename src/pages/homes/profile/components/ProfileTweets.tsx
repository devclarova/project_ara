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
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  
  // Page Ref for stability to prevent fetchTweets recreation
  const pageRef = useRef(0);
  
  // Race Condition 방지를 위한 Ref
  const activeTabRef = useRef(activeTab);
  const loadingRef = useRef(false);
  const likedItemsRef = useRef<{ type: 'post' | 'reply'; id: string; date: string; likedAt: string }[]>([]); // 좋아요 탭 전용: 전체 ID 및 시간 리스트 보관

  // 탭 변경 감지 및 상태 초기화
  useEffect(() => {
    activeTabRef.current = activeTab;
    setTweets([]);
    pageRef.current = 0; // Reset page ref
    setHasMore(true);
    setLoading(true);
    loadingRef.current = false;
    likedItemsRef.current = []; // 탭 변경 시 캐시된 좋아요 리스트 초기화
    
    // 탭이 바뀌면 즉시 새 데이터를 요청
    fetchTweets(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userProfile.id]);

  /** 트윗 불러오기 */
  // isInitialLoad: 탭 변경 등으로 인한 첫 로드 여부
  /** 트윗 불러오기 */
  // isInitialLoad: 탭 변경 등으로 인한 첫 로드 여부
  const fetchTweets = useCallback(async (forcedPage?: number, isInitialLoad = false) => {
    if (!userProfile?.id) return;
    
    // 현재 요청이 유효한지 확인하기 위해 캡처
    const currentTab = activeTabRef.current;
    const itemsToLoad = forcedPage !== undefined ? forcedPage : pageRef.current;

    // 이미 로딩중이고 첫 로드가 아니면 스킵 (중복 요청 방지)
    if (loadingRef.current && !isInitialLoad) return;
    
    // 더 가져올 게 없는데 첫 로드가 아니면 스킵
    if (!hasMore && !isInitialLoad && itemsToLoad > 0) return;

    loadingRef.current = true;
    if (itemsToLoad === 0) setLoading(true);

    try {
      let newData: FeedItem[] = [];

      // 1) 내가 쓴 게시글
      if (currentTab === 'posts') {
        newData = await tweetService.getPosts(userProfile.id, itemsToLoad);
      } 
      // 2) 내가 쓴 댓글
      else if (currentTab === 'replies') {
        const replies = await tweetService.getReplies(userProfile.id, itemsToLoad);
        newData = replies;
      } 
      // 3) 좋아요한 글
      else if (currentTab === 'likes') {
        const { items, allLikedItems } = await tweetService.getLikedItems(
          userProfile.id, 
          itemsToLoad, 
          likedItemsRef.current
        );
        
        // 캐시 업데이트 (첫 로드 시 전체 ID 리스트 받아옴)
        likedItemsRef.current = allLikedItems;
        newData = items;
      }

      // 요청 끝난 후 탭이 바뀌었으면 무시
      if (activeTabRef.current !== currentTab) return;

      // 상태 업데이트
      if (itemsToLoad === 0) {
        setTweets(newData);
      } else {
        setTweets(prev => {
          // 중복 방지
          const existingIds = new Set(prev.map(t => t.id));
          const filteredNew = newData.filter(t => !existingIds.has(t.id));
          return [...prev, ...filteredNew];
        });
      }

      // 더 가져올 데이터가 있는지 판단
      if (currentTab === 'likes') {
        const totalItems = likedItemsRef.current.length;
        const loadedCount = (itemsToLoad + 1) * PAGE_SIZE;
        setHasMore(loadedCount < totalItems);
      } else {
        if (newData.length < PAGE_SIZE) {
          setHasMore(false);
        }
      }
      
      // 다음 페이지 준비
      if (itemsToLoad === pageRef.current) {
        pageRef.current += 1;
      }
      
    } catch (error) {
      console.error('Error fetching tweets:', error);
    } finally {
      if (activeTabRef.current === currentTab) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  }, [hasMore, userProfile?.id]); // removed 'page' dependency to keep function stable

  // Infinite Scroll Trigger
  const loadMoreRef = useInfiniteScroll(() => {
    fetchTweets();
  }, hasMore, loadingRef.current);

  // 초기 로드
  useEffect(() => {
    fetchTweets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userProfile.id]); // activeTab dependency removed from useCallback to prevent recreation, handled by ref




  /** 실시간 반영용 구독 채널 (기존 유지하되 stale check 추가) */
  useEffect(() => {
    if (!userProfile?.id) return;
    const currentTab = activeTabRef.current;

    const handleUpdate = (payload: any) => {
      // 현재 탭에서 보여주고 있는 데이터에 대해서만 업데이트
      setTweets(prev => prev.map(t => t.id === payload.new.id ? { ...t, stats: { ...t.stats, replies: payload.new.reply_count, likes: payload.new.like_count, views: payload.new.view_count } } : t));
    };

     const updateChannel = supabase
      .channel(`profile-tweets-stats-${userProfile.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
          // Realtime payload is the raw row, using 'any' as proper Row type isn't fully defined yet
          const updated = payload.new as any;
          setTweets(prev => prev.map(t => 
             t.id === updated.id 
             ? { ...t, stats: { ...t.stats, replies: updated.reply_count ?? t.stats.replies, likes: updated.like_count ?? t.stats.likes, views: updated.view_count ?? t.stats.views } } 
             : t
          ));
      })
      .subscribe();

     return () => {
       supabase.removeChannel(updateChannel);
     }
  }, [userProfile?.id]); // activeTab 의존성 제거 (탭 상관없이 stats 업데이트는 유효해도 됨, 혹은 탭 바뀔때마다 초기화)


  // 로딩 UI 처리
  if (loading && tweets.length === 0)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  if (!loading && !tweets.length)
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        {activeTab === 'posts'
          ? '아직 작성한 게시글이 없습니다.'
          : activeTab === 'replies'
            ? '아직 작성한 댓글이 없습니다.'
            : '좋아요한 게시글이 없습니다.'}
      </div>
    );

  return (
    <div>
      {tweets.map(item =>
        item.type === 'reply' ? (
          <ReplyCard
            key={item.id}
            reply={item}
            highlight={false}
            onUnlike={id => {
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
      
      {/* 무한 스크롤 트리거 */}
      {hasMore && !loading && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
}

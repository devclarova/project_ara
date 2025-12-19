
import SnsInlineEditor, { type SnsInlineEditorHandle } from '@/components/common/SnsInlineEditor';
import type { Database } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReplyList from './components/ReplyList';
import TweetDetailCard from './components/TweetDetailCard';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SnsStore } from '@/lib/snsState';
import type { UIPost, UIReply } from '@/types/sns';
import { tweetService } from '@/services/tweetService';

export default function TweetDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tweet, setTweet] = useState<UIPost | null>(null);
  const [replies, setReplies] = useState<UIReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // 알림에서 넘어올 때 state로 받은 값들
  const locationState = location.state as {
    highlightCommentId?: string;
    deletedComment?: boolean;
    scrollKey?: number;
  } | null;
  const highlightFromNotification = locationState?.highlightCommentId ?? null;
  const deletedCommentFromNotification = locationState?.deletedComment ?? false;
  // 스크롤 타겟 id (내가 이동시키고 싶은 순간에만 변경)
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);

  const editorRef = useRef<SnsInlineEditorHandle>(null); // Create ref for editor

  const handleReplyClick = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const scrollKeyRef = useRef<number>(0);

  // scrollKey 변화 감지해 항상 스크롤 실행.
  useEffect(() => {
    if (!locationState?.highlightCommentId) return;

    // 이미 해당 키로 스크롤을 시도했다면 중복 실행 방지 (history pollution 해결)
    if (locationState.scrollKey && scrollKeyRef.current === locationState.scrollKey) {
      return;
    }

    // 스크롤 타겟 설정
    setScrollTargetId(locationState.highlightCommentId);
    
    // 현재 키 저장
    if (locationState.scrollKey) {
        scrollKeyRef.current = locationState.scrollKey;
    }
  }, [locationState?.highlightCommentId, locationState?.scrollKey]);

  // 삭제된 댓글 플래그가 있을 때 토스트 표시
  useEffect(() => {
    if (deletedCommentFromNotification) {
      toast.info(t('tweet.deleted_reply'));
    }
  }, [deletedCommentFromNotification]);

  // 트윗 + 댓글 불러오기
  useEffect(() => {
    if (!id) return;
    fetchTweetById(id);
    setReplies([]);
    setPage(0);
    setHasMore(true);
    fetchReplies(id, 0); // 초기 페이지 0
  }, [id]);

  // 댓글 수가 변하면(실시간 추가/삭제 등) SnsStore에도 반영
  useEffect(() => {
    if (!tweet) return;
    // replies 변경될 때마다 캐시에 동기화
    SnsStore.updateStats(tweet.id, {
      replies: replies.length
    });
  }, [replies.length, tweet?.id]);

  // 댓글 삭제 실시간 반영
  useEffect(() => {
    if (!id) return;

    const deleteChannel = supabase
      .channel(`tweet-${id}-replies-delete`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tweet_replies',
          filter: `tweet_id=eq.${id}`, 
        },
        payload => {
          const oldRecord = payload.old as { id: string };
          const deletedId = oldRecord.id;
          setReplies(prev => prev.filter(r => r.id !== deletedId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deleteChannel);
    };
  }, [id]);

  // 트윗 정보(좋아요, 조회수 등) 실시간 업데이트
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`tweet-${id}-updates`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tweets',
          filter: `id=eq.${id}`,
        },
        payload => {
          const newTweet = payload.new as Database['public']['Tables']['tweets']['Row'];
          setTweet(prev => {
            if (!prev) return null;
            return {
              ...prev,
              stats: {
                ...prev.stats,
                likes: newTweet.like_count ?? 0,
                views: newTweet.view_count ?? 0,
                replies: newTweet.reply_count ?? 0,
              },
            };
          });
          
          // SnsStore 동기화
          SnsStore.updateStats(id, {
            likes: newTweet.like_count ?? 0,
            views: newTweet.view_count ?? 0,
            replies: newTweet.reply_count ?? 0
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tweets',
          filter: `id=eq.${id}`,
        },
        () => {
          SnsStore.removeTweet(id);
          toast.error(t('tweet.deleted_while_viewing'));
          navigate('/sns', { replace: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // 조회수 증가 (로그인 유저에게만, 트윗 로드 된 후 1회만)
  const isViewedRef = useRef(false);
  
  useEffect(() => {
    // 1. 기본 조건 체크
    if (!id || !user || !tweet) return;
    
    // 2. 이미 이 컴포넌트 생명주기에서 조회수 처리를 했는지 확인
    if (isViewedRef.current) return;

    // 3. 새로고침 확인 (Navigation Timing API Level 2)
    // SPA에서는 'reload'가 앱 초기 진입 방식을 의미하므로, 
    // 현재 컴포넌트가 '앱 실행 직후(2초 이내)'에 마운트된 경우만 진짜 새로고침으로 간주
    const navEntries = performance.getEntriesByType('navigation');
    const isReload = navEntries.length > 0 
      ? (navEntries[0] as PerformanceNavigationTiming).type === 'reload'
      : performance.navigation.type === 1; // Fallback

    if (isReload && performance.now() < 2000) {
      isViewedRef.current = true;
      return;
    }

    // 4. 조회수 증가 요청
    handleViewCount(id);
    isViewedRef.current = true;
  }, [id, user, tweet]);

  const handleViewCount = async (tweetId: string) => {
    try {
      if (!user) return;

      // 1. 화면 즉시 반영 (Optimistic Update)
      //    (주의: RPC 성공 여부와 관계없이 사용자 경험을 위해 증가)
      setTweet(prev => {
        if (!prev) return null;
        // 이미 방금 증가시킨 상태라면 또 올리지 않도록 (혹시 모를 중복 방지)
        // 하지만 여기선 단순 증가시킴. 상위 useEffect에서 가드하므로 괜찮음.
        const newViews = (prev.stats.views || 0) + 1;
        
        SnsStore.updateStats(tweetId, { views: newViews });

        return {
          ...prev,
          stats: {
            ...prev.stats,
            views: newViews
          }
        };
      });

      // 2. RPC 호출 (LocalStorage 체크 제거 -> 매 방문마다 카운트)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return;

      const { error } = await supabase.rpc('increment_tweet_view', {
        tweet_id_input: tweetId,
        viewer_id_input: profile.id, // viewer_id is used for history logging if needed, or just bypass uniqueness check/log logic in DB
      });

      if (error) {
        console.error('조회수 RPC 실패:', error.message);
      }
      
    } catch (err) {
      console.error('조회수 처리 실패:', err);
    }
  };

  // 트윗 데이터 불러오기
  const fetchTweetById = async (tweetId: string) => {
    setIsLoading(true);
    try {
      const data = await tweetService.getTweetById(tweetId);

      if (!data) {
        toast.info(t('tweet.deleted_or_not_exist'));
        navigate(-1);
        return;
      }

      setTweet(data);
    } catch (error: any) {
      console.error('트윗 불러오기 실패:', error.message);
      toast.info(t('tweet.deleted_or_not_exist'));
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  // 댓글 목록 불러오기 (페이지네이션)
  const fetchReplies = async (tweetId: string, pageParam = 0) => {
    // 알림으로 들어와서 특정 댓글을 하이라이트해야 하는 경우, 전체 로드 (무한스크롤 일시 중지)
    // 단, pageParam > 0 이면 무한스크롤 로드 중이므로 range 적용
    const shouldLoadAll = !!highlightFromNotification && pageParam === 0;

    try {
      const mapped = await tweetService.getRepliesByTweetId(tweetId, pageParam, shouldLoadAll);

      if (shouldLoadAll) {
        // 전체 로드 시에는 기존 것 덮어쓰고 더보기 없음 처리
        setReplies(mapped);
        setHasMore(false);
      } else {
        // 페이지네이션
        if (mapped.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setReplies(prev => {
          // 중복 제거 및 created_at 순 정렬
          const merged = pageParam === 0 ? mapped : [...prev, ...mapped];
          const unique = merged.filter((r, i, self) => 
            i === self.findIndex(t => t.id === r.id)
          );
          return unique.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        });
        
        setPage(pageParam + 1);
      }
    } catch (error: any) {
      console.error('댓글 불러오기 실패:', error.message);
    }
  };

  // 실시간 댓글 추가 채널 (추가만 반영, 스크롤은 건드리지 않음)
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`tweet-${id}-replies-changes`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tweet_replies',
          filter: `tweet_id=eq.${id}`,
        },
        async payload => {
          // ... (INSERT logic remains same)
          const newReply = payload.new as Database['public']['Tables']['tweet_replies']['Row'];
          // 이미 리스트에 있는 댓글이면 무시
          setReplies(prev => {
            if (prev.some(r => r.id === newReply.id)) return prev;
            return prev;
          });
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, user_id, avatar_url')
            .eq('id', newReply.author_id)
            .maybeSingle();
          const formattedReply = {
            type: 'reply',
            id: newReply.id,
            tweetId: newReply.tweet_id,
            parent_reply_id: newReply.parent_reply_id ?? null,
            root_reply_id: newReply.root_reply_id ?? null,
            user: {
              name: profile?.nickname ?? 'Unknown',
              username: profile?.user_id ?? 'anonymous',
              avatar: profile?.avatar_url ?? '/default-avatar.svg',
            },
            content: newReply.content,
            timestamp: new Date(newReply.created_at ?? Date.now()).toLocaleString('ko-KR', {
              hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric',
            }),
            createdAt: newReply.created_at ?? new Date().toISOString(),
            stats: { replies: 0, retweets: 0, likes: newReply.like_count ?? 0, views: 0 },
            liked: false,
          } as UIReply;
          setReplies(prev => {
            if (prev.some(r => r.id === formattedReply.id)) return prev;
            const combined = [...prev, formattedReply];
            return combined.sort((a,b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tweet_replies',
          filter: `tweet_id=eq.${id}`,
        },
        payload => {
          const newReply = payload.new as Database['public']['Tables']['tweet_replies']['Row'];
          setReplies(prev => 
            prev.map(r => r.id === newReply.id ? {
              ...r,
              stats: {
                ...r.stats,
                likes: newReply.like_count ?? r.stats.likes,
              }
            } : r)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

   // 새 댓글 작성 후 콜백: 새로 작성된 댓글로 스크롤 + 하이라이트
  const handleReplyCreated = (reply: UIReply) => {
    // 1. Optimistic Update: 즉시 목록에 추가
    setReplies(prev => {
        // 이미 존재하면 추가하지 않음 (혹시 모를 중복 방지)
        if (prev.some(r => r.id === reply.id)) return prev;
        
        const combined = [...prev, reply];
        // 정렬
        return combined.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    });

    // 2. 스크롤 처리
    setTimeout(() => {
      setScrollTargetId(reply.id);
      requestAnimationFrame(() => {
        const el = document.getElementById(`reply-${reply.id}`);
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      });
    }, 100); 
  };

  // replies가 로드된 뒤 scrollTargetId를 다시 트리거하여 스크롤이 실행되도록 함
  useEffect(() => {
    if (!scrollTargetId) return; // 스크롤할 타겟이 없으면 X
    if (replies.length === 0) return; // 아직 댓글이 로드 안 됨

    // DOM 렌더가 완료되도록 약간의 텀을 줌
    const t = setTimeout(() => {
      setScrollTargetId(id => id); // 같은 값으로 다시 트리거 → scrollEffect 발동
    }, 50);

    return () => clearTimeout(t);
  }, [replies]);

  // 스크롤 이펙트: scrollTargetId 가 바뀔 때만 한 번 실행
  useEffect(() => {
    if (!scrollTargetId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8; // 최대 8번 재시도

    const tryScroll = () => {
      if (cancelled) return;

      const el = document.getElementById(`reply-${scrollTargetId}`) || document.getElementById(scrollTargetId!);
      if (el) {
        // comment-editor인 경우 화면 중앙에 오도록 처리
        if (scrollTargetId === 'comment-editor') {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } else {
          // 댓글인 경우 헤더 오프셋 고려
          const headerOffset = 120;
          const rect = el.getBoundingClientRect();
          const absoluteY = window.scrollY + rect.top;

          window.scrollTo({
            top: absoluteY - headerOffset,
            behavior: 'smooth',
          });
        }
        return;
      }

      if (attempts < maxAttempts) {
        attempts += 1;
        setTimeout(tryScroll, 200);
      }
    };

    tryScroll();

    return () => {
      cancelled = true;
    };
  }, [scrollTargetId]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="border-x border-gray-200 dark:border-gray-700 dark:bg-background">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-primary" />
        </div>
      </div>
    );
  }

  if (!tweet) {
    navigate('/sns', { replace: true });
    return null;
  }

  return (
    <div className="border-x border-gray-200 dark:border-gray-700 dark:bg-background">
      {/* 댓글 수는 항상 replies.length 기준으로 표시 */}
      <TweetDetailCard 
        tweet={tweet} 
        replyCount={replies.length} 
        onReplyClick={handleReplyClick} 
      />
      {/* 
        Wait, TweetDetailCard prop `onReplyClick` usually focuses editor. 
        In my previous code it was `handleReplyClick`.
        Let's check the restored code.
        Ah, I see `onReplyClick={handleReplyClick}` in my write_to_file content. Good.
      */}

      {!user && (
        <div className="border-y border-gray-200 dark:border-gray-700 px-4 py-7 bg-gray-50/80 dark:bg-muted/40 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('tweet.login_to_reply', '댓글은 로그인 후 작성하실 수 있어요.')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('tweet.join_community_desc', '커뮤니티에 참여하려면 로그인 또는 회원가입을 진행해주세요.')}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-primary text-white hover:opacity-90"
            >
              {t('auth.signin')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-primary text-primary hover:bg-primary/5"
            >
              {t('auth.signup')}
            </button>
          </div>
        </div>
      )}

      {user && (
        <div id="comment-editor">
          <SnsInlineEditor
            ref={editorRef}
            mode="reply"
            tweetId={tweet.id}
            onReplyCreated={handleReplyCreated}
            onFocus={() => {
              // SnsInlineEditor handles scrolling on focus internally
            }}
            onInput={() => {
              const editor = document.getElementById('comment-editor');
              if (editor) {
                const rect = editor.getBoundingClientRect();
                if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
                  editor.scrollIntoView({ block: 'center', behavior: 'auto' });
                }
              }
            }}
          />
        </div>
      )}

      <ReplyList
        replies={replies}
        onDeleted={id => {
          setReplies(prev => prev.filter(r => r.id !== id));
          if (tweet) {
            SnsStore.updateStats(tweet.id, {
              replies: Math.max(0, replies.length - 1)
            });
          }
        }}
        hasMore={hasMore}
        fetchMore={() => {
          if (tweet?.id) fetchReplies(tweet.id, page);
        }}
        onCommentClick={(commentId) => {
            setScrollTargetId(commentId);
        }}
        highlightId={scrollTargetId}
      />
    </div>
  );
}
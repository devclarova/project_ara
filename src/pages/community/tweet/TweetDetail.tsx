import SnsInlineEditor, { type SnsInlineEditorHandle } from '@/components/common/SnsInlineEditor';
import type { Database } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

import { useBlockedUsers } from '@/hooks/useBlockedUsers';
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
  const { blockedIds } = useBlockedUsers(); // 차단 유저 확인

  const [openReplyId, setOpenReplyId] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // 알림에서 넘어올 때 state로 받은 값들
  const locationState = location.state as {
    highlightCommentId?: string;
    deletedComment?: boolean;
    scrollKey?: number;
    fromAdmin?: boolean;
  } | null;
  const highlightFromNotification = locationState?.highlightCommentId ?? null;
  const deletedCommentFromNotification = locationState?.deletedComment ?? false;
  // 스크롤 타겟 id (내가 이동시키고 싶은 순간에만 변경)
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(
    locationState?.highlightCommentId || null,
  );
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

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

    // 스크롤 타겟 설정 (강제 리셋 후 설정하여 하이라이트 재트리거 유도)
    setScrollTargetId(null);
    setActiveHighlightId(null);
    setTimeout(() => {
      setScrollTargetId(locationState.highlightCommentId || null);
    }, 50);

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
    // Parallelize for speed
    Promise.all([
      fetchTweetById(id),
      fetchReplies(id, 0, true), // 초기 페이지 0, 전체 로드?
    ]);
    setReplies([]);
    setPage(0);
    setHasMore(true);
  }, [id, locationState?.scrollKey]);

  // blockedIds 변경 시 댓글 목록 필터링
  useEffect(() => {
    if (blockedIds.length === 0) return;
    setReplies(prev => prev.filter(r => !blockedIds.includes(r.user.username)));
    // 트윗 본문 작성자가 차단된 경우 처리 (선택)
    if (tweet && blockedIds.includes(tweet.user.username)) {
      toast.info(t('tweet.author_blocked', '차단된 사용자의 트윗입니다.'));
      navigate(-1);
    }
  }, [blockedIds, tweet]);

  // 댓글 수가 변하면(실시간 추가/삭제 등) SnsStore에도 반영
  useEffect(() => {
    if (!tweet) return;
    // replies 변경될 때마다 캐시에 동기화
    SnsStore.updateStats(tweet.id, {
      replies: replies.length,
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

  // 트윗 정보 및 작성자 프로필 실시간 업데이트
  useEffect(() => {
    if (!id) return;

    // 1. 트윗 내용 및 통계 업데이트
    const tweetChannel = supabase
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
              updatedAt: newTweet.updated_at ?? prev.updatedAt,
              stats: {
                ...prev.stats,
                likes: newTweet.like_count ?? 0,
                views: newTweet.view_count ?? 0,
                replies: newTweet.reply_count ?? 0,
              },
            };
          });

          SnsStore.updateStats(id, {
            likes: newTweet.like_count ?? 0,
            views: newTweet.view_count ?? 0,
            replies: newTweet.reply_count ?? 0,
          });
        },
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
        },
      )
      .subscribe();

    // 2. 작성자 프로필 업데이트 (제재 상태 실시간 반영)
    const profileChannel = supabase
      .channel(`tweet-${id}-profiles-sync`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        const updated = payload.new as any;
        if (updated.banned_until === undefined) return;

        // 본문 작성자 체크
        setTweet(prev => {
          if (
            prev &&
            (String(prev.user.id) === String(updated.id) ||
              String(prev.user.username) === String(updated.user_id))
          ) {
            return {
              ...prev,
              user: { ...prev.user, banned_until: updated.banned_until },
            };
          }
          return prev;
        });

        // 댓글 작성자들 체크
        setReplies(prev =>
          prev.map(r => {
            if (
              String(r.user.username) === String(updated.user_id) ||
              String((r as any).author_id) === String(updated.id)
            ) {
              return {
                ...r,
                user: { ...r.user, banned_until: updated.banned_until },
              };
            }
            return r;
          }),
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tweetChannel);
      supabase.removeChannel(profileChannel);
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
    const isReload =
      navEntries.length > 0
        ? (navEntries[0] as PerformanceNavigationTiming).type === 'reload'
        : performance.navigation.type === 1; // Fallback

    if (isReload && performance.now() < 2000) {
      isViewedRef.current = true;
      return;
    }

    // 4. 관리자 페이지에서 접근한 경우 조회수 증가 생략
    if (locationState?.fromAdmin) {
      isViewedRef.current = true;
      return;
    }

    // 5. 조회수 증가 요청
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
            views: newViews,
          },
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
        // 에러 로깅 생략
      }
    } catch (err) {
      console.error('조회수 처리 실패:', err);
    }
  };

  // 트윗 데이터 불러오기
  const fetchTweetById = async (tweetId: string) => {
    // If fromAdmin, don't set global loading to true to prevent screen flicker
    if (!locationState?.fromAdmin) {
      setIsLoading(true);
    }
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
  const fetchReplies = async (tweetId: string, pageParam = 0, loadAll = false) => {
    // 알림으로 들어와서 특정 댓글을 하이라이트해야 하는 경우, 전체 로드 (무한스크롤 일시 중지)
    // 단, pageParam > 0 이면 무한스크롤 로드 중이므로 range 적용
    const shouldLoadAllFromNotification = !!highlightFromNotification && pageParam === 0;
    const shouldLoadAll = loadAll || shouldLoadAllFromNotification;

    try {
      // setIsLoading(true); // 무한 스크롤 시 전체 로딩 걸리는 문제 수정
      const mapped = await tweetService.getRepliesByTweetId(tweetId, pageParam, shouldLoadAll);

      // 차단 필터링 적용
      const filtered = mapped.filter(r => !blockedIds.includes(r.user.username));

      if (shouldLoadAll) {
        // 전체 로드 시에는 기존 것 덮어쓰고 더보기 없음 처리
        setReplies(filtered);
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
          const unique = merged.filter((r, i, self) => i === self.findIndex(t => t.id === r.id));
          return unique.sort(
            (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
          );
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
            // timestamp: new Date(newReply.created_at ?? Date.now()).toLocaleString('ko-KR', {
            //   hour: '2-digit',
            //   minute: '2-digit',
            //   month: 'short',
            //   day: 'numeric',
            // }),
            timestamp: newReply.created_at ?? new Date().toISOString(),
            createdAt: newReply.created_at ?? new Date().toISOString(),
            updatedAt: newReply.updated_at,
            stats: { replies: 0, retweets: 0, likes: newReply.like_count ?? 0, views: 0 },
            liked: false,
          } as UIReply;
          setReplies(prev => {
            if (prev.some(r => r.id === formattedReply.id)) return prev;
            // 차단된 유저의 실시간 댓글이면 추가하지 않음 (선택 사항)
            if (blockedIds.includes(formattedReply.user.username)) return prev;

            const combined = [...prev, formattedReply];
            return combined.sort(
              (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
            );
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
            prev.map(r =>
              r.id === newReply.id
                ? {
                    ...r,
                    stats: {
                      ...r.stats,
                      likes: newReply.like_count ?? r.stats.likes,
                    },
                  }
                : r,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, blockedIds]); // blockedIds 의존성 추가

  // 새 댓글 작성 후 콜백: 새로 작성된 댓글로 스크롤 + 하이라이트
  const handleReplyCreated = (reply: UIReply) => {
    const fixed: UIReply = {
      ...reply,
      createdAt: reply.createdAt ?? new Date().toISOString(),
    };

    // 1. Optimistic Update: 즉시 목록에 추가
    setReplies(prev => {
      // 이미 존재하면 추가하지 않음 (혹시 모를 중복 방지)
      if (prev.some(r => r.id === reply.id)) return prev;

      const combined = [...prev, reply];
      // 정렬
      return combined.sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
      );
    });

    // 2. 스크롤 처리
    setTimeout(() => {
      setScrollTargetId(fixed.id);
      setActiveHighlightId(fixed.id); // 작성 직후 하이라이트
      requestAnimationFrame(() => {
        document
          .getElementById(`reply-${fixed.id}`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }, 100);
  };

  const handleChildReplyAdded = (newReply: UIReply) => {
    // 1) 대댓글을 목록에 추가 (트리 렌더링은 ReplyList가 parent_reply_id로 알아서 붙임)
    setReplies(prev => {
      if (prev.some(r => r.id === newReply.id)) return prev;

      // 부모 댓글의 replies 숫자 +1 (프론트에서만)
      const parentId = (newReply as any).parent_reply_id as string | undefined | null;

      const bumped = prev.map(r => {
        if (!parentId) return r;
        if (r.id !== parentId) return r;

        return {
          ...r,
          stats: {
            ...r.stats,
            replies: (r.stats?.replies ?? 0) + 1,
          },
        };
      });

      return [...bumped, newReply].sort(
        (a, b) =>
          new Date(a.createdAt || a.timestamp || 0).getTime() -
          new Date(b.createdAt || b.timestamp || 0).getTime(),
      );
    });

    // 2) UI: 입력창 닫기
    setOpenReplyId(null);

    // 3) (선택) 방금 단 대댓글로 스크롤/하이라이트
    setTimeout(() => {
      setScrollTargetId(newReply.id);
      setActiveHighlightId(newReply.id);
      requestAnimationFrame(() => {
        document
          .getElementById(`reply-${newReply.id}`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }, 50);
  };

  const handleToggleReply = (id: string) => {
    setScrollTargetId(id);
    setOpenReplyId(prev => (prev === id ? null : id));
  };

  const handleCloseReply = () => {
    setOpenReplyId(null);
  };

  // ULTIMATE 'Magnet' Scroll Engine: Maximum resilience for viral threads
  useEffect(() => {
    if (!scrollTargetId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 500; // Poll for up to 50 seconds - Extreme resilience

    // Force clear any global scroll reset if we're jumping to a comment
    if (attempts === 0) {
      window.history.scrollRestoration = 'manual';
    }
    let foundAndLocked = false;
    let lockTimer: any = null;

    const findAndScroll = () => {
      if (cancelled) return;

      const targetId = `reply-${scrollTargetId}`;
      const el = document.getElementById(targetId) || document.getElementById(scrollTargetId);

      if (el) {
        const rect = el.getBoundingClientRect();

        // Ensure element is actually rendered and has height
        if (rect.height === 0) {
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(findAndScroll, 10);
          }
          return;
        }

        // --- STAGE 1: CINEMATIC SMOOTH GLIDE ---
        if (!foundAndLocked) {
          const headerOffset = 130;
          const targetY = window.scrollY + rect.top - headerOffset;

          // 단 한 번의 부드러운 스크롤 요청
          window.scrollTo({ top: targetY, behavior: 'smooth' });
          foundAndLocked = true;

          // 주행이 완료될 즈음(또는 시작 직후) 하이라이트 활성화
          // v9: 요소가 발견된 즉시 하이라이트를 트리거하여 유저가 도착했을 때 이미 번쩍이고 있게 함
          setActiveHighlightId(scrollTargetId);

          // 스크롤 완료 후 정밀 보정 (단 1회 수행, 루프 없음)
          setTimeout(() => {
            if (cancelled) return;
            const finalRect = el.getBoundingClientRect();
            // 50px 이상 벗어났을 때만 보정 (덜 공격적으로)
            if (Math.abs(finalRect.top - headerOffset) > 50) {
              window.scrollTo({
                top: window.scrollY + finalRect.top - headerOffset,
                behavior: 'smooth',
              });
            }
            // 주행 완료 후 타겟 초기화 (무한 루프 방지 핵심)
            setScrollTargetId(null);
          }, 800);
        }
        return;
      }

      // 아직 요소를 못 찾았을 때만 재시도 (최대 50초)
      if (!foundAndLocked && attempts < maxAttempts) {
        attempts++;
        setTimeout(findAndScroll, 100); // v9: 폴링 간격을 100ms로 완화하여 CPU 부하 감소
      }
    };

    findAndScroll();

    return () => {
      cancelled = true;
      if (lockTimer) clearTimeout(lockTimer);
    };
  }, [scrollTargetId, replies, locationState?.scrollKey]);

  // 게시글 자체 중재 시 최상단 강제 스택
  useEffect(() => {
    if (locationState?.fromAdmin && !locationState?.highlightCommentId) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [id, locationState?.scrollKey]);

  // 로딩 상태: 관리자 페이지 접속 시에는 로딩 스피너 우회 (즉시 레이아웃 노출)
  if (isLoading && !locationState?.fromAdmin) {
    return (
      <div className="border-x border-gray-200 dark:border-gray-700 dark:bg-background">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-primary" />
        </div>
      </div>
    );
  }

  if (!tweet) {
    return null;
  }

  return (
    <div className="border-x border-gray-200 dark:border-gray-700 dark:bg-background">
      {/* 댓글 수는 항상 replies.length 기준으로 표시 */}
      <TweetDetailCard tweet={tweet} replyCount={replies.length} onReplyClick={handleReplyClick} />

      {!user && (
        <div className="border-y border-gray-200 dark:border-gray-700 px-4 py-7 bg-gray-50/80 dark:bg-muted/40 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('tweet.login_to_reply', '댓글은 로그인 후 작성하실 수 있어요.')}
            </span>
            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t(
                'tweet.join_community_desc',
                '커뮤니티에 참여하려면 로그인 또는 회원가입을 진행해주세요.',
              )}
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
        openReplyId={openReplyId}
        onDeleted={deletedId => {
          setReplies(prev => {
            const target = prev.find(r => r.id === deletedId);
            const parentId = (target as any)?.parent_reply_id;

            const filtered = prev.filter(r => r.id !== deletedId);

            if (!parentId) return filtered;

            return filtered.map(r =>
              r.id === parentId
                ? { ...r, stats: { ...r.stats, replies: Math.max(0, (r.stats?.replies ?? 0) - 1) } }
                : r,
            );
          });
        }}
        hasMore={hasMore}
        fetchMore={() => {
          if (tweet?.id) fetchReplies(tweet.id, page);
        }}
        onCommentClick={commentId => {
          const isOpening = openReplyId !== commentId;
          setOpenReplyId(prev => (prev === commentId ? null : commentId)); // 토글 지원으로 통합
          
          // 댓글 입력창을 여는 경우에만 스크롤 고려
          if (isOpening) {
            // 댓글 카드 요소 찾기
            const commentEl = document.getElementById(`reply-${commentId}`);
            if (commentEl) {
              const rect = commentEl.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              // 에디터 높이 예상 (대략 200px)
              const editorHeight = 200;
              // 댓글 하단 + 에디터가 화면에 들어오는지 확인
              const wouldBeVisible = rect.bottom + editorHeight < viewportHeight - 50;
              
              // 화면에 무리 없이 나올 수 있으면 스크롤 안 함
              if (!wouldBeVisible) {
                setScrollTargetId(commentId);
              }
            }
          }
        }}
        onAddedReply={handleChildReplyAdded}
        highlightId={activeHighlightId} // 스크롤용 ID와 별개로 하이라이트 전용 ID 사용
        onCloseReply={handleCloseReply}
      />
    </div>
  );
}

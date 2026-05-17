import SnsInlineEditor, { type SnsInlineEditorHandle } from '@/components/common/SnsInlineEditor';
import type { Database } from '@/types/database';
import type { PostgrestError } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

type ProfileAdminRow = {
  is_admin: boolean | null;
};

type ProfileAdminBatchRow = {
  id: string;
  is_admin: boolean | null;
};

type ProfileIdRow = {
  id: string;
};

type ProfileFullRow = {
  id: string;
  nickname: string | null;
  user_id: string | null;
  avatar_url: string | null;
  plan: string | null;
  is_admin: boolean | null;
};

import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { supabase } from '@/lib/supabase';
import { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReplyList from './components/ReplyList';
import TweetDetailCard from './components/TweetDetailCard';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SnsStore } from '@/lib/snsState';
import type { UIPost, UIReply } from '@/types/sns';
import { tweetService } from '@/services/tweetService';
import { getErrorMessage } from '@/utils/errorMessage';

export default function TweetDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user, profileId, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tweet, setTweet] = useState<UIPost | null>(null);
  const [replies, setReplies] = useState<UIReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { blockedIds } = useBlockedUsers(); // 차단 ?��? ?�인

  const [openReplyId, setOpenReplyId] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // ?�림?�서 ?�어????state�?받�? 값들
  const locationState = location.state as {
    highlightCommentId?: string;
    deletedComment?: boolean;
    scrollKey?: number;
    fromAdmin?: boolean;
  } | null;
  const highlightFromNotification = locationState?.highlightCommentId ?? null;
  const deletedCommentFromNotification = locationState?.deletedComment ?? false;
  // ?�크�??��?id (?��? ?�동?�키�??��? ?�간?�만 변�?
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

  // scrollKey 변??감�?????�� ?�크�??�행.
  useEffect(() => {
    if (!locationState?.highlightCommentId) return;

    // ?��? ?�당 ?�로 ?�크롤을 ?�도?�다�?중복 ?�행 방�? (history pollution ?�결)
    if (locationState.scrollKey && scrollKeyRef.current === locationState.scrollKey) {
      return;
    }

    // ?�크�??��??�정 (강제 리셋 ???�정?�여 ?�이?�이???�트리거 ?�도)
    setScrollTargetId(null);
    setActiveHighlightId(null);
    setTimeout(() => {
      setScrollTargetId(locationState.highlightCommentId || null);
    }, 50);

    // ?�재 ???�??
    if (locationState.scrollKey) {
      scrollKeyRef.current = locationState.scrollKey;
    }
  }, [locationState?.highlightCommentId, locationState?.scrollKey]);

  // ??��???��? ?�래그�? ?�을 ???�스???�시
  useEffect(() => {
    if (deletedCommentFromNotification) {
      toast.info(t('tweet.deleted_reply'));
    }
  }, [deletedCommentFromNotification]);

  // ?�윗 + ?��? 불러?�기
  useEffect(() => {
    if (!id) return;
    // Parallelize for speed
    Promise.all([
      fetchTweetById(id),
      fetchReplies(id, 0, true), // 초기 ?�이지 0, ?�체 로드?
    ]);
    setReplies([]);
    setPage(0);
    setHasMore(true);
  }, [id, locationState?.scrollKey]);

  // blockedIds 변�????�윗 본문 ?�성??차단 ?��?�?체크
  useEffect(() => {
    if (blockedIds.length === 0) return;
    
    // ?�윗 본문 ?�성?��? 차단??경우 처리 (?�택)
    if (tweet && blockedIds.includes(tweet.user.username)) {
      toast.info(t('tweet.author_blocked', '차단???�용?�의 게시물입?�다.'));
      navigate(-1);
    }
  }, [blockedIds, tweet]);

  // ?��? ?��? 변?�면(?�시�?추�?/??�� ?? SnsStore?�도 반영
  useEffect(() => {
    if (!tweet) return;
    // replies 변경될 ?�마??캐시???�기??
    SnsStore.updateStats(tweet.id, {
      replies: replies.length,
    });
  }, [replies.length, tweet?.id]);

  // ?��? ??�� ?�시�?반영
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

  // ?�윗 ?�보 �??�성???�로???�시�??�데?�트
  useEffect(() => {
    if (!id) return;

    // 1. ?�윗 ?�용 �??�계 ?�데?�트
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

    // 2. ?�성???�로???�데?�트 (?�재 ?�태 ?�시�?반영)
    const profileChannel = supabase
      .channel(`tweet-${id}-profiles-sync`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        const updated = payload.new as { id: string; user_id: string; banned_until?: string | null };
        if (updated.banned_until === undefined) return;

        // 본문 ?�성??체크
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

        // ?��? ?�성?�들 체크
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

  // 조회??증�? (로그???��??�게�? ?�윗 로드 ????1?�만)
  const isViewedRef = useRef(false);

  useEffect(() => {
    // 1. 기본 조건 체크
    if (!id || !user || !tweet) return;

    // 2. ?��? ??컴포?�트 ?�명주기?�서 조회??처리�??�는지 ?�인
    if (isViewedRef.current) return;

    // 3. ?�로고침 ?�인 (Navigation Timing API Level 2)
    // SPA?�서??'reload'가 ??초기 진입 방식???��??��?�?
    // ?�재 컴포?�트가 '???�행 직후(2�??�내)'??마운?�된 경우�?진짜 ?�로고침?�로 간주
    const navEntries = performance.getEntriesByType('navigation');
    const isReload =
      navEntries.length > 0
        ? (navEntries[0] as PerformanceNavigationTiming).type === 'reload'
        : performance.navigation.type === 1; // Fallback

    if (isReload && performance.now() < 2000) {
      isViewedRef.current = true;
      return;
    }

    // 4. 관리자 ?�이지?�서 ?�근??경우 조회??증�? ?�략
    if (locationState?.fromAdmin) {
      isViewedRef.current = true;
      return;
    }

    // 5. 조회??증�? ?�청
    handleViewCount(id);
    isViewedRef.current = true;
  }, [id, user, tweet]);

  const handleViewCount = async (tweetId: string) => {
    try {
      if (!user) return;

      // 1. ?�면 즉시 반영 (Optimistic Update)
      //    (주의: RPC ?�공 ?��??� 관계없???�용??경험???�해 증�?)
      setTweet(prev => {
        if (!prev) return null;
        // ?��? 방금 증�??�킨 ?�태?�면 ???�리지 ?�도�?(?�시 모�? 중복 방�?)
        // ?��?�??�기???�순 증�??�킴. ?�위 useEffect?�서 가?�하므�?괜찮??
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

      // 2. RPC ?�출 (LocalStorage 체크 ?�거 -> �?방문마다 카운??
      const { data: profile } = (await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()) as { data: ProfileIdRow | null; error: PostgrestError | null };

      if (!profile) return;

      const { error } = await (supabase as any).rpc('increment_tweet_view', {
        tweet_id_input: tweetId,
        viewer_id_input: profile.id, // viewer_id is used for history logging if needed, or just bypass uniqueness check/log logic in DB
      });

      if (error) {
        // ?�러 로깅 ?�략
      }
    } catch (err) {
      console.error('조회??처리 ?�패:', err);
    }
  };

  // ?�윗 ?�이??불러?�기
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

      const tweetData = data as any;
      if (tweetData.user?.id) {
        const { data: pData } = (await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', tweetData.user.id)
          .maybeSingle()) as { data: ProfileAdminRow | null; error: PostgrestError | null };
        if (pData) {
          tweetData.user.is_admin = pData.is_admin;
        }
      }

      setTweet(tweetData);
    } catch (error: unknown) {
      console.error('?�윗 불러?�기 ?�패:', getErrorMessage(error));
      toast.info(t('tweet.deleted_or_not_exist'));
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  // ?��? 목록 불러?�기 (?�이지?�이??
  const fetchReplies = async (tweetId: string, pageParam = 0, loadAll = false) => {
    // ?�림?�로 ?�어?�???�정 ?��????�이?�이?�해???�는 경우, ?�체 로드 (무한?�크�??�시 중�?)
    // ?? pageParam > 0 ?�면 무한?�크�?로드 중이므�?range ?�용
    const shouldLoadAllFromNotification = !!highlightFromNotification && pageParam === 0;
    const shouldLoadAll = loadAll || shouldLoadAllFromNotification;

    try {
      // setIsLoading(true); // 무한 ?�크�????�체 로딩 걸리??문제 ?�정
      const mapped = await tweetService.getRepliesByTweetId(tweetId, pageParam, shouldLoadAll, profileId, isAdmin);

      const userIds = (mapped as any[]).map(r => r.user?.id).filter(Boolean);
      if (userIds.length > 0) {
        const { data: pData } = (await supabase
          .from('profiles')
          .select('id, is_admin')
          .in('id', userIds)) as { data: ProfileAdminBatchRow[] | null; error: PostgrestError | null };
        if (pData) {
          const adminMap = new Map(pData.map(p => [p.id, p.is_admin]));
          (mapped as any[]).forEach(r => {
            if (r.user) {
              r.user.is_admin = adminMap.get(r.user.id) ?? false;
            }
          });
        }
      }

      if (shouldLoadAll) {
        // ?�체 로드 ?�에??기존 �???��?�고 ?�보�??�음 처리
        setReplies(mapped);
        setHasMore(false);
      } else {
        // ?�이지?�이??
        if (mapped.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setReplies(prev => {
          // 중복 ?�거 �?created_at ???�렬
          const merged = pageParam === 0 ? mapped : [...prev, ...mapped];
          const unique = merged.filter((r, i, self) => i === self.findIndex(t => t.id === r.id));
          return unique.sort(
            (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
          );
        });

        setPage(pageParam + 1);
      }
    } catch (error: unknown) {
      console.error('?��? 불러?�기 ?�패:', getErrorMessage(error));
    }
  };

  // ?�시�??��? 추�? 채널 (추�?�?반영, ?�크롤�? 건드리�? ?�음)
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
          // ?��? 리스?�에 ?�는 ?��??�면 무시
          setReplies(prev => {
            if (prev.some(r => r.id === newReply.id)) return prev;
            return prev;
          });
          const { data: profile } = (await supabase
            .from('profiles')
            .select('id, nickname, user_id, avatar_url, plan, is_admin')
            .eq('id', newReply.author_id)
            .maybeSingle()) as { data: ProfileFullRow | null; error: PostgrestError | null };
          const formattedReply = {
            type: 'reply',
            id: newReply.id,
            tweetId: newReply.tweet_id,
            parent_reply_id: newReply.parent_reply_id ?? null,
            root_reply_id: newReply.root_reply_id ?? null,
            user: {
              id: profile?.id,
              name: profile?.nickname ?? t('common.unknown', 'Unknown'),
              username: profile?.user_id ?? t('common.anonymous', 'anonymous'),
              avatar: profile?.avatar_url ?? '/images/ara_basic_profile.png',
              plan: (profile?.plan ?? 'free') as 'free' | 'basic' | 'premium',
              is_admin: profile?.is_admin ?? false,
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
  }, [id, blockedIds]); // blockedIds ?�존??추�?

  // ???��? ?�성 ??콜백: ?�로 ?�성???��?�??�크�?+ ?�이?�이??
  const handleReplyCreated = (reply: UIReply) => {
    const fixed: UIReply = {
      ...reply,
      createdAt: reply.createdAt ?? new Date().toISOString(),
      user: {
        ...reply.user,
        is_admin: isAdmin || false,
      },
    };

    // 1. Optimistic Update: 즉시 목록??추�?
    setReplies(prev => {
      // ?��? 존재?�면 추�??��? ?�음 (?�시 모�? 중복 방�?)
      if (prev.some(r => r.id === fixed.id)) return prev;

      const combined = [...prev, fixed];
      // ?�렬
      return combined.sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
      );
    });

    // 2. ?�크�?처리
    setTimeout(() => {
      setScrollTargetId(fixed.id);
      setActiveHighlightId(fixed.id); // ?�성 직후 ?�이?�이??
      requestAnimationFrame(() => {
        document
          .getElementById(`reply-${fixed.id}`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }, 100);
  };

  const handleChildReplyAdded = (newReply: UIReply) => {
    // 1) ?�?��???목록??추�? (?�리 ?�더링�? ReplyList가 parent_reply_id�??�아??붙임)
    setReplies(prev => {
      if (prev.some(r => r.id === newReply.id)) return prev;

      // 부�??��???replies ?�자 +1 (?�론?�에?�만)
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

    // 2) UI: ?�력�??�기
    setOpenReplyId(null);

    // 3) (?�택) 방금 ???�?��?�??�크�??�이?�이??
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
    let lockTimer: ReturnType<typeof setTimeout> | null = null;

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

          // ????번의 부?�러???�크�??�청
          window.scrollTo({ top: targetY, behavior: 'smooth' });
          foundAndLocked = true;

          // 주행???�료??즈음(?�는 ?�작 직후) ?�이?�이???�성??
          // v9: ?�소가 발견??즉시 ?�이?�이?��? ?�리거하???��?가 ?�착?�을 ???��? 번쩍?�고 ?�게 ??
          setActiveHighlightId(scrollTargetId);

          // ?�크�??�료 ???��? 보정 (??1???�행, 루프 ?�음)
          setTimeout(() => {
            if (cancelled) return;
            const finalRect = el.getBoundingClientRect();
            // 50px ?�상 벗어?�을 ?�만 보정 (??공격?�으�?
            if (Math.abs(finalRect.top - headerOffset) > 50) {
              window.scrollTo({
                top: window.scrollY + finalRect.top - headerOffset,
                behavior: 'smooth',
              });
            }
            // 주행 ?�료 ???��?초기??(무한 루프 방�? ?�심)
            setScrollTargetId(null);
          }, 800);
        }
        return;
      }

      // ?�직 ?�소�?�?찾았???�만 ?�시??(최�? 50�?
      if (!foundAndLocked && attempts < maxAttempts) {
        attempts++;
        setTimeout(findAndScroll, 100); // v9: ?�링 간격??100ms�??�화?�여 CPU 부??감소
      }
    };

    findAndScroll();

    return () => {
      cancelled = true;
      if (lockTimer) clearTimeout(lockTimer);
    };
  }, [scrollTargetId, replies, locationState?.scrollKey]);

  // 게시글 ?�체 중재 ??최상??강제 ?�택
  useEffect(() => {
    if (locationState?.fromAdmin && !locationState?.highlightCommentId) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [id, locationState?.scrollKey]);

  // 로딩 ?�태: 관리자 ?�이지 ?�속 ?�에??로딩 ?�피???�회 (즉시 ?�이?�웃 ?�출)
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
      {/* ?��? ?�는 ??�� replies.length 기�??�로 ?�시 */}
      <TweetDetailCard tweet={tweet} replyCount={replies.length} onReplyClick={handleReplyClick} />

      {!user && (
        <div className="border-y border-gray-200 dark:border-gray-700 px-4 py-7 bg-gray-50/80 dark:bg-muted/40 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('tweet.login_to_reply', '?��??� 로그?????�성?�실 ???�어??')}
            </span>
            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('tweet.join_community_desc', '커�??�티??참여?�려�?로그???�는 ?�원가?�을 진행?�주?�요.')}
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
          setOpenReplyId(prev => (prev === commentId ? null : commentId)); // ?��? 지?�으�??�합
          
          // ?��? ?�력창을 ?�는 경우?�만 ?�크�?고려
          if (isOpening) {
            // ?��? 카드 ?�소 찾기
            const commentEl = document.getElementById(`reply-${commentId}`);
            if (commentEl) {
              const rect = commentEl.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              // ?�디???�이 ?�상 (?�??200px)
              const editorHeight = 200;
              // ?��? ?�단 + ?�디?��? ?�면???�어?�는지 ?�인
              const wouldBeVisible = rect.bottom + editorHeight < viewportHeight - 50;
              
              // ?�면??무리 ?�이 ?�올 ???�으�??�크�?????
              if (!wouldBeVisible) {
                setScrollTargetId(commentId);
              }
            }
          }
        }}
        onAddedReply={handleChildReplyAdded}
        highlightId={activeHighlightId} // ?�크롤용 ID?� 별개�??�이?�이???�용 ID ?�용
        onCloseReply={handleCloseReply}
      />
    </div>
  );
}

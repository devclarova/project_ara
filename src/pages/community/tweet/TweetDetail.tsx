import SnsInlineEditor, { type SnsInlineEditorHandle } from '@/components/common/SnsInlineEditor';
import type { Database } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

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
  const { blockedIds } = useBlockedUsers(); // ì°¨ë‹¨ ? ì? ?•ì¸

  const [openReplyId, setOpenReplyId] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // ?Œë¦¼?ì„œ ?˜ì–´????stateë¡?ë°›ì? ê°’ë“¤
  const locationState = location.state as {
    highlightCommentId?: string;
    deletedComment?: boolean;
    scrollKey?: number;
    fromAdmin?: boolean;
  } | null;
  const highlightFromNotification = locationState?.highlightCommentId ?? null;
  const deletedCommentFromNotification = locationState?.deletedComment ?? false;
  // ?¤í¬ë¡??€ê²?id (?´ê? ?´ë™?œí‚¤ê³??¶ì? ?œê°„?ë§Œ ë³€ê²?
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

  // scrollKey ë³€??ê°ì?????ƒ ?¤í¬ë¡??¤í–‰.
  useEffect(() => {
    if (!locationState?.highlightCommentId) return;

    // ?´ë? ?´ë‹¹ ?¤ë¡œ ?¤í¬ë¡¤ì„ ?œë„?ˆë‹¤ë©?ì¤‘ë³µ ?¤í–‰ ë°©ì? (history pollution ?´ê²°)
    if (locationState.scrollKey && scrollKeyRef.current === locationState.scrollKey) {
      return;
    }

    // ?¤í¬ë¡??€ê²??¤ì • (ê°•ì œ ë¦¬ì…‹ ???¤ì •?˜ì—¬ ?˜ì´?¼ì´???¬íŠ¸ë¦¬ê±° ? ë„)
    setScrollTargetId(null);
    setActiveHighlightId(null);
    setTimeout(() => {
      setScrollTargetId(locationState.highlightCommentId || null);
    }, 50);

    // ?„ì¬ ???€??
    if (locationState.scrollKey) {
      scrollKeyRef.current = locationState.scrollKey;
    }
  }, [locationState?.highlightCommentId, locationState?.scrollKey]);

  // ?? œ???“ê? ?Œë˜ê·¸ê? ?ˆì„ ??? ìŠ¤???œì‹œ
  useEffect(() => {
    if (deletedCommentFromNotification) {
      toast.info(t('tweet.deleted_reply'));
    }
  }, [deletedCommentFromNotification]);

  // ?¸ìœ— + ?“ê? ë¶ˆëŸ¬?¤ê¸°
  useEffect(() => {
    if (!id) return;
    // Parallelize for speed
    Promise.all([
      fetchTweetById(id),
      fetchReplies(id, 0, true), // ì´ˆê¸° ?˜ì´ì§€ 0, ?„ì²´ ë¡œë“œ?
    ]);
    setReplies([]);
    setPage(0);
    setHasMore(true);
  }, [id, locationState?.scrollKey]);

  // blockedIds ë³€ê²????¸ìœ— ë³¸ë¬¸ ?‘ì„±??ì°¨ë‹¨ ?¬ë?ë§?ì²´í¬
  useEffect(() => {
    if (blockedIds.length === 0) return;
    
    // ?¸ìœ— ë³¸ë¬¸ ?‘ì„±?ê? ì°¨ë‹¨??ê²½ìš° ì²˜ë¦¬ (? íƒ)
    if (tweet && blockedIds.includes(tweet.user.username)) {
      toast.info(t('tweet.author_blocked', 'ì°¨ë‹¨???¬ìš©?ì˜ ê²Œì‹œë¬¼ì…?ˆë‹¤.'));
      navigate(-1);
    }
  }, [blockedIds, tweet]);

  // ?“ê? ?˜ê? ë³€?˜ë©´(?¤ì‹œê°?ì¶”ê?/?? œ ?? SnsStore?ë„ ë°˜ì˜
  useEffect(() => {
    if (!tweet) return;
    // replies ë³€ê²½ë  ?Œë§ˆ??ìºì‹œ???™ê¸°??
    SnsStore.updateStats(tweet.id, {
      replies: replies.length,
    });
  }, [replies.length, tweet?.id]);

  // ?“ê? ?? œ ?¤ì‹œê°?ë°˜ì˜
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

  // ?¸ìœ— ?•ë³´ ë°??‘ì„±???„ë¡œ???¤ì‹œê°??…ë°?´íŠ¸
  useEffect(() => {
    if (!id) return;

    // 1. ?¸ìœ— ?´ìš© ë°??µê³„ ?…ë°?´íŠ¸
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

    // 2. ?‘ì„±???„ë¡œ???…ë°?´íŠ¸ (?œì¬ ?íƒœ ?¤ì‹œê°?ë°˜ì˜)
    const profileChannel = supabase
      .channel(`tweet-${id}-profiles-sync`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        const updated = payload.new as { id: string; user_id: string; banned_until?: string | null };
        if (updated.banned_until === undefined) return;

        // ë³¸ë¬¸ ?‘ì„±??ì²´í¬
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

        // ?“ê? ?‘ì„±?ë“¤ ì²´í¬
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

  // ì¡°íšŒ??ì¦ê? (ë¡œê·¸??? ì??ê²Œë§? ?¸ìœ— ë¡œë“œ ????1?Œë§Œ)
  const isViewedRef = useRef(false);

  useEffect(() => {
    // 1. ê¸°ë³¸ ì¡°ê±´ ì²´í¬
    if (!id || !user || !tweet) return;

    // 2. ?´ë? ??ì»´í¬?ŒíŠ¸ ?ëª…ì£¼ê¸°?ì„œ ì¡°íšŒ??ì²˜ë¦¬ë¥??ˆëŠ”ì§€ ?•ì¸
    if (isViewedRef.current) return;

    // 3. ?ˆë¡œê³ ì¹¨ ?•ì¸ (Navigation Timing API Level 2)
    // SPA?ì„œ??'reload'ê°€ ??ì´ˆê¸° ì§„ì… ë°©ì‹???˜ë??˜ë?ë¡?
    // ?„ì¬ ì»´í¬?ŒíŠ¸ê°€ '???¤í–‰ ì§í›„(2ì´??´ë‚´)'??ë§ˆìš´?¸ëœ ê²½ìš°ë§?ì§„ì§œ ?ˆë¡œê³ ì¹¨?¼ë¡œ ê°„ì£¼
    const navEntries = performance.getEntriesByType('navigation');
    const isReload =
      navEntries.length > 0
        ? (navEntries[0] as PerformanceNavigationTiming).type === 'reload'
        : performance.navigation.type === 1; // Fallback

    if (isReload && performance.now() < 2000) {
      isViewedRef.current = true;
      return;
    }

    // 4. ê´€ë¦¬ì ?˜ì´ì§€?ì„œ ?‘ê·¼??ê²½ìš° ì¡°íšŒ??ì¦ê? ?ëµ
    if (locationState?.fromAdmin) {
      isViewedRef.current = true;
      return;
    }

    // 5. ì¡°íšŒ??ì¦ê? ?”ì²­
    handleViewCount(id);
    isViewedRef.current = true;
  }, [id, user, tweet]);

  const handleViewCount = async (tweetId: string) => {
    try {
      if (!user) return;

      // 1. ?”ë©´ ì¦‰ì‹œ ë°˜ì˜ (Optimistic Update)
      //    (ì£¼ì˜: RPC ?±ê³µ ?¬ë??€ ê´€ê³„ì—†???¬ìš©??ê²½í—˜???„í•´ ì¦ê?)
      setTweet(prev => {
        if (!prev) return null;
        // ?´ë? ë°©ê¸ˆ ì¦ê??œí‚¨ ?íƒœ?¼ë©´ ???¬ë¦¬ì§€ ?Šë„ë¡?(?¹ì‹œ ëª¨ë? ì¤‘ë³µ ë°©ì?)
        // ?˜ì?ë§??¬ê¸°???¨ìˆœ ì¦ê??œí‚´. ?ìœ„ useEffect?ì„œ ê°€?œí•˜ë¯€ë¡?ê´œì°®??
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

      // 2. RPC ?¸ì¶œ (LocalStorage ì²´í¬ ?œê±° -> ë§?ë°©ë¬¸ë§ˆë‹¤ ì¹´ìš´??
      const { data: profile } = await (supabase.from('profiles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return;

      const { error } = await (supabase as any).rpc('increment_tweet_view', {
        tweet_id_input: tweetId,
        viewer_id_input: profile.id, // viewer_id is used for history logging if needed, or just bypass uniqueness check/log logic in DB
      });

      if (error) {
        // ?ëŸ¬ ë¡œê¹… ?ëµ
      }
    } catch (err) {
      console.error('ì¡°íšŒ??ì²˜ë¦¬ ?¤íŒ¨:', err);
    }
  };

  // ?¸ìœ— ?°ì´??ë¶ˆëŸ¬?¤ê¸°
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
    } catch (error: unknown) {
      console.error('?¸ìœ— ë¶ˆëŸ¬?¤ê¸° ?¤íŒ¨:', getErrorMessage(error));
      toast.info(t('tweet.deleted_or_not_exist'));
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  // ?“ê? ëª©ë¡ ë¶ˆëŸ¬?¤ê¸° (?˜ì´ì§€?¤ì´??
  const fetchReplies = async (tweetId: string, pageParam = 0, loadAll = false) => {
    // ?Œë¦¼?¼ë¡œ ?¤ì–´?€???¹ì • ?“ê????˜ì´?¼ì´?¸í•´???˜ëŠ” ê²½ìš°, ?„ì²´ ë¡œë“œ (ë¬´í•œ?¤í¬ë¡??¼ì‹œ ì¤‘ì?)
    // ?? pageParam > 0 ?´ë©´ ë¬´í•œ?¤í¬ë¡?ë¡œë“œ ì¤‘ì´ë¯€ë¡?range ?ìš©
    const shouldLoadAllFromNotification = !!highlightFromNotification && pageParam === 0;
    const shouldLoadAll = loadAll || shouldLoadAllFromNotification;

    try {
      // setIsLoading(true); // ë¬´í•œ ?¤í¬ë¡????„ì²´ ë¡œë”© ê±¸ë¦¬??ë¬¸ì œ ?˜ì •
      const mapped = await tweetService.getRepliesByTweetId(tweetId, pageParam, shouldLoadAll, profileId, isAdmin);

      if (shouldLoadAll) {
        // ?„ì²´ ë¡œë“œ ?œì—??ê¸°ì¡´ ê²???–´?°ê³  ?”ë³´ê¸??†ìŒ ì²˜ë¦¬
        setReplies(mapped);
        setHasMore(false);
      } else {
        // ?˜ì´ì§€?¤ì´??
        if (mapped.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setReplies(prev => {
          // ì¤‘ë³µ ?œê±° ë°?created_at ???•ë ¬
          const merged = pageParam === 0 ? mapped : [...prev, ...mapped];
          const unique = merged.filter((r, i, self) => i === self.findIndex(t => t.id === r.id));
          return unique.sort(
            (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
          );
        });

        setPage(pageParam + 1);
      }
    } catch (error: unknown) {
      console.error('?“ê? ë¶ˆëŸ¬?¤ê¸° ?¤íŒ¨:', getErrorMessage(error));
    }
  };

  // ?¤ì‹œê°??“ê? ì¶”ê? ì±„ë„ (ì¶”ê?ë§?ë°˜ì˜, ?¤í¬ë¡¤ì? ê±´ë“œë¦¬ì? ?ŠìŒ)
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
          // ?´ë? ë¦¬ìŠ¤?¸ì— ?ˆëŠ” ?“ê??´ë©´ ë¬´ì‹œ
          setReplies(prev => {
            if (prev.some(r => r.id === newReply.id)) return prev;
            return prev;
          });
          const { data: profile } = await (supabase.from('profiles') as any)
            .select('nickname, user_id, avatar_url, plan')
            .eq('id', newReply.author_id)
            .maybeSingle();
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
              plan: profile?.plan,
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
  }, [id, blockedIds]); // blockedIds ?˜ì¡´??ì¶”ê?

  // ???“ê? ?‘ì„± ??ì½œë°±: ?ˆë¡œ ?‘ì„±???“ê?ë¡??¤í¬ë¡?+ ?˜ì´?¼ì´??
  const handleReplyCreated = (reply: UIReply) => {
    const fixed: UIReply = {
      ...reply,
      createdAt: reply.createdAt ?? new Date().toISOString(),
    };

    // 1. Optimistic Update: ì¦‰ì‹œ ëª©ë¡??ì¶”ê?
    setReplies(prev => {
      // ?´ë? ì¡´ì¬?˜ë©´ ì¶”ê??˜ì? ?ŠìŒ (?¹ì‹œ ëª¨ë? ì¤‘ë³µ ë°©ì?)
      if (prev.some(r => r.id === reply.id)) return prev;

      const combined = [...prev, reply];
      // ?•ë ¬
      return combined.sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
      );
    });

    // 2. ?¤í¬ë¡?ì²˜ë¦¬
    setTimeout(() => {
      setScrollTargetId(fixed.id);
      setActiveHighlightId(fixed.id); // ?‘ì„± ì§í›„ ?˜ì´?¼ì´??
      requestAnimationFrame(() => {
        document
          .getElementById(`reply-${fixed.id}`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }, 100);
  };

  const handleChildReplyAdded = (newReply: UIReply) => {
    // 1) ?€?“ê???ëª©ë¡??ì¶”ê? (?¸ë¦¬ ?Œë”ë§ì? ReplyListê°€ parent_reply_idë¡??Œì•„??ë¶™ì„)
    setReplies(prev => {
      if (prev.some(r => r.id === newReply.id)) return prev;

      // ë¶€ëª??“ê???replies ?«ì +1 (?„ë¡ ?¸ì—?œë§Œ)
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

    // 2) UI: ?…ë ¥ì°??«ê¸°
    setOpenReplyId(null);

    // 3) (? íƒ) ë°©ê¸ˆ ???€?“ê?ë¡??¤í¬ë¡??˜ì´?¼ì´??
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

          // ????ë²ˆì˜ ë¶€?œëŸ¬???¤í¬ë¡??”ì²­
          window.scrollTo({ top: targetY, behavior: 'smooth' });
          foundAndLocked = true;

          // ì£¼í–‰???„ë£Œ??ì¦ˆìŒ(?ëŠ” ?œì‘ ì§í›„) ?˜ì´?¼ì´???œì„±??
          // v9: ?”ì†Œê°€ ë°œê²¬??ì¦‰ì‹œ ?˜ì´?¼ì´?¸ë? ?¸ë¦¬ê±°í•˜??? ì?ê°€ ?„ì°©?ˆì„ ???´ë? ë²ˆì©?´ê³  ?ˆê²Œ ??
          setActiveHighlightId(scrollTargetId);

          // ?¤í¬ë¡??„ë£Œ ???•ë? ë³´ì • (??1???˜í–‰, ë£¨í”„ ?†ìŒ)
          setTimeout(() => {
            if (cancelled) return;
            const finalRect = el.getBoundingClientRect();
            // 50px ?´ìƒ ë²—ì–´?¬ì„ ?Œë§Œ ë³´ì • (??ê³µê²©?ìœ¼ë¡?
            if (Math.abs(finalRect.top - headerOffset) > 50) {
              window.scrollTo({
                top: window.scrollY + finalRect.top - headerOffset,
                behavior: 'smooth',
              });
            }
            // ì£¼í–‰ ?„ë£Œ ???€ê²?ì´ˆê¸°??(ë¬´í•œ ë£¨í”„ ë°©ì? ?µì‹¬)
            setScrollTargetId(null);
          }, 800);
        }
        return;
      }

      // ?„ì§ ?”ì†Œë¥?ëª?ì°¾ì•˜???Œë§Œ ?¬ì‹œ??(ìµœë? 50ì´?
      if (!foundAndLocked && attempts < maxAttempts) {
        attempts++;
        setTimeout(findAndScroll, 100); // v9: ?´ë§ ê°„ê²©??100msë¡??„í™”?˜ì—¬ CPU ë¶€??ê°ì†Œ
      }
    };

    findAndScroll();

    return () => {
      cancelled = true;
      if (lockTimer) clearTimeout(lockTimer);
    };
  }, [scrollTargetId, replies, locationState?.scrollKey]);

  // ê²Œì‹œê¸€ ?ì²´ ì¤‘ì¬ ??ìµœìƒ??ê°•ì œ ?¤íƒ
  useEffect(() => {
    if (locationState?.fromAdmin && !locationState?.highlightCommentId) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [id, locationState?.scrollKey]);

  // ë¡œë”© ?íƒœ: ê´€ë¦¬ì ?˜ì´ì§€ ?‘ì† ?œì—??ë¡œë”© ?¤í”¼???°íšŒ (ì¦‰ì‹œ ?ˆì´?„ì›ƒ ?¸ì¶œ)
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
      {/* ?“ê? ?˜ëŠ” ??ƒ replies.length ê¸°ì??¼ë¡œ ?œì‹œ */}
      <TweetDetailCard tweet={tweet} replyCount={replies.length} onReplyClick={handleReplyClick} />

      {!user && (
        <div className="border-y border-gray-200 dark:border-gray-700 px-4 py-7 bg-gray-50/80 dark:bg-muted/40 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('tweet.login_to_reply', '?“ê??€ ë¡œê·¸?????‘ì„±?˜ì‹¤ ???ˆì–´??')}
            </span>
            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('tweet.join_community_desc', 'ì»¤ë??ˆí‹°??ì°¸ì—¬?˜ë ¤ë©?ë¡œê·¸???ëŠ” ?Œì›ê°€?…ì„ ì§„í–‰?´ì£¼?¸ìš”.')}
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
          setOpenReplyId(prev => (prev === commentId ? null : commentId)); // ? ê? ì§€?ìœ¼ë¡??µí•©
          
          // ?“ê? ?…ë ¥ì°½ì„ ?¬ëŠ” ê²½ìš°?ë§Œ ?¤í¬ë¡?ê³ ë ¤
          if (isOpening) {
            // ?“ê? ì¹´ë“œ ?”ì†Œ ì°¾ê¸°
            const commentEl = document.getElementById(`reply-${commentId}`);
            if (commentEl) {
              const rect = commentEl.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              // ?ë””???’ì´ ?ˆìƒ (?€??200px)
              const editorHeight = 200;
              // ?“ê? ?˜ë‹¨ + ?ë””?°ê? ?”ë©´???¤ì–´?¤ëŠ”ì§€ ?•ì¸
              const wouldBeVisible = rect.bottom + editorHeight < viewportHeight - 50;
              
              // ?”ë©´??ë¬´ë¦¬ ?†ì´ ?˜ì˜¬ ???ˆìœ¼ë©??¤í¬ë¡?????
              if (!wouldBeVisible) {
                setScrollTargetId(commentId);
              }
            }
          }
        }}
        onAddedReply={handleChildReplyAdded}
        highlightId={activeHighlightId} // ?¤í¬ë¡¤ìš© ID?€ ë³„ê°œë¡??˜ì´?¼ì´???„ìš© ID ?¬ìš©
        onCloseReply={handleCloseReply}
      />
    </div>
  );
}

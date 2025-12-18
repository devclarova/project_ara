import SnsInlineEditor from '@/components/common/SnsInlineEditor';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReplyList, { type Reply } from './components/ReplyList';
import TweetDetailCard from './components/TweetDetailCard';
import { toast } from 'sonner';

export default function TweetDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tweet, setTweet] = useState<any | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // scrollKey 변화 감지해 항상 스크롤 실행
  useEffect(() => {
    if (locationState?.highlightCommentId) {
      setScrollTargetId(locationState.highlightCommentId);
    }
  }, [locationState?.scrollKey]);

  // 알림에서 진입할 때 스크롤 타깃 설정
  // useEffect(() => {
  //   if (!id || !highlightFromNotification) return;

  //   const storageKey = `sns-highlight-consumed-${id}-${highlightFromNotification}`;

  //   try {
  //     const consumed = sessionStorage.getItem(storageKey);
  //     if (consumed === '1') {
  //       // 이미 이 알림으로 스크롤 한 번 했으면 더 이상 스크롤하지 않음
  //       return;
  //     }

  //     setScrollTargetId(highlightFromNotification);
  //     sessionStorage.setItem(storageKey, '1');
  //   } catch {
  //     // sessionStorage 사용이 불가한 환경에서는 그냥 한 번만 설정
  //     setScrollTargetId(highlightFromNotification);
  //   }
  // }, [id, highlightFromNotification]);
  useEffect(() => {
    if (!highlightFromNotification) return;
    setScrollTargetId(highlightFromNotification);
  }, [highlightFromNotification]);

  // 삭제된 댓글 플래그가 있을 때 토스트 표시
  useEffect(() => {
    if (deletedCommentFromNotification) {
      toast.info('삭제된 댓글입니다.');
    }
  }, [deletedCommentFromNotification]);

  // 트윗 + 댓글 불러오기
  useEffect(() => {
    if (!id) return;
    fetchTweetById(id);
    fetchReplies(id);
  }, [id]);

  // 실시간 댓글 추가 채널 (추가만 반영, 스크롤은 건드리지 않음)
  useEffect(() => {
    if (!id) return;

    if ((window as any)._replyInsertChannel) {
      supabase.removeChannel((window as any)._replyInsertChannel);
    }

    const channel = supabase
      .channel(`tweet-${id}-replies-insert`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tweet_replies',
          filter: `tweet_id=eq.${id}`,
        },
        async payload => {
          const newReply = payload.new as any;

          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, user_id, avatar_url')
            .eq('id', newReply.author_id)
            .maybeSingle();

          const formattedReply = {
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
            timestamp: new Date(newReply.created_at).toLocaleString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              month: 'short',
              day: 'numeric',
            }),
            stats: {
              comments: newReply.comment_count ?? 0,
              retweets: 0,
              likes: newReply.like_count ?? 0,
              views: 0,
            },
            liked: false,
          };

          // 새 댓글은 맨 아래에 추가
          setReplies(prev => {
            // 루트 댓글이면 그냥 맨 아래
            if (!formattedReply.parent_reply_id) {
              return [...prev, formattedReply];
            }

            const parentId = formattedReply.parent_reply_id;

            // 부모 위치
            const parentIndex = prev.findIndex(r => r.id === parentId);
            if (parentIndex === -1) {
              return [...prev, formattedReply];
            }

            // 같은 부모를 가진 기존 대댓글들의 마지막 위치 찾기
            let insertIndex = parentIndex + 1;

            for (let i = parentIndex + 1; i < prev.length; i++) {
              if (prev[i].parent_reply_id === parentId) {
                insertIndex = i + 1;
                continue;
              }
              // 다른 루트 댓글 나오면 중단
              if (!prev[i].parent_reply_id) break;
            }

            return [...prev.slice(0, insertIndex), formattedReply, ...prev.slice(insertIndex)];
          });
        },
      )
      .subscribe();

    (window as any)._replyInsertChannel = channel;

    return () => {
      supabase.removeChannel(channel);
      (window as any)._replyInsertChannel = null;
    };
  }, [id]);

  // 댓글 삭제 실시간 반영
  // useEffect(() => {
  //   if (!id) return;

  //   if ((window as any)._replyDeleteChannel) {
  //     supabase.removeChannel((window as any)._replyDeleteChannel);
  //   }

  //   const deleteChannel = supabase
  //     .channel(`tweet-${id}-replies-delete`)
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: 'DELETE',
  //         schema: 'public',
  //         table: 'tweet_replies',
  //         filter: `tweet_id=eq.${id}`,
  //       },
  //       payload => {
  //         const deletedId = payload.old.id;
  //         setReplies(prev => prev.filter(r => r.id !== deletedId));
  //       },
  //     )
  //     .subscribe();

  //   (window as any)._replyDeleteChannel = deleteChannel;

  //   return () => {
  //     supabase.removeChannel(deleteChannel);
  //     (window as any)._replyDeleteChannel = null;
  //   };
  // }, [id]);

  // 조회수 증가 (로그인 유저에게만)
  useEffect(() => {
    if (!id || !user) return;
    handleViewCount(id);
  }, [id, user]);

  const handleViewCount = async (tweetId: string) => {
    try {
      if (!user) return;

      const viewedTweets = JSON.parse(localStorage.getItem('viewedTweets') || '{}');
      const now = Date.now();

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('프로필 조회 실패:', profileError?.message);
        return;
      }

      const { error } = await supabase.rpc('increment_tweet_view', {
        tweet_id_input: tweetId,
        viewer_id_input: profile.id,
      });

      if (error) console.error('조회수 RPC 실패:', error.message);

      viewedTweets[tweetId] = now;
      localStorage.setItem('viewedTweets', JSON.stringify(viewedTweets));
    } catch (err) {
      console.error('조회수 처리 실패:', err);
    }
  };

  // 트윗 데이터 불러오기
  const fetchTweetById = async (tweetId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tweets')
      .select(
        `
        id, content, image_url, created_at,
        reply_count, repost_count, like_count, bookmark_count, view_count,
        profiles (nickname, user_id, avatar_url)
      `,
      )
      .eq('id', tweetId)
      .single();

    if (error || !data) {
      console.error('트윗 불러오기 실패:', error?.message);
      toast.info('삭제된 게시글이거나 존재하지 않는 게시글입니다.');
      navigate(-1);
      return;
    }

    setTweet({
      id: data.id,
      user: {
        name: data.profiles?.nickname ?? 'Unknown',
        username: data.profiles?.user_id ?? 'anonymous',
        avatar: data.profiles?.avatar_url ?? '/default-avatar.svg',
      },
      content: data.content,
      image: data.image_url,
      timestamp: new Date(data.created_at).toLocaleString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      }),
      stats: {
        replies: data.reply_count ?? 0,
        retweets: data.repost_count ?? 0,
        likes: data.like_count ?? 0,
        bookmarks: data.bookmark_count ?? 0,
        views: data.view_count ?? 0,
      },
    });

    setIsLoading(false);
  };

  // 댓글 목록 불러오기 (오래된 → 최신)
  const fetchReplies = async (tweetId: string) => {
    const { data, error } = await supabase
      .from('tweet_replies')
      .select(
        `id,
        content,
        is_deleted,
        deleted_at,
        stats,
        created_at,
        parent_reply_id,
        root_reply_id,
        comment_count,
        profiles:author_id (nickname, user_id, avatar_url),
        tweet_replies_likes (count)`,
      )
      .eq('tweet_id', tweetId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('댓글 불러오기 실패:', error.message);
      return;
    }

    const mapped = (data ?? []).map(r => ({
      id: r.id,
      tweetId,
      parent_reply_id: r.parent_reply_id ?? null,
      root_reply_id: r.root_reply_id ?? null,
      is_deleted: r.is_deleted === true,
      content: r.content,
      user: {
        name: r.profiles?.nickname ?? 'Unknown',
        username: r.profiles?.user_id ?? 'anonymous',
        avatar: r.profiles?.avatar_url ?? '/default-avatar.svg',
      },
      timestamp: new Date(r.created_at).toLocaleString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      }),
      stats: {
        comments: r.comment_count ?? 0,
        retweets: 0,
        likes: Array.isArray(r.tweet_replies_likes) ? (r.tweet_replies_likes[0]?.count ?? 0) : 0,
        views: 0,
      },
    }));

    setReplies(mapped);
  };

  // 새 댓글 작성 후 콜백: 여기에서만 스크롤 타깃 설정
  const handleReplyCreated = (replyId: string) => {
    setScrollTargetId(replyId);
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

      const el = document.getElementById(`reply-${scrollTargetId}`);
      if (el) {
        const headerOffset = 120;
        const rect = el.getBoundingClientRect();
        const absoluteY = window.scrollY + rect.top;

        window.scrollTo({
          top: absoluteY - headerOffset,
          behavior: 'smooth',
        });
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
    navigate('/sns');
    return null;
  }

  return (
    <div className="border-x border-gray-200 dark:border-gray-700 dark:bg-background">
      {/* 댓글 수는 항상 replies.length 기준으로 표시 */}
      <TweetDetailCard tweet={tweet} replyCount={replies.length} />

      {!user && (
        <div className="border-y border-gray-200 dark:border-gray-700 px-4 py-7 bg-gray-50/80 dark:bg-muted/40 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              댓글은 로그인 후 작성하실 수 있어요.
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              커뮤니티에 참여하려면 로그인 또는 회원가입을 진행해주세요.
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-primary text-white hover:opacity-90"
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-primary text-primary hover:bg-primary/5"
            >
              회원가입
            </button>
          </div>
        </div>
      )}

      {user && (
        <SnsInlineEditor mode="reply" tweetId={tweet.id} onReplyCreated={handleReplyCreated} />
      )}

      <ReplyList
        replies={replies}
        onDeleted={id => {
          setReplies(prev => prev.map(r => (r.id === id ? { ...r, is_deleted: true } : r)));
        }}
      />
    </div>
  );
}

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import TweetDetailCard from './components/TweetDetailCard';
import ReplyList from './components/ReplyList';
import InlineReplyEditor from './components/InlineReplyEditor';

export default function TweetDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tweet, setTweet] = useState<any | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 알림에서 넘어올 때 state로 받은 highlightCommentId
  const locationState = location.state as { highlightCommentId?: string } | null;
  const highlightFromNotification = locationState?.highlightCommentId ?? null;

  // 🔥 스크롤 / 하이라이트 타겟 id
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);

  // ✅ 처음 진입 시: 알림에서 넘어온 값이 있으면 그걸 타겟으로 사용
  useEffect(() => {
    if (highlightFromNotification) {
      setScrollTargetId(highlightFromNotification);
    }
  }, [highlightFromNotification]);

  // ✅ 트윗 + 댓글 불러오기
  useEffect(() => {
    if (!id) return;
    fetchTweetById(id);
    fetchReplies(id);
  }, [id]);

  // ✅ 실시간 댓글 추가 채널
  useEffect(() => {
    if (!id) return;

    if ((window as any)._replyInsertChannel) {
      supabase.removeChannel((window as any)._replyInsertChannel);
    }

    const channel = supabase
      .channel(`tweet-${id}-replies`)
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
              comments: 0,
              retweets: 0,
              likes: newReply.like_count ?? 0,
              views: 0,
            },
          };

          // 🔹 댓글은 오래된 → 최신 순이므로, 새 댓글은 맨 아래에 추가
          setReplies(prev => [...prev, formattedReply]);
        },
      )
      .subscribe();

    (window as any)._replyInsertChannel = channel;

    return () => {
      supabase.removeChannel(channel);
      (window as any)._replyInsertChannel = null;
    };
  }, [id]);

  // ✅ 댓글 삭제 실시간 반영
  useEffect(() => {
    if (!id) return;

    if ((window as any)._replyDeleteChannel) {
      supabase.removeChannel((window as any)._replyDeleteChannel);
    }

    const deleteChannel = supabase
      .channel(`tweet-${id}-replies-delete`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tweet_replies',
        },
        payload => {
          const deletedId = payload.old.id;
          setReplies(prev => prev.filter(r => r.id !== deletedId));
        },
      )
      .subscribe();

    (window as any)._replyDeleteChannel = deleteChannel;

    return () => {
      supabase.removeChannel(deleteChannel);
      (window as any)._replyDeleteChannel = null;
    };
  }, [id]);

  // ✅ 조회수 증가 (로그인 유저에게만)
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

  // ✅ 트윗 데이터 불러오기
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
      navigate('/sns');
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

  // ✅ 댓글 목록 불러오기 (오래된 → 최신)
  const fetchReplies = async (tweetId: string) => {
    const { data, error } = await supabase
      .from('tweet_replies')
      .select(
        `id, content, created_at, profiles:author_id (nickname, user_id, avatar_url), tweet_replies_likes (count)`,
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
      user: {
        name: r.profiles?.nickname ?? 'Unknown',
        username: r.profiles?.user_id ?? 'anonymous',
        avatar: r.profiles?.avatar_url ?? '/default-avatar.svg',
      },
      content: r.content,
      timestamp: new Date(r.created_at).toLocaleString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      }),
      stats: {
        comments: 0,
        retweets: 0,
        // 🔥 embed된 tweet_replies_likes에서 count 뽑기
        likes: Array.isArray(r.tweet_replies_likes) ? (r.tweet_replies_likes[0]?.count ?? 0) : 0,
        views: 0,
      },
    }));

    setReplies(mapped);
  };

  // ✅ 새 댓글 작성 후 콜백 (기존 그대로 유지)
  const handleReplyCreated = (replyId: string) => {
    setScrollTargetId(replyId);
  };

  if (isLoading) {
    return (
      <div className="border-x border-gray-200 dark:border-gray-700 dark:bg-background">
        <div className="sticky top-0 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4 z-20">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-primary/10 rounded-full transition-colors"
            >
              <i className="ri-arrow-left-line text-xl text-gray-900 dark:text-gray-100" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">상세보기</h1>
          </div>
        </div>

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
      <div className="sticky top-0 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4 z-20">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-primary/10 rounded-full transition-colors"
          >
            <i className="ri-arrow-left-line text-xl text-gray-900 dark:text-gray-100" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">상세보기</h1>
        </div>
      </div>

      <TweetDetailCard tweet={tweet} />

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

      {user && <InlineReplyEditor tweetId={tweet.id} onReplyCreated={handleReplyCreated} />}

      <ReplyList
        replies={replies}
        scrollTargetId={scrollTargetId}
        onDeleted={id => {
          setReplies(prev => prev.filter(r => r.id !== id));
        }}
      />
    </div>
  );
}

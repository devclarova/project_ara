import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TweetCard from '../../feature/TweetCard';
import { ReplyCard } from '../../tweet/components/ReplyCard';

interface ProfileTweetsProps {
  activeTab: string;
  userProfile: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}

export default function ProfileTweets({ activeTab, userProfile }: ProfileTweetsProps) {
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /** 트윗 불러오기 */
  const fetchTweets = async () => {
    if (!userProfile?.id) return;
    setLoading(true);

    let tweetIds: string[] = [];

    // 기본 tweets 쿼리
    let baseQuery = supabase
      .from('tweets')
      .select(
        `id, content, image_url, created_at,
      reply_count, like_count, view_count,
      profiles:author_id (nickname, user_id, avatar_url)`,
      )
      .order('created_at', { ascending: false });

    /** 1) 내가 쓴 게시글 */
    if (activeTab === 'posts') {
      baseQuery = baseQuery.eq('author_id', userProfile.id);
    } else if (activeTab === 'replies') {
      /** 2) 내가 쓴 댓글 목록 */
      const { data: replies, error: repliesError } = await supabase
        .from('tweet_replies')
        .select(
          `id,
          content,
          created_at,
          tweet_id,
          profiles:author_id (nickname, user_id, avatar_url),
          tweet_replies_likes(count),
          tweets (
            content,
            author_id,
            reply_count,
            like_count,
            view_count
            )`,
        )
        .eq('author_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (repliesError) console.error(repliesError.message);

      const mappedReplies = (replies ?? []).map(r => ({
        id: r.id, // 댓글 자체의 id
        type: 'reply',
        tweetId: r.tweet_id, // 원본 트윗 ID 추가
        user: {
          name: r.profiles?.nickname ?? 'Unknown',
          username: r.profiles?.user_id ?? 'anonymous',
          avatar: r.profiles?.avatar_url ?? '/default-avatar.svg',
        },
        content: r.content,
        parentTweet: r.tweets?.content,
        timestamp: new Date(r.created_at).toLocaleString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        stats: {
          replies: 0,
          likes: Array.isArray(r.tweet_replies_likes) ? (r.tweet_replies_likes[0]?.count ?? 0) : 0,
          views: 0,
        },
      }));

      setTweets(mappedReplies);
      setLoading(false);
      return;
    } else if (activeTab === 'likes') {
      /** 3-1) 좋아요한 게시글 조회 */
      const { data: likedPosts } = await supabase
        .from('tweet_likes')
        .select(
          `
      tweet_id,
      created_at,
      tweets (
        id, content, image_url, created_at,
        reply_count, like_count, view_count,
        profiles(nickname, user_id, avatar_url)
      )
    `,
        )
        .eq('user_id', userProfile.id);

      const mappedLikedPosts = (likedPosts ?? []).map(p => ({
        type: 'post',
        id: p.tweets.id,
        liked_at: p.created_at,
        user: {
          name: p.tweets.profiles.nickname,
          username: p.tweets.profiles.user_id,
          avatar: p.tweets.profiles.avatar_url,
        },
        content: p.tweets.content,
        image: p.tweets.image_url,
        timestamp: new Date(p.tweets.created_at).toLocaleString('ko-KR'),
        stats: {
          replies: p.tweets.reply_count,
          likes: p.tweets.like_count,
          views: p.tweets.view_count,
        },
      }));

      /** 3-2) 좋아요한 댓글 조회 */
      const { data: likedReplies } = await supabase
        .from('tweet_replies_likes')
        .select(
          `reply_id,
          created_at,
          tweet_replies (
          id, content, created_at, tweet_id,
          profiles(nickname, user_id, avatar_url),
          tweet_replies_likes(count)
          )`,
        )
        .eq('user_id', userProfile.id);
      const mappedLikedReplies = (likedReplies ?? []).map(r => ({
        type: 'reply',
        id: r.tweet_replies.id,
        tweetId: r.tweet_replies.tweet_id,
        liked_at: r.created_at,
        user: {
          name: r.tweet_replies.profiles.nickname,
          username: r.tweet_replies.profiles.user_id,
          avatar: r.tweet_replies.profiles.avatar_url,
        },
        content: r.tweet_replies.content,
        timestamp: new Date(r.tweet_replies.created_at).toLocaleString('ko-KR'),
        /** 댓글 좋아요 개수 + 내가 좋아요한 정보 추가 */
        stats: {
          replies: 0,
          likes: r.tweet_replies.tweet_replies_likes?.[0]?.count ?? 0,
          views: 0,
        },
        liked: true,
      }));

      /** 3-3) 통합 + 최신 정렬 */
      const merged = [...mappedLikedPosts, ...mappedLikedReplies].sort(
        (a, b) => new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime(),
      );

      setTweets(merged);
      setLoading(false);
      return;
    }

    /** 공통 tweets 조회 */
    const { data, error } = await baseQuery;
    if (error) console.error(error.message);

    const mapped = (data ?? []).map(t => ({
      id: t.id,
      user: {
        name: t.profiles?.nickname ?? 'Unknown',
        username: t.profiles?.user_id ?? 'anonymous',
        avatar: t.profiles?.avatar_url ?? '/default-avatar.svg',
      },
      content: t.content,
      image: t.image_url || undefined,
      timestamp: new Date(t.created_at).toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      stats: {
        replies: t.reply_count ?? 0,
        likes: t.like_count ?? 0,
        views: t.view_count ?? 0,
      },
    }));

    setTweets(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchTweets();
  }, [activeTab, userProfile?.id]);

  /** 실시간 반영용 구독 채널 */
  useEffect(() => {
    if (!userProfile?.id) return;

    // 1. 댓글, 좋아요, 조회수 변동 시
    const updateChannel = supabase
      .channel(`profile-tweets-stats-${userProfile.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tweets' }, payload => {
        const updated = payload.new as any;
        setTweets(prev =>
          prev.map(t =>
            t.id === updated.id
              ? {
                  ...t,
                  stats: {
                    replies: updated.reply_count ?? t.stats.replies,
                    likes: updated.like_count ?? t.stats.likes,
                    views: updated.view_count ?? t.stats.views,
                  },
                }
              : t,
          ),
        );
      })
      .subscribe();

    // 2. 새 게시글 추가 시 (내가 쓴 게시글 탭일 때만)
    const insertChannel = supabase
      .channel(`profile-tweets-insert-${userProfile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tweets' },
        async payload => {
          if (activeTab !== 'posts') return;
          if (payload.new.author_id !== userProfile.id) return;

          const newTweet = payload.new as any;
          const { data: prof } = await supabase
            .from('profiles')
            .select('nickname, user_id, avatar_url')
            .eq('id', newTweet.author_id)
            .maybeSingle();

          const uiTweet = {
            id: newTweet.id,
            user: {
              name: prof?.nickname ?? 'Unknown',
              username: prof?.user_id ?? 'anonymous',
              avatar: prof?.avatar_url ?? '/default-avatar.svg',
            },
            content: newTweet.content,
            image: newTweet.image_url || undefined,
            timestamp: new Date(newTweet.created_at).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            stats: {
              replies: newTweet.reply_count ?? 0,
              likes: newTweet.like_count ?? 0,
              views: newTweet.view_count ?? 0,
            },
          };

          setTweets(prev => [uiTweet, ...prev]);
        },
      )
      .subscribe();

    // 3. 게시글 삭제 시
    const deleteChannel = supabase
      .channel(`profile-tweets-delete-${userProfile.id}`)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tweets' }, payload => {
        const deletedId = payload.old.id;
        setTweets(prev => prev.filter(t => t.id !== deletedId));
      })
      .subscribe();

    // 프로필 편집
    const profileChannel = supabase
      .channel(`profile-update-${userProfile.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userProfile.id}` },
        payload => {
          const updated = payload.new as any;
          setTweets(prev =>
            prev.map(t =>
              t.user.username === updated.user_id
                ? { ...t, user: { ...t.user, avatar: updated.avatar_url, name: updated.nickname } }
                : t,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(updateChannel);
      supabase.removeChannel(insertChannel);
      supabase.removeChannel(deleteChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [userProfile?.id, activeTab]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  if (!tweets.length)
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
            reply={{
              id: item.id,
              tweetId: item.tweetId,
              user: item.user,
              content: item.content,
              timestamp: item.timestamp,
              stats: item.stats,
              liked: item.liked,
            }}
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
    </div>
  );
}

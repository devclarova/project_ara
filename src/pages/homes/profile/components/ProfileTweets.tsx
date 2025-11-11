import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TweetCard from '../../feature/TweetCard';

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

  /** 🟢 트윗 불러오기 */
  const fetchTweets = async () => {
    if (!userProfile?.id) return;
    setLoading(true);

    let tweetIds: string[] = [];
    let baseQuery = supabase
      .from('tweets')
      .select(
        `
        id, content, image_url, created_at,
        reply_count, like_count, view_count,
        profiles:author_id (nickname, user_id, avatar_url)
      `,
      )
      .order('created_at', { ascending: false });

    if (activeTab === 'posts') {
      baseQuery = baseQuery.eq('author_id', userProfile.id);
    } else if (activeTab === 'replies') {
      const { data: replies } = await supabase
        .from('tweet_replies')
        .select('tweet_id')
        .eq('author_id', userProfile.id);
      tweetIds = replies?.map(r => r.tweet_id) ?? [];
      if (!tweetIds.length) return (setTweets([]), setLoading(false));
      baseQuery = baseQuery.in('id', tweetIds);
    } else if (activeTab === 'likes') {
      const { data: likes } = await supabase
        .from('tweet_likes')
        .select('tweet_id')
        .eq('user_id', userProfile.id);
      tweetIds = likes?.map(l => l.tweet_id) ?? [];
      if (!tweetIds.length) return (setTweets([]), setLoading(false));
      baseQuery = baseQuery.in('id', tweetIds);
    }

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

  /** 🟢 실시간 반영용 구독 채널 */
  useEffect(() => {
    if (!userProfile?.id) return;

    // 1️⃣ 댓글, 좋아요, 조회수 변동 시
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

    // 2️⃣ 새 게시글 추가 시 (내가 쓴 게시글 탭일 때만)
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

    // 3️⃣ 게시글 삭제 시
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
      {tweets.map(tweet => (
        <TweetCard key={tweet.id} {...tweet} />
      ))}
    </div>
  );
}

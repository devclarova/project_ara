import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext'; // ✅ 추가
import TweetDetailCard from './components/TweetDetailCard';
import ReplyList from './components/ReplyList';

export default function TweetDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth(); // ✅ 로그인 유저
  const navigate = useNavigate();
  const [tweet, setTweet] = useState<any | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchTweetById(id);
    fetchReplies(id);
  }, [id]);

  // ✅ 중복 조회 방지 + view_count 증가
  useEffect(() => {
    if (!id || !user) return;
    handleViewCount(id);
  }, [id, user]);

  const handleViewCount = async (tweetId: string) => {
    try {
      const viewedTweets = JSON.parse(localStorage.getItem('viewedTweets') || '{}');
      const lastViewed = viewedTweets[tweetId];
      const now = Date.now();

      // 24시간 내 중복 조회 방지
      if (lastViewed && now - lastViewed < 24 * 60 * 60 * 1000) return;

      const { error } = await supabase
        .from('tweets')
        .update({ view_count: (tweet?.stats?.views ?? 0) + 1 })
        .eq('id', tweetId);

      if (error) console.error('조회수 업데이트 실패:', error.message);
      viewedTweets[tweetId] = now;
      localStorage.setItem('viewedTweets', JSON.stringify(viewedTweets));
    } catch (err) {
      console.error('조회수 처리 실패:', err);
    }
  };

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

    if (error) {
      console.error('트윗 불러오기 실패:', error.message);
      navigate('/finalhome');
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

  const fetchReplies = async (tweetId: string) => {
    const { data, error } = await supabase
      .from('tweet_replies')
      .select(
        `
        id, content, created_at,
        profiles:author_id (nickname, user_id, avatar_url)
      `,
      )
      .eq('tweet_id', tweetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('댓글 불러오기 실패:', error.message);
      return;
    }

    const mapped = (data ?? []).map(r => ({
      id: r.id,
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
      stats: { replies: 0, retweets: 0, likes: 0, views: 0 },
    }));

    setReplies(mapped);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!tweet) {
    navigate('/finalhome');
    return null;
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div className="w-full max-w-2xl mx-auto border-x border-gray-200">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-20">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <h1 className="text-xl font-bold text-gray-900">상세보기</h1>
          </div>
        </div>

        <TweetDetailCard tweet={tweet} />
        <ReplyList replies={replies} />
      </div>
    </div>
  );
}

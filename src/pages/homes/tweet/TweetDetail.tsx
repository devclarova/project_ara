import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import TweetDetailCard from './components/TweetDetailCard';
import ReplyComposer from './components/ReplyComposer';
import ReplyList from './components/ReplyList';

interface Tweet {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  image?: string;
  timestamp: string;
  stats: {
    replies: number;
    retweets: number;
    likes: number;
    bookmarks?: number;
    views: number;
  };
}

export default function TweetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchTweetById(id);
  }, [id]);

  // ✅ Supabase에서 해당 트윗 1개 가져오기
  const fetchTweetById = async (tweetId: string) => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('tweets')
      .select(
        `
        id,
        content,
        image_url,
        created_at,
        reply_count,
        repost_count,
        like_count,
        bookmark_count,
        view_count,
        profiles (
          nickname,
          user_id,
          avatar_url
        )
      `
      )
      .eq('id', tweetId)
      .single(); // 단일 행만 반환

    if (error) {
      console.error('❌ Error fetching tweet:', error);
      setIsLoading(false);
      return;
    }

    if (!data) {
      // ✅ 데이터가 없을 때는 /finalhome 으로 되돌리기
      navigate('/finalhome');
      return;
    }

    const mappedTweet: Tweet = {
      id: data.id,
      user: {
        name: data.profiles?.nickname || 'Unknown',
        username: data.profiles?.user_id || 'anonymous',
        avatar: data.profiles?.avatar_url || '/default-avatar.svg',
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
    };

    setTweet(mappedTweet);
    setIsLoading(false);
  };

  // ✅ 댓글은 추후 Supabase 연동 가능
  const handleAddReply = (replyText: string) => {
    const newReply = {
      id: Date.now().toString(),
      user: {
        name: 'You',
        username: 'your_username',
        avatar: '/default-avatar.svg',
      },
      content: replyText,
      timestamp: 'now',
      stats: { replies: 0, retweets: 0, likes: 0, views: 1 },
    };
    setReplies(prev => [newReply, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!tweet) {
    // ✅ 트윗이 존재하지 않으면 홈으로
    navigate('/finalhome');
    return null;
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div className="w-full max-w-2xl mx-auto border-x border-gray-200">
        {/* Header */}
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

        {/* Main */}
        <div>
          <TweetDetailCard tweet={tweet} />
          {/* <ReplyComposer onReply={handleAddReply} /> */}
          <ReplyList replies={replies} />
        </div>
      </div>
    </div>
  );
}

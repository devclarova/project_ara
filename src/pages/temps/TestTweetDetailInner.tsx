// src/pages/feed/TweetDetailInner.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MessageCircle, Repeat2, Heart, Bookmark, Share } from 'lucide-react';
import RepliesList from '@/components/detail/RepliesList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import ReplyBox from './ReplyBox';

export default function TweetDetailInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tweet, setTweet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // ✅ 현재 로그인한 유저 프로필 불러오기
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => data && setProfile(data));
  }, [user]);

  // ✅ 트윗 본문 가져오기
  useEffect(() => {
    const fetchTweet = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('tweets')
        .select(
          `
          id, content, image_url, created_at,
          like_count, repost_count, bookmark_count,
          profiles:author_id (nickname, avatar_url)
        `,
        )
        .eq('id', id)
        .single();
      if (!error) setTweet(data);
      setLoading(false);
    };
    fetchTweet();
  }, [id]);

  // ✅ 댓글 가져오기 함수 (useCallback으로 바깥에서도 사용 가능)
  const fetchReplies = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('tweet_replies')
      .select(
        `
        id, content, created_at,
        profiles:author_id (nickname, avatar_url)
      `,
      )
      .eq('tweet_id', id)
      .order('created_at', { ascending: false });
    if (!error) {
      setReplies(
        data.map(r => ({
          id: r.id,
          author: r.profiles?.nickname,
          avatar: r.profiles?.avatar_url,
          text: r.content,
          time: new Date(r.created_at).toLocaleString('ko-KR'),
        })),
      );
    }
  }, [id]);

  // ✅ 첫 렌더링 시 댓글 가져오기
  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) return <div className="text-center py-10 text-gray-500">로딩 중...</div>;
  if (!tweet)
    return <div className="text-center py-10 text-gray-500">트윗을 찾을 수 없습니다 😢</div>;

  return (
    <div className="flex flex-col">
      {/* ✅ 상단 헤더 */}
      <div className="flex items-center space-x-3 p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">게시글</h2>
      </div>

      {/* ✅ 트윗 본문 */}
      <div className="px-5 py-6 border-b border-gray-200">
        {/* 사용자 정보 */}
        <div className="flex items-start space-x-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage
              src={tweet.profiles?.avatar_url || '/default-avatar.svg'}
              alt={tweet.profiles?.nickname || 'User'}
            />
            <AvatarFallback>{(tweet.profiles?.nickname?.[0] || 'U').toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <span className="font-bold text-gray-900">
              {tweet.profiles?.nickname || 'Unknown User'}
            </span>
            <span className="text-gray-500 text-sm">@{tweet.profiles?.nickname}</span>
          </div>
        </div>

        {/* 내용 */}
        <div className="mb-4">
          <div
            className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: tweet.content }}
          />
        </div>

        {/* 이미지 */}
        {tweet.image_url && (
          <div className="mb-4">
            <img
              src={tweet.image_url}
              alt="tweet media"
              className="w-full rounded-2xl border border-gray-200 object-cover max-h-96"
            />
          </div>
        )}

        {/* 작성 시간 */}
        <div className="text-gray-500 text-sm mb-4 pb-4 border-b border-gray-200">
          {new Date(tweet.created_at).toLocaleString('ko-KR')} ·{' '}
          <span className="font-semibold">
            {formatNumber(Math.floor(Math.random() * 10000 + 300))} Views
          </span>
        </div>
      </div>

      {/* ✅ 댓글 작성 + 댓글 목록 */}
      <ReplyBox
        profile={profile}
        parentId={tweet.id}
        onReply={() => fetchReplies()} // 댓글 작성 후 목록 새로고침
      />

      <RepliesList replies={replies} />
    </div>
  );
}

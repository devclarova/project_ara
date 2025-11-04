// src/pages/homes/feature/TweetCard.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  name: string;
  username: string;
  avatar: string;
}

interface Stats {
  replies?: number;
  retweets?: number;
  likes?: number;
  views?: number;
  comments?: number;
  bookmarks?: number;
}

interface TweetCardProps {
  id: string;
  user: User;
  content: string;
  image?: string;
  timestamp: string;
  stats: Stats;
}

export default function TweetCard({ id, user, content, image, timestamp, stats }: TweetCardProps) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(stats.likes ?? 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [localStats, setLocalStats] = useState(stats);

  // ✅ 로그인된 유저의 profiles.id 조회
  useEffect(() => {
    const loadProfileId = async () => {
      if (!authUser) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .single();
      if (error) console.error('❌ 프로필 ID 조회 실패:', error.message);
      else setProfileId(data.id);
    };
    loadProfileId();
  }, [authUser]);

  // ✅ 초기 좋아요 여부 확인
  useEffect(() => {
    const checkLike = async () => {
      if (!profileId) return;
      const { data, error } = await supabase
        .from('tweet_likes')
        .select('id')
        .eq('tweet_id', id)
        .eq('user_id', profileId)
        .maybeSingle();
      if (error) console.error('❌ checkLike error:', error.message);
      setLiked(!!data);
    };
    checkLike();
  }, [id, profileId]);

  // ✅ 좋아요 토글 함수
  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authUser || !profileId) return alert('로그인이 필요합니다.');

    if (!liked) {
      const { error } = await supabase.from('tweet_likes').insert({
        tweet_id: id,
        user_id: profileId,
      });
      if (error && error.code !== '23505') {
        console.error('❌ 좋아요 추가 실패:', error.message);
        return;
      }
      setLiked(true);
      setLikeCount(prev => prev + 1);
    } else {
      const { error } = await supabase
        .from('tweet_likes')
        .delete()
        .match({ tweet_id: id, user_id: profileId });
      if (error) {
        console.error('❌ 좋아요 제거 실패:', error.message);
        return;
      }
      setLiked(false);
      setLikeCount(prev => Math.max(prev - 1, 0));
    }
  };

  const handleCardClick = () => navigate(`/finalhome/${id}`);
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/finalhome/user/${user.name}`);
  };

  const safeContent = DOMPurify.sanitize(content);

  useEffect(() => {
    // ✅ 개별 트윗의 view_count 변경 실시간 감시
    const channel = supabase
      .channel(`tweet-${id}-views`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tweets',
          filter: `id=eq.${id}`,
        },
        payload => {
          const newViewCount = (payload.new as any)?.view_count;
          if (newViewCount !== undefined) {
            setLikeCount(prev => prev); // 유지
            // ✅ local 상태(stats.views) 갱신
            setLocalStats(prev => ({
              ...prev,
              views: newViewCount,
            }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  return (
    <div
      className="border-b border-gray-200 px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex space-x-3">
        {/* 아바타 */}
        <div onClick={handleAvatarClick} className="cursor-pointer">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatar || '/default-avatar.svg'} alt={user.name} />
            <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
        </div>

        {/* 본문 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1 flex-wrap">
            <span
              className="font-bold text-gray-900 hover:underline cursor-pointer truncate"
              onClick={e => {
                e.stopPropagation();
                navigate(`/finalhome/user/${user.username}`);
              }}
            >
              {user.name}
            </span>
            <span className="text-gray-500 truncate">@{user.username}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500 flex-shrink-0">{timestamp}</span>
          </div>

          <div
            className="mt-1 text-gray-900 text-[15px] leading-snug whitespace-pre-line break-words"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />

          {image && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
              <img src={image} alt="Tweet image" className="w-full h-auto object-cover" />
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="flex items-center justify-between max-w-md mt-3 text-gray-500">
            {/* Reply */}
            <button
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors group"
              onClick={e => {
                e.stopPropagation();
                navigate(`/finalhome/${id}`);
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <i className="ri-chat-3-line text-lg"></i>
              </div>
              <span className="text-sm">{stats.replies ?? 0}</span>
            </button>

            {/* Retweet */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                retweeted ? 'text-green-500' : 'hover:text-green-500'
              }`}
              onClick={e => {
                e.stopPropagation();
                setRetweeted(!retweeted);
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                <i className="ri-repeat-line text-lg"></i>
              </div>
              <span className="text-sm">{stats.retweets ?? 0}</span>
            </button>

            {/* Like */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                liked ? 'text-red-500' : 'hover:text-red-500'
              }`}
              onClick={handleLikeToggle}
            >
              <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
                <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`}></i>
              </div>
              <span className="text-sm">{likeCount}</span>
            </button>

            {/* Views */}
            <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <i className="ri-eye-line text-lg"></i>
              </div>
              <span className="text-sm">{stats.views ?? 0}</span>
            </button>

            {/* Bookmark */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                bookmarked ? 'text-blue-500' : 'hover:text-blue-500'
              }`}
              onClick={e => {
                e.stopPropagation();
                setBookmarked(!bookmarked);
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <i
                  className={`${bookmarked ? 'ri-bookmark-fill' : 'ri-bookmark-line'} text-lg`}
                ></i>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

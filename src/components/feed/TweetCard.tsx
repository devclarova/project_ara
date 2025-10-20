// src/components/TweetCard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Repeat2, Heart, Bookmark, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TweetCardProps {
  id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  like_count: number;
  repost_count: number;
  bookmark_count: number;
  profiles?: { nickname: string; avatar_url: string | null } | null;
}

export default function TweetCard({
  id,
  content,
  image_url,
  created_at,
  like_count,
  repost_count,
  bookmark_count,
  profiles,
}: TweetCardProps) {
  const navigate = useNavigate();

  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [reposted, setReposted] = useState(false);

  const [likeCount, setLikeCount] = useState(like_count);
  const [repostCount, setRepostCount] = useState(repost_count);
  const [bookmarkCount, setBookmarkCount] = useState(bookmark_count);

  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: ko });

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(prev => !prev);
    setLikeCount(prev => (liked ? prev - 1 : prev + 1));
  };

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked(prev => !prev);
    setBookmarkCount(prev => (bookmarked ? prev - 1 : prev + 1));
  };

  const toggleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReposted(prev => !prev);
    setRepostCount(prev => (reposted ? prev - 1 : prev + 1));
  };

  const handleNavigate = () => {
    navigate(`/social/${id}`);
  };

  return (
    <article
      onClick={handleNavigate}
      className="flex space-x-3 p-4 hover:bg-gray-50 transition cursor-pointer"
    >
      {/* 프로필 이미지 */}
      {profiles?.avatar_url ? (
        <img
          src={profiles.avatar_url}
          alt={profiles.nickname || 'user'}
          onError={e => (e.currentTarget.src = '/default-avatar.svg')}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <svg
          width="48"
          height="48"
          viewBox="0 0 80 80"
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 rounded-full flex-shrink-0"
        >
          <circle cx="40" cy="40" r="40" fill="#ccc" />
          <path
            d="M40 40C46.6274 40 52 34.6274 52 28C52 21.3726 46.6274 16 40 16C33.3726 16 28 21.3726 28 28C28 34.6274 33.3726 40 40 40Z"
            fill="#e6e6e6"
          />
          <path
            d="M16 64C16 50.7452 26.7452 40 40 40C53.2548 40 64 50.7452 64 64H16Z"
            fill="#e6e6e6"
          />
        </svg>
      )}

      {/* 본문 */}
      <div className="flex-1">
        {/* 헤더 */}
        <header className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="font-semibold text-black">{profiles?.nickname || 'Unknown User'}</span>
          <span className="text-gray-400">· {timeAgo}</span>
        </header>

        {/* 내용 */}
        <p className="mt-1 text-gray-800 text-[15px] leading-snug whitespace-pre-line">{content}</p>

        {/* 이미지 */}
        {image_url && (
          <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
            <img src={image_url} alt="tweet media" className="w-full object-cover" />
          </div>
        )}

        {/* 액션 버튼 */}
        <footer className="flex justify-between mt-3 text-gray-500 text-sm">
          <button
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-blue-500"
          >
            <MessageCircle size={18} />
          </button>

          <button
            onClick={toggleRepost}
            className={`flex items-center gap-1 transition-colors ${
              reposted ? 'text-green-600' : 'hover:text-green-500'
            }`}
          >
            <Repeat2 size={18} className={`${reposted ? 'rotate-180' : ''} transition-transform`} />
            <span>{repostCount}</span>
          </button>

          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 transition-colors ${
              liked ? 'text-pink-500' : 'hover:text-pink-500'
            }`}
          >
            <Heart size={18} fill={liked ? '#ec4899' : 'none'} strokeWidth={liked ? 0 : 2} />
            <span>{likeCount}</span>
          </button>

          <button
            onClick={toggleBookmark}
            className={`flex items-center gap-1 transition-colors ${
              bookmarked ? 'text-blue-600' : 'hover:text-blue-600'
            }`}
          >
            <Bookmark
              size={18}
              fill={bookmarked ? '#1D9BF0' : 'none'}
              strokeWidth={bookmarked ? 0 : 2}
            />
            <span>{bookmarkCount}</span>
          </button>

          <button
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-gray-400"
          >
            <BarChart3 size={18} />
          </button>
        </footer>
      </div>
    </article>
  );
}

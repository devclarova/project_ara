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
    navigate(`/feed/${id}`);
  };

  return (
    <article
      onClick={handleNavigate}
      className="flex gap-3 p-5 hover:bg-muted/40 transition-colors cursor-pointer"
    >
      {/* 프로필 이미지 */}
      {profiles?.avatar_url ? (
        <img
          src={profiles.avatar_url}
          alt={profiles.nickname || 'user'}
          onError={e => (e.currentTarget.src = '/default-avatar.svg')}
          className="w-11 h-11 rounded-full object-cover border border-border/50"
        />
      ) : (
        <img
          src={profiles?.avatar_url || '/default-avatar.svg'}
          alt={profiles?.nickname || 'user'}
          onError={e => (e.currentTarget.src = '/default-avatar.svg')}
          className="w-11 h-11 rounded-full object-cover border border-border/50 flex-shrink-0"
        />
      )}

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        {/* 헤더 */}
        <header className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {profiles?.nickname || 'Unknown User'}
          </span>
          <span className="text-muted-foreground/70">· {timeAgo}</span>
        </header>

        {/* 내용 */}
        <div
          className="mt-1 text-foreground text-[15px] leading-snug whitespace-pre-line break-words"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* 이미지 */}
        {image_url && (
          <div className="mt-3 rounded-xl overflow-hidden border border-border/60">
            <img
              src={image_url}
              alt="tweet media"
              className="w-full h-auto object-cover transition-transform duration-200 hover:scale-[1.01]"
            />
          </div>
        )}

        {/* 액션 버튼 */}
        <footer className="flex justify-between mt-4 text-muted-foreground text-sm">
          <button
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-primary transition-colors"
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
              bookmarked ? 'text-primary' : 'hover:text-primary/90'
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
            className="flex items-center gap-1 hover:text-muted-foreground/70"
          >
            <BarChart3 size={18} />
          </button>
        </footer>
      </div>
    </article>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';

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

interface Tweet {
  id: string;
  user: User;
  content: string;
  image?: string;
  timestamp: string;
  stats: Stats;
}

interface TweetDetailCardProps {
  tweet: Tweet;
}

export default function TweetDetailCard({ tweet }: TweetDetailCardProps) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/finalhome/user/${tweet.user.name}`);
  };

  const normalizedStats = {
    replies: tweet.stats.replies || tweet.stats.comments || 0,
    retweets: tweet.stats.retweets || 0,
    likes: tweet.stats.likes || 0,
    views: tweet.stats.views || 0,
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-6 bg-white dark:bg-background">
      <div className="flex space-x-3">
        <div onClick={handleAvatarClick} className="cursor-pointer">
          <Avatar>
            <AvatarImage src={tweet.user.avatar || '/default-avatar.svg'} alt={tweet.user.name} />
            <AvatarFallback>{tweet.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          {/* User Info */}
          <div className="flex items-center space-x-1 flex-wrap">
            <span
              className="font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer truncate"
              onClick={handleAvatarClick}
            >
              {tweet.user.name}
            </span>
            {/* <span className="text-gray-500 dark:text-gray-400 truncate">
              @{tweet.user.username}
            </span> */}
          </div>
        </div>
      </div>

      {/* Tweet Content */}
      <div className="mt-4">
        <div
          className="text-gray-900 dark:text-gray-100 text-xl leading-relaxed break-words"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(tweet.content, {
              ADD_TAGS: ['iframe', 'video', 'source', 'img'],
              ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
            }),
          }}
        />

        {/* Tweet Image (fallback for old content) */}
        {tweet.image && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <img src={tweet.image} alt="Tweet image" className="w-full h-auto object-cover" />
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="mt-4 text-gray-500 dark:text-gray-400 text-sm">{tweet.timestamp}</div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-6 text-sm">
          <span className="text-gray-900 dark:text-gray-100">
            <span className="font-bold">{normalizedStats.replies}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">댓글</span>
          </span>
          <span className="text-gray-900 dark:text-gray-100">
            <span className="font-bold">{normalizedStats.likes}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">좋아요</span>
          </span>
          <span className="text-gray-900 dark:text-gray-100">
            <span className="font-bold">{normalizedStats.views}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">조회수</span>
          </span>
        </div>
      </div>

      {/* 액션 버튼은 주석 그대로 유지 */}
    </div>
  );
}

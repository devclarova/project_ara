import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleCardClick = () => {
    // Navigate to tweet detail page using the actual tweet ID
    navigate(`/tweet/${id}`);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tweet card click
    // Navigate to user's profile page
    navigate(`/profile/${user.username}`);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // Normalize stats to handle different property names
  const normalizedStats = {
    replies: stats.replies || stats.comments || 0,
    retweets: stats.retweets || 0,
    likes: stats.likes || 0,
    views: stats.views || 0,
  };

  return (
    <div
      className="border-b border-gray-200 px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex space-x-3">
        <div onClick={handleAvatarClick} className="cursor-pointer">
          {/* <Avatar src={user.avatar} alt={user.name} size="md" /> */}
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatar || '/default-avatar.svg'} alt={user.name} />
            <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          {/* User Info */}
          <div className="flex items-center space-x-1 flex-wrap">
            <span
              className="font-bold text-gray-900 hover:underline cursor-pointer truncate"
              onClick={handleAvatarClick}
            >
              {user.name}
            </span>
            <span className="text-gray-500 truncate">@{user.username}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500 flex-shrink-0">{timestamp}</span>
          </div>

          {/* Tweet Content */}
          <div className="mt-1">
            <p className="text-gray-900 whitespace-pre-wrap break-words">{content}</p>

            {/* Tweet Image */}
            {image && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
                <img src={image} alt="Tweet image" className="w-full h-auto object-cover" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between max-w-md mt-3 text-gray-500">
            {/* Reply */}
            <button
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors group"
              onClick={e => handleActionClick(e, () => navigate(`/tweet/${id}`))}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <i className="ri-chat-3-line text-lg"></i>
              </div>
              <span className="text-sm">{normalizedStats.replies}</span>
            </button>

            {/* Retweet */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                retweeted ? 'text-green-500' : 'hover:text-green-500'
              }`}
              onClick={e => handleActionClick(e, () => setRetweeted(!retweeted))}
            >
              <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                <i className="ri-repeat-line text-lg"></i>
              </div>
              <span className="text-sm">{normalizedStats.retweets + (retweeted ? 1 : 0)}</span>
            </button>

            {/* Like */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                liked ? 'text-red-500' : 'hover:text-red-500'
              }`}
              onClick={e => handleActionClick(e, () => setLiked(!liked))}
            >
              <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
                <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`}></i>
              </div>
              <span className="text-sm">{normalizedStats.likes + (liked ? 1 : 0)}</span>
            </button>

            {/* Views */}
            <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <i className="ri-bar-chart-line text-lg"></i>
              </div>
              <span className="text-sm">{normalizedStats.views}</span>
            </button>

            {/* Bookmark */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                bookmarked ? 'text-blue-500' : 'hover:text-blue-500'
              }`}
              onClick={e => handleActionClick(e, () => setBookmarked(!bookmarked))}
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

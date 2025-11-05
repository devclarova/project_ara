// src/pages/homes/tweet/components/TweetDetailCard.tsx
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
    <div className="border-b border-gray-200 px-4 py-6">
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
              className="font-bold text-gray-900 hover:underline cursor-pointer truncate"
              onClick={handleAvatarClick}
            >
              {tweet.user.name}
            </span>
            <span className="text-gray-500 truncate">@{tweet.user.username}</span>
          </div>
        </div>
      </div>

      {/* Tweet Content */}
      <div className="mt-4">
        <div
          className="text-gray-900 text-xl leading-relaxed break-words"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(tweet.content, {
              ADD_TAGS: ['iframe', 'video', 'source', 'img'],
              ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
            }),
          }}
        />

        {/* Tweet Image (fallback for old content) */}
        {tweet.image && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200">
            <img src={tweet.image} alt="Tweet image" className="w-full h-auto object-cover" />
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="mt-4 text-gray-500 text-sm">{tweet.timestamp}</div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-6 text-sm">
          <span className="text-gray-900">
            <span className="font-bold">{normalizedStats.replies}</span>
            <span className="text-gray-500 ml-1">Retweets</span>
          </span>
          <span className="text-gray-900">
            <span className="font-bold">{normalizedStats.likes}</span>
            <span className="text-gray-500 ml-1">Likes</span>
          </span>
          <span className="text-gray-900">
            <span className="font-bold">{normalizedStats.views}</span>
            <span className="text-gray-500 ml-1">Views</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {/* <div className="flex items-center justify-around mt-4 pt-4 border-t border-gray-200 text-gray-500"> */}
        {/* Reply */}
        {/* <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors group">
          <div className="p-3 rounded-full group-hover:bg-blue-50 transition-colors">
            <i className="ri-chat-3-line text-xl"></i>
          </div>
        </button> */}

        {/* Retweet */}
        {/* <button
          className={`flex items-center space-x-2 transition-colors group ${
            retweeted ? 'text-green-500' : 'hover:text-green-500'
          }`}
          onClick={() => setRetweeted(!retweeted)}
        >
          <div className="p-3 rounded-full group-hover:bg-green-50 transition-colors">
            <i className="ri-repeat-line text-xl"></i>
          </div>
        </button> */}

        {/* Like */}
        {/* <button
          className={`flex items-center space-x-2 transition-colors group ${
            liked ? 'text-red-500' : 'hover:text-red-500'
          }`}
          onClick={() => setLiked(!liked)}
        >
          <div className="p-3 rounded-full group-hover:bg-red-50 transition-colors">
            <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-xl`}></i>
          </div>
        </button> */}

        {/* Share */}
        {/* <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors group">
          <div className="p-3 rounded-full group-hover:bg-blue-50 transition-colors">
            <i className="ri-share-line text-xl"></i>
          </div>
        </button> */}

        {/* Views */}
        {/* <button className="flex items-center space-x-2 hover:text-green-500 transition-colors group">
          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
            <i className="ri-eye-line text-lg"></i>
          </div>
          <span className="text-sm">0</span>
        </button> */}

        {/* Bookmark */}
        {/* <button
          className={`flex items-center space-x-2 transition-colors group ${
            bookmarked ? 'text-blue-500' : 'hover:text-blue-500'
          }`}
          onClick={() => setBookmarked(!bookmarked)}
        >
          <div className="p-3 rounded-full group-hover:bg-blue-50 transition-colors">
            <i className={`${bookmarked ? 'ri-bookmark-fill' : 'ri-bookmark-line'} text-xl`}></i>
          </div>
        </button> */}
      {/* </div> */}
    </div>
  );
}

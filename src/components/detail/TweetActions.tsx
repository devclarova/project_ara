import React, { useState } from 'react';
import { useLike } from '../../hooks/useLike';
import { useRetweet } from '../../hooks/useRetweet';
import { Bookmark, Heart, MessageCircle, Repeat2, Share2 } from 'lucide-react';

interface TweetActionsProps {
  tweet: {
    id: string;
    likes: number;
    retweets: number;
  };
}

const TweetActions = ({ tweet }: TweetActionsProps) => {
  const { id, likes, retweets } = tweet;
  const { liked, count: likeCount, toggleLike } = useLike(id, likes);
  const { retweeted, count: retweetCount, toggleRetweet } = useRetweet(id, retweets);

  const [bookmarked, setBookmarked] = useState(false);

  const toggleBookmark = () => setBookmarked(prev => !prev);

  return (
    <section className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-around">
        {/* 댓글 */}
        <button className="flex items-center justify-center text-secondary hover:text-blue-600 p-3 rounded-full hover:bg-blue-50 transition-colors">
          <MessageCircle className="w-5 h-5" />
        </button>

        {/* 리트윗 */}
        <button
          onClick={toggleRetweet}
          className={`flex items-center justify-center p-3 rounded-full transition-colors ${
            retweeted
              ? 'text-green-600 bg-green-50'
              : 'text-secondary hover:text-green-600 hover:bg-green-50'
          }`}
        >
          <Repeat2 className={`w-5 h-5 ${retweeted ? 'rotate-180' : ''}`} />
        </button>

        {/* 좋아요 */}
        <button
          onClick={toggleLike}
          className={`flex items-center justify-center p-3 rounded-full transition-colors ${
            liked ? 'text-red-600 bg-red-50' : 'text-secondary hover:text-red-600 hover:bg-red-50'
          }`}
        >
          <Heart
            className="w-5 h-5"
            fill={liked ? '#ef4444' : 'none'}
            strokeWidth={liked ? 0 : 2}
          />
        </button>

        {/* 북마크 */}
        <button
          onClick={toggleBookmark}
          className={`flex items-center justify-center p-3 rounded-full transition-colors ${
            bookmarked
              ? 'text-primary bg-blue-50'
              : 'text-secondary hover:text-primary hover:bg-blue-50'
          }`}
        >
          <Bookmark
            className="w-5 h-5"
            fill={bookmarked ? '#1D9BF0' : 'none'}
            strokeWidth={bookmarked ? 0 : 2}
          />
        </button>

        {/* 공유 */}
        <button className="flex items-center justify-center text-secondary hover:text-blue-600 p-3 rounded-full hover:bg-blue-50 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default TweetActions;

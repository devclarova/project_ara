import React from 'react';
import { useLike } from '../../hooks/useLike';
import { useRetweet } from '../../hooks/useRetweet';
import { Heart, MessageCircle, Repeat2, Share2 } from 'lucide-react';
import Avatar from '../common/Avatar';

interface ReplyCardProps {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  time: string;
  text: string;
  likes: number;
  replies: number;
  retweets: number;
}
const ReplyCard = ({
  id,
  author,
  handle,
  avatar,
  time,
  text,
  likes,
  replies,
  retweets,
}: ReplyCardProps) => {
  const { liked, count: likeCount, toggleLike } = useLike(id, likes);
  const { retweeted, count: retweetCount, toggleRetweet } = useRetweet(id, retweets);
  return (
    <div className="reply-card p-6 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-200">
      <div className="flex space-x-3">
        {/* 프로필 이미지 */}
        <Avatar src={avatar} alt={author} size={48} />

        {/* 본문 */}
        <div className="flex-1">
          {/* 작성자 */}
          <div className="flex items-center space-x-2">
            <span className="font-bold">{author}</span>
            <span className="text-secondary">@{handle}</span>
            <span className="text-secondary">·</span>
            <span className="text-secondary">{time}</span>
          </div>

          {/* 내용 */}
          <p className="mt-2 text-gray-900 leading-relaxed">{text}</p>

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between mt-4 max-w-md">
            {/* 댓글 수 */}
            <button className="flex items-center space-x-1 text-secondary hover:text-blue-600 group">
              <div className="w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-blue-50">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-sm">{replies}</span>
            </button>

            {/* 리트윗 */}
            <button
              onClick={toggleRetweet}
              className={`flex items-center space-x-1 group ${
                retweeted ? 'text-green-600' : 'text-secondary hover:text-green-600'
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-green-50 ${
                  retweeted ? 'bg-green-50' : ''
                }`}
              >
                <Repeat2 className="w-4 h-4" />
              </div>
              <span className="text-sm">{retweetCount}</span>
            </button>

            {/* 좋아요 */}
            <button
              onClick={toggleLike}
              className={`flex items-center space-x-1 group ${
                liked ? 'text-red-600' : 'text-secondary hover:text-red-600'
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-red-50 ${
                  liked ? 'bg-red-50' : ''
                }`}
              >
                <Heart
                  className="w-4 h-4"
                  fill={liked ? '#ef4444' : 'none'}
                  strokeWidth={liked ? 0 : 2}
                />
              </div>
              <span className="text-sm">{likeCount}</span>
            </button>

            {/* 공유 */}
            <button className="flex items-center space-x-1 text-secondary hover:text-blue-600 group">
              <div className="w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-blue-50">
                <Share2 className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyCard;

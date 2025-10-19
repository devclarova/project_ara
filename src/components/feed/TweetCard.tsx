import { MessageCircle, Repeat2, Heart, Share2 } from 'lucide-react';
import { useRetweet } from '../../hooks/useRetweet';
import { useLike } from '../../hooks/useLike';
import { useNavigate } from 'react-router-dom';

interface TweetCardProps {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  comments: number;
  retweets: number;
  likes: number;
}

const TweetCard = ({
  id,
  author,
  handle,
  avatar,
  time,
  content,
  image,
  comments,
  retweets,
  likes,
}: TweetCardProps) => {
  const navigate = useNavigate();
  const { liked, count: likeCount, toggleLike } = useLike(id, likes);
  const { retweeted, count: retweetCount, toggleRetweet } = useRetweet(id, retweets);

  const handleNavigate = () => {
    navigate(`/social/${id}`);
  };
  return (
    <div
      onClick={handleNavigate}
      className="tweet-card p-4 cursor-pointer transition-colors border-b border-gray-200 hover:bg-gray-50"
    >
      <div className="flex space-x-3">
        {/* 아바타 */}
        <img src={avatar} alt={author} className="w-12 h-12 rounded-full object-cover" />

        {/* 본문 */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold">{author}</span>
            <span className="text-secondary">@{handle}</span>
            <span className="text-secondary">·</span>
            <span className="text-secondary">{time}</span>
          </div>

          {/* 본문 텍스트 */}
          <p className="mt-2 text-gray-900">{content}</p>

          {/* 이미지 (선택적) */}
          {image && (
            <img src={image} alt="tweet" className="mt-3 rounded-2xl w-full object-cover" />
          )}

          {/* 인터랙션 버튼 */}
          <div
            className="flex items-center justify-between mt-4 max-w-md text-secondary"
            onClick={e => e.stopPropagation()} // 클릭 시 상세 이동 막기
          >
            {/* 댓글 */}
            <button className="flex items-center space-x-2 hover:text-blue-600 group">
              <div className="w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-blue-50">
                <MessageCircle size={18} />
              </div>
              <span className="text-sm">{comments}</span>
            </button>

            {/* 리트윗 */}
            <button
              onClick={toggleRetweet}
              className={`flex items-center space-x-2 group transition-colors ${
                retweeted ? 'text-green-600' : 'hover:text-green-600'
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  retweeted ? 'bg-green-50' : 'group-hover:bg-green-50'
                }`}
              >
                <Repeat2 size={18} className={`${retweeted ? 'rotate-180 text-green-600' : ''}`} />
              </div>
              <span className="text-sm">{retweetCount}</span>
            </button>

            {/* 좋아요 */}
            <button
              onClick={toggleLike}
              className={`flex items-center space-x-2 group transition-colors ${
                liked ? 'text-red-600' : 'hover:text-red-600'
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  liked ? 'bg-red-50' : 'group-hover:bg-red-50'
                }`}
              >
                <Heart size={18} fill={liked ? '#ef4444' : 'none'} strokeWidth={liked ? 0 : 2} />
              </div>
              <span className="text-sm">{likeCount}</span>
            </button>

            {/* 공유 */}
            <button className="flex items-center space-x-2 hover:text-blue-600 group">
              <div className="w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-blue-50">
                <Share2 size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;

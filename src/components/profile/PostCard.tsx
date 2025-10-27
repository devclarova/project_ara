import { useEffect, useState } from 'react';

export interface PostCardProps {
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  onLike?: () => void;
}

function PostCard({
  author,
  content,
  image,
  timestamp,
  likes,
  comments,
  shares,
  isLiked,
  onLike,
}: PostCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [liked, setLiked] = useState<boolean>(!!isLiked);
  useEffect(() => {
    if (typeof isLiked === 'boolean') setLiked(isLiked);
  }, [isLiked]);

  const displayLikeCount = likes + (liked ? 1 : 0);

  const handleLike = () => {
    setLiked(prev => !prev);
    onLike?.();
  };

  return (
    <article className="bg-white rounded-2xl border border-[#e5e7eb] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-150">
      <div className="flex items-start gap-3 mb-3">
        <img
          src={author.avatar}
          alt={author.name}
          className="w-12 h-12 rounded-full object-cover object-top"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#111827]">{author.name}</h3>
              <div className="flex items-center justify-between gap-3">
                <p className="text-base text-[#6b7280]">@{author.username}</p>
                <span className="text-[#6b7280] text-sm">{timestamp}</span>
              </div>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e2f8f5] transition-all duration-200 cursor-pointer">
              <i className="ri-more-2-fill text-[#6b7280]"></i>
            </button>
          </div>
        </div>
      </div>

      <p className="text-[#111827] mb-3 leading-relaxed">{content}</p>

      {image && (
        <div className="mb-3 rounded-xl overflow-hidden">
          <img src={image} alt="Post content" className="w-full h-auto object-cover object-top" />
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#e5e7eb]">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e2f8f5] transition-all duration-200 cursor-pointer ${
            isLiked ? 'text-[#ef4444]' : 'text-[#6b7280]'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <i className={`${isLiked ? 'ri-heart-fill' : 'ri-heart-line'} text-xl`}></i>
          </div>
          <span className="font-medium">{displayLikeCount}</span>
        </button>

        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e2f8f5] text-[#6b7280] transition-all duration-200 cursor-pointer">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-chat-3-line text-xl"></i>
          </div>
          <span className="font-medium">{comments}</span>
        </button>

        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e2f8f5] text-[#6b7280] transition-all duration-200 cursor-pointer">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-share-line text-xl"></i>
          </div>
          <span className="font-medium">{shares}</span>
        </button>

        <button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e2f8f5] transition-all duration-200 cursor-pointer ${
            isBookmarked ? 'text-[#00bdaa]' : 'text-[#6b7280]'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <i className={`${isBookmarked ? 'ri-bookmark-fill' : 'ri-bookmark-line'} text-xl`}></i>
          </div>
        </button>
      </div>
    </article>
  );
}

// 빈 상태(Empty State) 카드: 모든 탭에서 동일 스케일 유지
export const EmptyCard: React.FC<{ iconClass?: string; text: string }> = ({
  iconClass = 'ri-file-list-line',
  text,
}) => {
  return (
    <div className="w-full rounded-2xl border border-[#e5e7eb] p-6 min-h-[180px] text-center flex flex-col items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <div className="w-16 h-16 flex items-center justify-center mb-4 text-[#9ca3af]">
        <i className={`${iconClass} text-5xl`} />
      </div>
      <p className="text-[#9ca3af] text-lg">{text}</p>
    </div>
  );
};

export default PostCard;

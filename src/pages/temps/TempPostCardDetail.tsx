// PostCardDetail.tsx
import { MessageSquare, ThumbsUp, MessageCircle } from 'lucide-react';

type PostCardDetailProps = {
  path: string; // 상단 경로
  title: string;
  content: string;
  author: string;
  time: string;
  avatar?: string;
  stats: {
    answers: number;
    likes: number;
    comments: number;
  };
};

export function PostCardDetail({
  path,
  title,
  content,
  author,
  time,
  avatar,
  stats,
}: PostCardDetailProps) {
  return (
    <div className="post-card border-b border-gray-200 py-4">
      {/* 최상단: 경로 */}
      <div className="text-xs text-gray-500 mb-1">{path}</div>

      {/* 제목 */}
      <h3 className="text-base font-bold text-gray-900 mb-2 hover:text-[var(--color-brand)] cursor-pointer">
        {title}
      </h3>

      {/* 본문 내용 */}
      <p className="text-sm text-gray-700 mb-3 line-clamp-3">{content}</p>

      {/* 하단 Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        {/* 좌측: 통계 */}
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <MessageSquare size={16} /> 답변 {stats.answers}
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp size={16} /> 좋아요 {stats.likes}
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle size={16} /> 댓글 {stats.comments}
          </div>
        </div>

        {/* 우측: 작성자 정보 */}
        <div className="flex items-center gap-2">
          {avatar && <img src={avatar} alt={author} className="w-6 h-6 rounded-full" />}
          <span>{author}</span>
          <span className="text-gray-400">· {time}</span>
        </div>
      </div>
    </div>
  );
}

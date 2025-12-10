import { useEffect } from 'react';
import { ReplyCard } from './ReplyCard';

interface User {
  name: string; // nickname
  username: string; // user_id
  avatar: string;
}

interface Stats {
  comments: number;
  retweets: number;
  likes: number;
  views: number;
}

export interface Reply {
  id: string;
  tweetId: string;
  user: User;
  content: string;
  timestamp: string;
  stats: Stats;
}

interface ReplyListProps {
  replies: Reply[];
  onDeleted?: (id: string) => void;
  // 알림/방금 단 댓글 등에서 스크롤 타겟으로 쓸 id
  scrollTargetId?: string | null;
}

export default function ReplyList({ replies, onDeleted, scrollTargetId }: ReplyListProps) {
  // 스크롤 타겟 id가 바뀌면 해당 카드로 스크롤
  useEffect(() => {
    if (!scrollTargetId) return;
    const el = document.getElementById(`reply-${scrollTargetId}`);
    if (!el) return;

    // 헤더 높이만큼 위로 여유를 두고 스크롤
    const headerOffset = 120; // 필요하면 80~140 사이에서 조절
    const rect = el.getBoundingClientRect();
    const absoluteY = window.scrollY + rect.top;

    window.scrollTo({
      top: absoluteY - headerOffset,
      behavior: 'smooth',
    });
  }, [scrollTargetId, replies.length]);

  if (replies.length === 0) {
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
        <i className="ri-chat-3-line text-4xl mb-2 block" />
        <p>No replies yet</p>
        <p className="text-sm mt-1">Be the first to reply!</p>
      </div>
    );
  }

  return (
    <div>
      {replies.map(reply => (
        <ReplyCard
          key={reply.id}
          reply={reply}
          onDeleted={onDeleted}
          // 이 댓글이 스크롤 타겟이면 하이라이트
          highlight={scrollTargetId === reply.id}
        />
      ))}
    </div>
  );
}

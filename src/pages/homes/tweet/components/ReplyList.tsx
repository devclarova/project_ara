/**
 * 무한 스크롤 답글 리스트 모듈(Infinite Scroll Reply List Module):
 * - 목적(Why): 트윗에 달린 전체 답글 목록을 점진적으로 렌더링하여 앱의 메모리 오버헤드를 막음
 * - 방법(How): react-infinite-scroll-component의 Threshold 프로퍼티를 통해 페이징 이벤트를 지연 없이 호출하고 비어있는 상태에 대한 Fallback UI를 처리함
 */
import InfiniteScroll from 'react-infinite-scroll-component';
import { useTranslation } from 'react-i18next';
import { ReplyCard } from './ReplyCard';
import type { UIReply } from '@/types/sns';

interface ReplyListProps {
  replies: UIReply[];
  onDeleted?: (id: string) => void;
  hasMore: boolean;
  fetchMore: () => void;
  onCommentClick?: (id: string) => void;
  highlightId?: string | null;
}

export default function ReplyList({
  replies,
  onDeleted,
  hasMore,
  fetchMore,
  onCommentClick,
  highlightId,
}: ReplyListProps) {
  const { t } = useTranslation();

  if (!replies.length) {
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
        <i className="ri-chat-3-line text-4xl mb-2 block" />
        <p>{t('tweet.no_replies', '댓글이 없습니다.')}</p>
        <p className="text-sm mt-1">{t('tweet.be_first', '첫 댓글을 남겨보세요!')}</p>
      </div>
    );
  }

  return (
    <InfiniteScroll
      dataLength={replies.length}
      next={fetchMore}
      hasMore={hasMore}
      loader={
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 dark:border-primary/80" />
            <span>Loading comments...</span>
          </div>
        </div>
      }
      scrollThreshold={0.8}
      style={{ overflow: 'visible' }} // 중요: window 스크롤 사용 시 overflow visible
    >
      <div>
        {replies.map(reply => (
          <ReplyCard
            key={reply.id}
            reply={reply}
            onDeleted={onDeleted}
            onReply={() => {
              // Future: wiring for inline replies if needed
              onCommentClick?.(reply.id);
            }}
            onCommentClick={onCommentClick}
            highlight={reply.id === highlightId}
          />
        ))}
      </div>
    </InfiniteScroll>
  );
}

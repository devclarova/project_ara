import InfiniteScroll from 'react-infinite-scroll-component';
import { useTranslation } from 'react-i18next';
import { ReplyCard } from './ReplyCard';
import type { UIReply } from '@/types/sns';
import { ReplyInput } from './ReplyInput';
import { useEffect, useMemo } from 'react';

interface ReplyListProps {
  replies: UIReply[];
  onDeleted?: (id: string) => void;
  hasMore: boolean;
  fetchMore: () => void;
  onCommentClick?: (id: string) => void;
  openReplyId?: string | null;
  onAddedReply?: (reply: UIReply) => void;
  highlightId?: string | null;
  onCloseReply?: () => void;
}

type ReplyNode = UIReply & { children: ReplyNode[] };

function sortByCreatedAt(a: UIReply, b: UIReply) {
  const at = new Date(a.createdAt || a.timestamp || 0).getTime();
  const bt = new Date(b.createdAt || b.timestamp || 0).getTime();
  return at - bt;
}

function ReplyTree({
  node,
  depth,
  onDeleted,
  onCommentClick,
  openReplyId,
  onAddedReply,
  highlightId,
}: {
  node: ReplyNode;
  depth: number;
  onDeleted?: (id: string) => void;
  onCommentClick?: (id: string) => void;
  openReplyId?: string | null;
  onAddedReply?: (reply: UIReply) => void;
  highlightId?: string | null;
}) {
  return (
    <div className={depth > 0 ? 'ml-10' : ''}>
      <ReplyCard
        reply={{
          ...node,
          stats: {
            ...node.stats,
            replies: node.children.length,
          },
        }}
        onDeleted={onDeleted}
        onReply={depth === 0 ? r => onCommentClick?.(r.id) : undefined}
        highlight={node.id === highlightId}
      />

      {/* 답글 입력창 */}
      {openReplyId === node.id && (
        <ReplyInput
          target={node}
          onCancel={() => onCommentClick?.(node.id)}
          onAdded={newReply => onAddedReply?.(newReply)}
          onClose={() => onCommentClick?.(node.id)}
        />
      )}

      {/* 자식(대댓글/손자댓글...) 재귀 렌더 */}
      {node.children.map(child => (
        <ReplyTree
          key={child.id}
          node={child}
          depth={depth + 1}
          onDeleted={onDeleted}
          onCommentClick={onCommentClick}
          openReplyId={openReplyId}
          onAddedReply={onAddedReply}
          highlightId={highlightId}
        />
      ))}
    </div>
  );
}

export default function ReplyList({
  replies,
  onDeleted,
  hasMore,
  fetchMore,
  onCommentClick,
  openReplyId,
  onAddedReply,
  highlightId,
}: ReplyListProps) {
  const { t } = useTranslation();

  const threaded = useMemo(() => {
    const map = new Map<string, ReplyNode>();
    replies.forEach(r => map.set(r.id, { ...(r as any), children: [] }));

    const roots: ReplyNode[] = [];

    map.forEach(node => {
      const parentId = (node as any).parent_reply_id as string | null | undefined;

      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // 정렬: 모든 depth에 대해 정렬
    const sortDeep = (n: ReplyNode) => {
      n.children.sort(sortByCreatedAt);
      n.children.forEach(sortDeep);
    };

    roots.sort(sortByCreatedAt);
    roots.forEach(sortDeep);

    return roots;
  }, [replies]);

  useEffect(() => {
    // replies 늘어날 때 레이아웃 재계산 유도
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }, [replies.length]);

  const renderedCount = useMemo(() => {
    const count = (n: ReplyNode): number => 1 + n.children.reduce((acc, c) => acc + count(c), 0);
    return threaded.reduce((acc, r) => acc + count(r), 0);
  }, [threaded]);

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
      // dataLength={replies.length}
      key={renderedCount}
      dataLength={renderedCount}
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
      style={{ overflow: 'visible' }}
    >
      {threaded.map(root => (
        <ReplyTree
          key={root.id}
          node={root}
          depth={0}
          onDeleted={onDeleted}
          onCommentClick={onCommentClick}
          openReplyId={openReplyId}
          onAddedReply={onAddedReply}
          highlightId={highlightId}
        />
      ))}
    </InfiniteScroll>
  );
}

import { useEffect, useRef, useState } from 'react';
import { ReplyCard } from './ReplyCard';
import { ReplyInput } from './ReplyInput';
import { supabase } from '@/lib/supabase';

type TreeReply = Reply & {
  children: TreeReply[];
  commentCount?: number;
};

function buildReplyTree(replies: Reply[]): TreeReply[] {
  const map = new Map<string, TreeReply>();
  const roots: TreeReply[] = [];

  // 1. 모든 댓글을 map에 등록
  replies.forEach(r => {
    map.set(r.id, { ...r, children: [] });
  });

  // 2. 부모-자식 연결
  map.forEach(reply => {
    if (!reply.parent_reply_id) {
      roots.push(reply);
    } else {
      const parent = map.get(reply.parent_reply_id);
      if (parent) {
        parent.children.push(reply);
      }
    }
  });

  const sortRecursively = (node: TreeReply) => {
    node.children.sort(
      (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
    );
    node.children.forEach(sortRecursively);
  };

  // 댓글 수 계산
  roots.forEach(root => {
    sortRecursively(root);
    root.commentCount = calculateCommentCount(root);
  });

  return roots;
}

function calculateCommentCount(reply: TreeReply): number {
  if (!reply.children.length) return 0;

  return reply.children.reduce((acc, child) => {
    if (child.is_deleted) {
      // 삭제된 댓글은 자기 자신은 카운트 X
      // 하지만 자식은 살아있을 수 있음
      return acc + calculateCommentCount(child);
    }

    return acc + 1 + calculateCommentCount(child);
  }, 0);
}

async function syncCommentCountToDB(root: TreeReply) {
  const count = root.commentCount ?? 0;

  const { error } = await supabase
    .from('tweet_replies')
    .update({ comment_count: count })
    .eq('id', root.id);

  if (error) {
    console.error('댓글 수 동기화 실패:', error);
  }
}

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
  content: string | null;
  parent_reply_id?: string | null;
  root_reply_id?: string | null;
  timestamp: string;
  created_at?: string;
  stats: Stats;
  liked?: boolean;
  is_deleted?: boolean;
}

interface ReplyListProps {
  replies: Reply[];
  onDeleted?: (id: string) => void;
  onAdded?: (reply: Reply) => void;
  // 알림/방금 단 댓글 등에서 스크롤 타겟으로 쓸 id
  scrollTargetId?: string | null;
}

export default function ReplyList({
  replies: initialReplies,
  onDeleted,
  onAdded,
  scrollTargetId,
}: ReplyListProps) {
  // 스크롤 타겟
  const scrollToReplyId = useRef<string | null>(null);
  // 답글 대상 상태
  const [replyTarget, setReplyTarget] = useState<Reply | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);

  const [tree, setTree] = useState<TreeReply[]>([]);

  // const didInit = useRef(false);

  // 정규화 함수
  const normalizeReply = (r: Reply): Reply => ({
    ...r,
    is_deleted: r.is_deleted ?? false,
    content: r.is_deleted ? null : (r.content ?? ''),
    user: {
      name: r.user?.name ?? 'Unknown',
      username: r.user?.username ?? '',
      avatar: r.user?.avatar ?? '/default-avatar.svg',
    },
    stats: {
      comments: r.stats?.comments ?? 0,
      retweets: r.stats?.retweets ?? 0,
      likes: r.stats?.likes ?? 0,
      views: r.stats?.views ?? 0,
    },
    liked: r.liked ?? false,
  });

  useEffect(() => {
    if (!replies.length) return;
    const newTree = buildReplyTree(replies);
    setTree(newTree);
  }, [replies]);

  useEffect(() => {
    if (!scrollToReplyId.current) return;

    requestAnimationFrame(() => {
      const el = document.getElementById(`reply-${scrollToReplyId.current}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        scrollToReplyId.current = null;
      }
    });
  }, [tree]);

  // useEffect(() => {
  //   console.log(
  //     replies.map(r => ({
  //       id: r.id,
  //       parent: r.parent_reply_id,
  //       root: r.root_reply_id,
  //     })),
  //   );
  // }, [replies]);

  // 최초 로딩 때만 props 반영
  // useEffect(() => {
  //   if (didInit.current) return;

  //   if (initialReplies.length > 0) {
  //     setReplies(initialReplies.map(normalizeReply));
  //     didInit.current = true;
  //   }
  // }, [initialReplies]);

  // replies 변경 후 실제 스크롤 실행
  // useEffect(() => {
  //   if (!scrollToReplyId.current) return;

  //   const el = document.getElementById(`reply-${scrollToReplyId.current}`);
  //   if (el) {
  //     el.scrollIntoView({
  //       behavior: 'smooth',
  //       block: 'center',
  //     });
  //   }

  //   scrollToReplyId.current = null;
  // }, [replies]);

  // replies 변경 후 동기화
  useEffect(() => {
    if (!replies.length) return;

    const tree = buildReplyTree(replies);

    tree.forEach(root => {
      // 루트 댓글만 DB에 저장
      syncCommentCountToDB(root);
    });
  }, [replies]);

  useEffect(() => {
    setReplies(initialReplies.map(normalizeReply));
  }, [initialReplies]);

  // useEffect(() => {
  //   if (!scrollToReplyId.current) return;

  //   let tries = 0;
  //   const maxTries = 5;

  //   const tryScroll = () => {
  //     const id = scrollToReplyId.current;
  //     if (!id) return;

  //     const el = document.getElementById(`reply-${id}`);
  //     if (el) {
  //       el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //       scrollToReplyId.current = null;
  //       return;
  //     }

  //     if (tries++ < maxTries) {
  //       requestAnimationFrame(tryScroll);
  //     }
  //   };

  //   requestAnimationFrame(tryScroll);
  // }, [replies]);

  // 대대댓글
  useEffect(() => {
    if (!scrollToReplyId.current) return;

    let attempts = 0;
    const maxAttempts = 10;

    const tryScroll = () => {
      const id = scrollToReplyId.current;
      if (!id) return;

      const el = document.getElementById(`reply-${id}`);
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        scrollToReplyId.current = null;
        return;
      }

      if (attempts++ < maxAttempts) {
        requestAnimationFrame(tryScroll);
      }
    };

    requestAnimationFrame(tryScroll);
  }, [replies]);

  if (!replies.length) {
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
        <i className="ri-chat-3-line text-4xl mb-2 block" />
        <p>댓글이 없습니다.</p>
        <p className="text-sm mt-1">첫 댓글을 남겨보세요!</p>
      </div>
    );
  }

  // 루트 댓글
  // const rootReplies = replies.filter(r => !r.parent_reply_id);

  // 부모 id 기준으로 대댓글 묶기
  // const childMap = replies.reduce<Record<string, Reply[]>>((acc, r) => {
  //   if (r.parent_reply_id) {
  //     acc[r.parent_reply_id] ||= [];
  //     acc[r.parent_reply_id].push(r);
  //   }
  //   return acc;
  // }, {});

  const handleReply = (reply: Reply) => {
    setReplyTarget(reply);
  };

  // 대댓글 작성 시 부모 댓글 카운트 증가
  const handleAddChildReply = (rootReplyId: string, newReply: Reply) => {
    scrollToReplyId.current = newReply.id;

    setReplies(prev =>
      prev
        .map(r =>
          r.id === rootReplyId
            ? {
                ...r,
                stats: {
                  ...r.stats,
                  comments: r.stats.comments + 1,
                },
              }
            : r,
        )
        .concat(newReply),
    );
  };

  // 대댓 삭제
  const handleDeleteReply = (deletedId: string) => {
    setReplies(prev => prev.filter(r => r.id !== deletedId));

    const root = tree.find(r => r.id === deletedId || r.children.some(c => c.id === deletedId));
    if (root) syncCommentCountToDB(root);
  };

  // 대댓 좋아요
  const handleLikeReply = (replyId: string, delta: number) => {
    setReplies(prev =>
      prev.map(r =>
        r.id === replyId
          ? {
              ...r,
              liked: delta > 0,
              stats: {
                ...r.stats,
                likes: Math.max(0, r.stats.likes + delta),
              },
            }
          : r,
      ),
    );
  };

  // const tree = buildReplyTree(replies);

  return (
    <div>
      {tree.map(reply => (
        <ReplyNode
          key={reply.id}
          reply={reply}
          onReply={handleReply}
          replyTarget={replyTarget}
          setReplyTarget={setReplyTarget}
          onAdded={onAdded}
          handleAddChildReply={handleAddChildReply}
          scrollTargetId={scrollTargetId}
        />
      ))}
    </div>
  );

  function ReplyNode({
    reply,
    onReply,
    replyTarget,
    setReplyTarget,
    onAdded,
    handleAddChildReply,
    scrollTargetId,
  }: {
    reply: TreeReply;
    onReply: (r: Reply) => void;
    replyTarget: Reply | null;
    setReplyTarget: (r: Reply | null) => void;
    onAdded?: (reply: Reply) => void;
    handleAddChildReply: (rootId: string, r: Reply) => void;
    scrollTargetId?: string | null;
  }) {
    // 삭제된 댓글 전용 렌더링
    // if (reply.is_deleted) {
    //   return (
    //     <>
    //       {reply.children.length > 0 && (
    //         <div className="ml-10 mb-1 text-xs text-gray-400 italic select-none">
    //           삭제된 댓글의 답글 {reply.children.length}개
    //         </div>
    //       )}

    //       {reply.children.map(child => (
    //         <div key={child.id} className="ml-10">
    //           <ReplyNode
    //             reply={child}
    //             onReply={onReply}
    //             replyTarget={replyTarget}
    //             setReplyTarget={setReplyTarget}
    //             onAdded={onAdded}
    //             handleAddChildReply={handleAddChildReply}
    //             scrollTargetId={scrollTargetId}
    //           />
    //         </div>
    //       ))}
    //     </>
    //   );
    // }
    // 반드시 return 추가
    return (
      <div>
        <ReplyCard
          reply={{
            ...reply,
            stats: {
              ...reply.stats,
              comments: reply.commentCount ?? 0,
            },
          }}
          onReply={onReply}
          onLike={handleLikeReply}
          onDeleted={handleDeleteReply}
          highlight={scrollTargetId === reply.id}
        />

        {replyTarget?.id === reply.id && (
          <ReplyInput
            target={replyTarget}
            onCancel={() => setReplyTarget(null)}
            onAdded={newReply => {
              const rootId = reply.root_reply_id ?? reply.id;

              handleAddChildReply(rootId, {
                ...newReply,
                parent_reply_id: reply.id,
                root_reply_id: reply.root_reply_id ?? reply.id,
                created_at: new Date().toISOString(),
              });

              const root = tree.find(r => r.id === rootId);
              if (root) syncCommentCountToDB(root);

              setReplyTarget(null);
            }}
          />
        )}

        {reply.children.map(child => (
          <div key={child.id} className="ml-10">
            <ReplyNode
              reply={child}
              onReply={onReply}
              replyTarget={replyTarget}
              setReplyTarget={setReplyTarget}
              onAdded={onAdded}
              handleAddChildReply={handleAddChildReply}
              scrollTargetId={scrollTargetId}
            />
          </div>
        ))}
      </div>
    );
  }
}

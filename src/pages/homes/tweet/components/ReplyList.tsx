import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReportButton from '@/components/common/ReportButton';
import BlockButton from '@/components/common/BlockButton';

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
  liked?: boolean;
}

interface ReplyListProps {
  replies: Reply[];
  onDeleted?: (id: string) => void;
  // 알림/방금 단 댓글 등에서 스크롤 타겟으로 쓸 id
  scrollTargetId?: string | null;
}

function ReplyCard({
  reply,
  onDeleted,
  highlight = false,
}: {
  reply: Reply;
  onDeleted?: (id: string) => void;
  highlight?: boolean;
}) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reply.stats.likes);
  const [showMenu, setShowMenu] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // 하이라이트 상태 (잠깐 색 들어왔다 빠지는 용도)
  const [isHighlighted, setIsHighlighted] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);

  // highlight prop이 true일 때 잠깐 하이라이트
  useEffect(() => {
    if (highlight) {
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      setIsHighlighted(false);
    }
  }, [highlight]);

  // 로그인한 사용자의 profiles.id 가져오기
  useEffect(() => {
    const loadProfileId = async () => {
      if (!authUser) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      if (!error && data) setProfileId(data.id);
    };
    loadProfileId();
  }, [authUser]);

  // 내가 이미 좋아요 눌렀는지 확인 (user_id = profileId 기준)
  useEffect(() => {
    if (!authUser || !profileId) return;

    const loadLiked = async () => {
      try {
        const { data, error } = await supabase
          .from('tweet_replies_likes')
          .select('id')
          .eq('reply_id', reply.id)
          .eq('user_id', profileId)
          .maybeSingle();

        if (!error && data) {
          setLiked(true);
        }
      } catch (err) {
        console.error('댓글 좋아요 상태 조회 실패:', err);
      }
    };

    loadLiked();
  }, [authUser, profileId, reply.id]);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 외부 클릭 시 다이얼로그 닫기
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setShowDialog(false);
      }
    };
    if (showDialog) document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [showDialog]);

  // 댓글 삭제
  const handleDelete = async () => {
    if (!profileId) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const { error } = await supabase
        .from('tweet_replies')
        .delete()
        .eq('id', reply.id)
        .eq('author_id', profileId);

      if (error) throw error;

      toast.success('댓글이 삭제되었습니다.');
      setShowDialog(false);
      setShowMenu(false);
      onDeleted?.(reply.id);
    } catch (err: any) {
      console.error('댓글 삭제 실패:', err.message);
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  // 댓글 좋아요 토글 (user_id = profileId 기준)
  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!authUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (!profileId) {
      toast.error('프로필 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      const { data: existing, error: existingError } = await supabase
        .from('tweet_replies_likes')
        .select('id')
        .eq('reply_id', reply.id)
        .eq('user_id', profileId)
        .maybeSingle();

      if (existingError) {
        console.error('좋아요 조회 실패:', existingError.message);
      }

      if (existing) {
        const { error: deleteError } = await supabase
          .from('tweet_replies_likes')
          .delete()
          .eq('id', existing.id);

        if (deleteError) throw deleteError;

        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        return;
      }

      const { error: insertError } = await supabase.from('tweet_replies_likes').insert({
        reply_id: reply.id,
        user_id: profileId,
      });

      if (insertError) throw insertError;

      setLiked(true);
      setLikeCount(prev => prev + 1);
    } catch (err: any) {
      console.error('좋아요 처리 실패:', err.message);
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const safeContent = DOMPurify.sanitize(reply.content, {
    ADD_TAGS: ['iframe', 'video', 'source', 'img'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
  });

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${encodeURIComponent(reply.user.name)}`);
  };

  // 본인 댓글 여부 (profiles.id 비교 불가하므로 user_id 비교)
  const isMyReply = authUser?.id === reply.user.username;

  // 공통 카드 스타일
  const baseCardClasses =
    'border-b border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors';

  // 하이라이트/일반 배경
  const containerClasses = `${baseCardClasses} ${
    isHighlighted ? 'bg-primary/15 dark:bg-primary/25' : 'bg-white dark:bg-background'
  }`;

  return (
    <div id={`reply-${reply.id}`} className={containerClasses}>
      <div className="flex space-x-3">
        <div onClick={handleAvatarClick} className="cursor-pointer">
          <Avatar>
            <AvatarImage src={reply.user.avatar || '/default-avatar.svg'} alt={reply.user.name} />
            <AvatarFallback>{reply.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          {/* 상단 + 더보기 버튼 */}
          <div className="flex items-start justify-between relative" ref={menuRef}>
            <div className="flex items-center space-x-1 flex-wrap">
              <span
                className="font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer truncate"
                onClick={handleAvatarClick}
              >
                {reply.user.name}
              </span>
              <span className="text-gray-500 dark:text-gray-400">·</span>
              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                {reply.timestamp}
              </span>
            </div>

            {/* 더보기 버튼 */}
            <button
              onClick={e => {
                e.stopPropagation();
                setShowMenu(prev => !prev);
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition"
            >
              <i className="ri-more-2-fill text-gray-500 dark:text-gray-400 text-lg" />
            </button>

            {/* 더보기 메뉴 */}
            {showMenu && (
              <div className="absolute right-0 top-8 w-36 bg-white dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg dark:shadow-black/30 py-2 z-50">
                {isMyReply ? (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowDialog(true);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 text-red-600 dark:text-red-400 flex items-center gap-2"
                  >
                    <i className="ri-delete-bin-line" />
                    <span>삭제</span>
                  </button>
                ) : (
                  <>
                    <ReportButton onClose={() => setShowMenu(false)} />
                    <BlockButton
                      isBlocked={isBlocked}
                      onToggle={() => setIsBlocked(prev => !prev)}
                      onClose={() => setShowMenu(false)}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* 본문 */}
          <div
            className="mt-1 text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />

          {/* 액션 버튼 */}
          <div className="flex items-center justify-start gap-7 max-w-md mt-3 text-gray-500 dark:text-gray-400">
            {/* Reply */}
            <button className="flex items-center space-x-2 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-primary/10 transition-colors">
                <i className="ri-chat-3-line text-lg" />
              </div>
              <span className="text-sm">{reply.stats.comments}</span>
            </button>

            {/* Like */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                liked ? 'text-red-500' : 'hover:text-red-500'
              }`}
              onClick={toggleLike}
            >
              <div className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-primary/10 transition-colors">
                <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`} />
              </div>
              <span className="text-sm">{likeCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 삭제 다이얼로그 */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[1000]">
          <div
            ref={dialogRef}
            className="bg-white dark:bg-secondary rounded-2xl p-6 w-[90%] max-w-sm shadow-lg relative"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              이 댓글을 삭제하시겠어요?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              삭제한 댓글은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReplyList({ replies, onDeleted, scrollTargetId }: ReplyListProps) {
  if (!replies.length) {
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
          key={`${reply.id}-${scrollTargetId === reply.id ? 'highlight' : 'normal'}`}
          reply={reply}
          onDeleted={onDeleted}
          highlight={scrollTargetId === reply.id}
        />
      ))}
    </div>
  );
}

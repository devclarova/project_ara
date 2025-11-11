import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

interface Reply {
  id: string;
  tweetId: string;
  user: User;
  content: string;
  timestamp: string;
  stats: Stats;
}

interface ReplyListProps {
  replies: Reply[];
  onDeleted?: (id: string) => void; // ✅ 삭제 후 부모에 알림
}

function ReplyCard({ reply, onDeleted }: { reply: Reply; onDeleted?: (id: string) => void }) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [liked, setLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ✅ 로그인한 사용자의 profiles.id 가져오기
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

  // ✅ 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ 외부 클릭 시 다이얼로그 닫기
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setShowDialog(false);
      }
    };
    if (showDialog) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showDialog]);

  // ✅ 댓글 삭제
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
        .eq('author_id', profileId); // ✅ DB 구조에 맞게 수정

      if (error) throw error;

      toast.success('댓글이 삭제되었습니다.');
      setShowDialog(false);
      setShowMenu(false);
      onDeleted?.(reply.id); // 부모에게 알림
    } catch (err: any) {
      console.error('❌ 댓글 삭제 실패:', err.message);
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  const safeContent = DOMPurify.sanitize(reply.content, {
    ADD_TAGS: ['iframe', 'video', 'source', 'img'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
  });

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/finalhome/user/${reply.user.name}`);
  };

  // ✅ 본인 댓글 여부 (profiles.id 비교 불가하므로 user_id 비교)
  const isMyReply = authUser?.id === reply.user.username;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-primary/10 transition-colors bg-white dark:bg-background">
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
              {/* <span className="text-gray-500 dark:text-gray-400 truncate">
                @{reply.user.username}
              </span> */}
              <span className="text-gray-500 dark:text-gray-400">·</span>
              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                {reply.timestamp}
              </span>
            </div>

            {/* ✅ 더보기 버튼 */}
            <button
              onClick={e => {
                e.stopPropagation();
                setShowMenu(prev => !prev);
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition"
            >
              <i className="ri-more-2-fill text-gray-500 dark:text-gray-400 text-lg" />
            </button>

            {/* ✅ 더보기 메뉴 */}
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
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
                    삭제 불가
                  </p>
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
          <div className="flex items-center justify-between max-w-md mt-3 text-gray-500 dark:text-gray-400">
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
              onClick={e => {
                e.stopPropagation();
                setLiked(!liked);
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-primary/10 transition-colors">
                <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`} />
              </div>
              <span className="text-sm">{reply.stats.likes + (liked ? 1 : 0)}</span>
            </button>

            {/* Views */}
            <button className="flex items-center space-x-2 hover:text-green-500 dark:hover:text-emerald-400 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-primary/10 transition-colors">
                <i className="ri-eye-line text-lg" />
              </div>
              <span className="text-sm">{reply.stats.views}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ✅ 삭제 다이얼로그 */}
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

export default function ReplyList({ replies, onDeleted }: ReplyListProps) {
  if (replies.length === 0) {
    return (
      <div className="border-b border-gray-200 p-8 text-center text-gray-500 dark:text-gray-400">
        <i className="ri-chat-3-line text-4xl mb-2 block" />
        <p>No replies yet</p>
        <p className="text-sm mt-1">Be the first to reply!</p>
      </div>
    );
  }

  return (
    <div>
      {replies.map(reply => (
        <ReplyCard key={reply.id} reply={reply} onDeleted={onDeleted} />
      ))}
    </div>
  );
}

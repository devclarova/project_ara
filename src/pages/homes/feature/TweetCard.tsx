// src/pages/homes/feature/TweetCard.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ReactCountryFlag from 'react-country-flag';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface User {
  name: string;
  username: string;
  avatar: string;
}

interface Stats {
  replies?: number;
  retweets?: number;
  likes?: number;
  views?: number;
  comments?: number;
  bookmarks?: number;
}

interface TweetCardProps {
  id: string;
  user: User;
  content: string;
  image?: string;
  timestamp: string;
  stats: Stats;
  onDeleted?: (id: string) => void;
}

export default function TweetCard({ id, user, content, image, timestamp, stats, onDeleted }: TweetCardProps) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(stats.likes ?? 0);
  const [profile, setProfile] = useState<{ id: string; nickname: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

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

  // ✅ 로그인된 유저의 프로필 정보 조회
  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname')
        .eq('user_id', authUser.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ 프로필 불러오기 실패:', error.message);
      } else {
        setProfile(data);
      }
    };
    loadProfile();
  }, [authUser]);

  // ✅ 트윗 삭제
  const handleDelete = async () => {
    if (!profile) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const { error } = await supabase
        .from('tweets')
        .delete()
        .eq('id', id)
        .eq('author_id', profile.id);
      if (error) throw error;

      toast.success('피드가 삭제되었습니다.');
      setShowDialog(false);
      setShowMenu(false);
      onDeleted?.(id); // ✅ 부모(Home)에 알림
    } catch (err: any) {
      console.error('❌ 삭제 실패:', err.message);
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount(prev => (liked ? Math.max(prev - 1, 0) : prev + 1));
  };

  const handleCardClick = () => navigate(`/finalhome/${id}`);
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/finalhome/user/${user.name}`);
  };

  const safeContent = DOMPurify.sanitize(content);

  // ✅ 본인 게시물인지 판별
  const isMyPost = profile?.nickname === user.name;

  return (
    <div
      className="border-b border-gray-200 px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer relative"
      onClick={handleCardClick}
    >
      <div className="flex space-x-3">
        {/* 아바타 */}
        <div onClick={handleAvatarClick}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatar || '/default-avatar.svg'} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          {/* 상단 */}
          <div className="flex items-start justify-between relative" ref={menuRef}>
            <div className="flex items-center space-x-1 flex-wrap">
              <span
                className="font-bold text-gray-900 hover:underline cursor-pointer truncate"
                onClick={e => {
                  e.stopPropagation();
                  navigate(`/finalhome/user/${user.name}`);
                }}
              >
                {user.name}
              </span>
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                <ReactCountryFlag countryCode="KR" svg style={{ fontSize: '1em' }} />
              </Badge>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500">{timestamp}</span>
            </div>

            {/* ✅ 더보기 버튼 */}
            <button
              onClick={e => {
                e.stopPropagation();
                setShowMenu(prev => !prev);
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              <i className="ri-more-2-fill text-gray-500 text-lg"></i>
            </button>

            {/* ✅ 더보기 메뉴 */}
            {showMenu && (
              <div className="absolute right-0 top-8 w-36 bg-white border border-gray-200 rounded-2xl shadow-lg py-2 z-50">
                {/* ✅ 본인 게시물일 때만 삭제 버튼 표시 */}
                {isMyPost ? (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowDialog(true);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600 flex items-center gap-2"
                  >
                    <i className="ri-delete-bin-line"></i>
                    <span>삭제</span>
                  </button>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">삭제 불가</p>
                )}
              </div>
            )}
          </div>

          {/* 본문 */}
          <div
            className="mt-1 text-gray-900 text-[15px] leading-snug whitespace-pre-line break-words"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />

          {image && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
              <img src={image} alt="tweet" className="w-full h-auto object-cover" />
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between max-w-md mt-3 text-gray-500">
            <button
              className="flex items-center space-x-2 hover:text-blue-500"
              onClick={e => {
                e.stopPropagation();
                navigate(`/finalhome/${id}`);
              }}
            >
              <i className="ri-chat-3-line text-lg"></i>
              <span className="text-sm">{stats.replies ?? 0}</span>
            </button>

            <button
              className={`flex items-center space-x-2 ${liked ? 'text-red-500' : 'hover:text-red-500'}`}
              onClick={handleLikeToggle}
            >
              <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`}></i>
              <span className="text-sm">{likeCount}</span>
            </button>

            <button className="flex items-center space-x-2 hover:text-green-500">
              <i className="ri-eye-line text-lg"></i>
              <span className="text-sm">{stats.views ?? 0}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 삭제 다이얼로그 */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[1000]">
          <div
            ref={dialogRef}
            className="bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-lg relative"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-2">이 피드를 삭제하시겠어요?</h2>
            <p className="text-sm text-gray-600 mb-6">
              삭제한 피드는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
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

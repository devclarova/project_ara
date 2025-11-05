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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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
}

export default function TweetCard({ id, user, content, image, timestamp, stats }: TweetCardProps) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(stats.likes ?? 0);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // ✅ 로그인된 유저의 profiles.id 조회
  useEffect(() => {
    const loadProfileId = async () => {
      if (!authUser) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .single();
      if (error) console.error('❌ 프로필 ID 조회 실패:', error.message);
      else setProfileId(data.id);
    };
    loadProfileId();
  }, [authUser]);

  // ✅ 초기 좋아요 여부 확인
  useEffect(() => {
    const checkLike = async () => {
      if (!profileId) return;
      const { data, error } = await supabase
        .from('tweet_likes')
        .select('id')
        .eq('tweet_id', id)
        .eq('user_id', profileId)
        .maybeSingle();
      if (error) console.error('❌ checkLike error:', error.message);
      setLiked(!!data);
    };
    checkLike();
  }, [id, profileId]);

  // ✅ 좋아요 토글
  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authUser || !profileId) return alert('로그인이 필요합니다.');

    if (!liked) {
      const { error } = await supabase.from('tweet_likes').insert({
        tweet_id: id,
        user_id: profileId,
      });
      if (error && error.code !== '23505') {
        console.error('❌ 좋아요 추가 실패:', error.message);
        return;
      }
      setLiked(true);
      setLikeCount(prev => prev + 1);
    } else {
      const { error } = await supabase
        .from('tweet_likes')
        .delete()
        .match({ tweet_id: id, user_id: profileId });
      if (error) {
        console.error('❌ 좋아요 제거 실패:', error.message);
        return;
      }
      setLiked(false);
      setLikeCount(prev => Math.max(prev - 1, 0));
    }
  };

  const handleCardClick = () => {
    navigate(`/finalhome/${id}`);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/finalhome/user/${user.name}`);
  };

  const safeContent = DOMPurify.sanitize(content);

  return (
    <div
      className="border-b border-gray-200 px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer relative"
      onClick={handleCardClick}
    >
      <div className="flex space-x-3">
        {/* 아바타 */}
        <div onClick={handleAvatarClick} className="cursor-pointer">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatar || '/default-avatar.svg'} alt={user.name} />
            <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
        </div>

        {/* 본문 */}
        <div className="flex-1 min-w-0">
          {/* 상단: 이름 + 더보기 버튼 */}
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
                <ReactCountryFlag
                  countryCode="KR"
                  svg
                  style={{
                    fontSize: '1em',
                    lineHeight: '1em',
                    verticalAlign: 'middle',
                  }}
                />
              </Badge>

              <span className="text-gray-500">·</span>
              <span className="text-gray-500 flex-shrink-0">{timestamp}</span>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      onClick={e => e.stopPropagation()}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600 flex items-center gap-2 transition-colors"
                    >
                      <i className="ri-delete-bin-line"></i>
                      <span>삭제</span>
                    </button>
                  </AlertDialogTrigger>

                  <AlertDialogContent onClick={e => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>이 피드를 삭제하시겠어요?</AlertDialogTitle>
                      <AlertDialogDescription>
                        삭제한 피드는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setShowMenu(false);
                          toast.success('피드가 삭제되었습니다.');
                          // TODO: 실제 Supabase 삭제 로직 추가 가능
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        삭제하기
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
              </div>
            )}
          </div>

          {/* 본문 내용 */}
          <div
            className="mt-1 text-gray-900 text-[15px] leading-snug whitespace-pre-line break-words"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />

          {/* 이미지 */}
          {image && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
              <img src={image} alt="Tweet image" className="w-full h-auto object-cover" />
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between max-w-md mt-3 text-gray-500">
            {/* Reply */}
            <button
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors group"
              onClick={e => {
                e.stopPropagation();
                navigate(`/finalhome/${id}`);
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <i className="ri-chat-3-line text-lg"></i>
              </div>
              <span className="text-sm">{stats.replies ?? 0}</span>
            </button>

            {/* Like */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${
                liked ? 'text-red-500' : 'hover:text-red-500'
              }`}
              onClick={handleLikeToggle}
            >
              <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors">
                <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`}></i>
              </div>
              <span className="text-sm">{likeCount}</span>
            </button>

            {/* Views */}
            <button className="flex items-center space-x-2 hover:text-green-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <i className="ri-eye-line text-lg"></i>
              </div>
              <span className="text-sm">{stats.views ?? 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactCountryFlag from 'react-country-flag';
import { Badge } from '@/components/ui/badge';

interface User {
  name: string;
  username: string;
  avatar: string;
}

interface Stats {
  replies?: number;
  likes?: number;
  views?: number;
}

interface TweetCardProps {
  id: string;
  user: User;
  content: string;
  image?: string | string[];
  timestamp: string;
  stats: Stats;
  onDeleted?: (id: string) => void;
}

export default function TweetCard({
  id,
  user,
  content,
  image,
  timestamp,
  stats,
  onDeleted,
}: TweetCardProps) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [liked, setLiked] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [contentImages, setContentImages] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const hasChecked = useRef(false);
  const images = Array.isArray(image) ? image : image ? [image] : [];

  /** ✅ 로그인한 프로필 ID 로드 */
  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('❌ 프로필 로드 실패:', error.message);
      } else if (data) {
        setProfileId(data.id);
      }
    };
    loadProfile();
  }, [authUser]);

  /** ✅ 내가 이미 좋아요한 트윗인지 확인 */
  useEffect(() => {
    if (!profileId || hasChecked.current) return;
    hasChecked.current = true;

    (async () => {
      const { data, error } = await supabase
        .from('tweet_likes')
        .select('id')
        .eq('tweet_id', id)
        .eq('user_id', profileId)
        .maybeSingle();

      if (error) {
        console.error('❌ 좋아요 상태 확인 실패:', error.message);
        return;
      }
      if (data) setLiked(true);
    })();
  }, [profileId, id]);

  /** ✅ 외부 클릭 시 메뉴 닫기 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** ✅ 외부 클릭 시 다이얼로그 닫기 */
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setShowDialog(false);
      }
    };
    if (showDialog) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showDialog]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const imgs = Array.from(doc.querySelectorAll('img')).map(img => img.src);

    setContentImages(imgs);
    setCurrentImage(0); // 트윗 바뀔 때 첫 이미지로 리셋
  }, [content]);

  // 🔥 prop 으로 온 image(string | string[]) → 배열로 정규화
  const propImages = Array.isArray(image) ? image : image ? [image] : [];

  // 🔥 최종 슬라이드에 사용할 이미지 목록 (prop 우선, 없으면 content에서 추출한 것)
  const allImages = propImages.length > 0 ? propImages : contentImages;

  // 🔥 본문에서는 img 태그는 제거 (슬라이드에서만 보여줄 거라)
  const safeContent = DOMPurify.sanitize(content, {
    FORBID_TAGS: ['img'],
  });

  /** ✅ 좋아요 토글 */
  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profileId) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    const optimisticLiked = !liked;
    setLiked(optimisticLiked);

    try {
      if (optimisticLiked) {
        const { error } = await supabase
          .from('tweet_likes')
          .insert([{ tweet_id: id, user_id: profileId }]);
        if (error && error.code !== '23505') throw error;
      } else {
        const { error } = await supabase
          .from('tweet_likes')
          .delete()
          .eq('tweet_id', id)
          .eq('user_id', profileId);
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('❌ 좋아요 토글 실패:', err.message);
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
      setLiked(!optimisticLiked);
    }
  };

  /** ✅ 트윗 삭제 */
  const handleDelete = async () => {
    if (!profileId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    try {
      const { error } = await supabase
        .from('tweets')
        .delete()
        .eq('id', id)
        .eq('author_id', profileId);

      if (error) throw error;
      toast.success('피드가 삭제되었습니다.');
      setShowDialog(false);
      setShowMenu(false);
      onDeleted?.(id);
    } catch (err: any) {
      console.error('❌ 삭제 실패:', err.message);
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCardClick = () => navigate(`/finalhome/${id}`);
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/finalhome/user/${user.name}`);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage(prev => {
      if (prev <= 0) return 0; // 맨 앞이면 더 이상 안 넘어감
      return prev - 1;
    });
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage(prev => {
      const lastIndex = allImages.length - 1;
      if (prev >= lastIndex) return lastIndex; // 맨 뒤이면 더 이상 안 넘어감
      return prev + 1;
    });
  };

  const isMyTweet = authUser?.id === user.username;

  return (
    <div
      className="relative px-4 py-3 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-background hover:bg-gray-50/50 dark:hover:bg-primary/10"
      onClick={handleCardClick}
    >
      <div className="flex space-x-3">
        {/* 아바타 */}
        <div onClick={handleAvatarClick}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatar || '/default-avatar.svg'} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        {/* 본문 */}
        <div className="flex-1 min-w-0">
          {/* 상단 영역 (이름 + 시간 + 더보기 버튼) */}
          <div className="flex items-start justify-between relative" ref={menuRef}>
            <div className="flex items-center space-x-1 flex-wrap">
              <span
                className="font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
                onClick={handleAvatarClick}
              >
                {user.name}
              </span>
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                <ReactCountryFlag countryCode="KR" svg style={{ fontSize: '1em' }} />
              </Badge>

              <span className="text-gray-500 dark:text-gray-400">·</span>
              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{timestamp}</span>
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
                {isMyTweet ? (
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

          {/* 본문 내용 */}
          <div
            className="mt-1 text-gray-900 dark:text-gray-100 text-[15px] leading-snug whitespace-pre-line break-words"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />

          {/* 이미지 슬라이드 + 균일 사이즈 */}
          {allImages.length > 0 && (
            <div
              className="mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 300,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                }}
              >
                <img
                  src={allImages[currentImage]}
                  alt={`Tweet image ${currentImage + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {allImages.length > 1 && (
                  <>
                    {/* 이전 버튼: 첫 이미지가 아닐 때만 표시 */}
                    {currentImage > 0 && (
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
                      >
                        ‹
                      </button>
                    )}

                    {/* 다음 버튼: 마지막 이미지가 아닐 때만 표시 */}
                    {currentImage < allImages.length - 1 && (
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
                      >
                        ›
                      </button>
                    )}

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {allImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={e => {
                            e.stopPropagation();
                            setCurrentImage(idx);
                          }}
                          className={`w-2 h-2 rounded-full ${
                            idx === currentImage ? 'bg-white' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ✅ 액션 버튼 */}
          <div className="flex items-center justify-between max-w-md mt-3 text-gray-500 dark:text-gray-400">
            {/* 댓글 버튼 */}
            <button
              className="flex items-center space-x-2 hover:text-blue-500 dark:hover:text-blue-400"
              onClick={e => {
                e.stopPropagation();
                navigate(`/finalhome/${id}`);
              }}
            >
              <div className="p-2 rounded-full transition-colors">
                <i className="ri-chat-3-line text-lg" />
              </div>
              <span className="text-sm">{stats.replies ?? 0}</span>
            </button>

            {/* 좋아요 버튼 */}
            <button
              className={`flex items-center space-x-2 ${
                liked ? 'text-red-500' : 'hover:text-red-500'
              } transition-colors`}
              onClick={handleLikeToggle}
            >
              <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`} />
              <span className="text-sm">{stats.likes ?? 0}</span>
            </button>

            {/* 조회수 버튼 */}
            <button className="flex items-center space-x-2 hover:text-green-500 dark:hover:text-green-400">
              <i className="ri-eye-line text-lg" />
              <span className="text-sm">{stats.views ?? 0}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ✅ 삭제 확인 다이얼로그 */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[1000]">
          <div
            ref={dialogRef}
            className="bg-white dark:bg-secondary rounded-2xl p-6 w-[90%] max-w-sm shadow-lg relative"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              이 게시글을 삭제하시겠어요?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              삭제한 게시글은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?
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

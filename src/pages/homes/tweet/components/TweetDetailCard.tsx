import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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

interface Tweet {
  id: string;
  user: User;
  content: string;
  image?: string | string[];
  timestamp: string;
  stats: Stats;
}

interface TweetDetailCardProps {
  tweet: Tweet;
}

export default function TweetDetailCard({ tweet }: TweetDetailCardProps) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.stats.likes || 0);
  const [contentImages, setContentImages] = useState<string[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);

  // ✅ 여기서 user가 아니라 tweet.user 사용해야 함
  const handleAvatarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    // 닉네임 기반 프로필
    navigate(`/profile/${encodeURIComponent(tweet.user.name)}`);
  };

  const normalizedStats = {
    replies: tweet.stats.replies || tweet.stats.comments || 0,
    retweets: tweet.stats.retweets || 0,
    likes: tweet.stats.likes || 0,
    views: tweet.stats.views || 0,
  };

  useEffect(() => {
    const loadProfileId = async () => {
      if (!authUser) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id) // auth.users.id → profiles.id
        .maybeSingle();

      if (!error && data) setProfileId(data.id);
    };

    loadProfileId();
  }, [authUser]);

  // 🔥 content에서 <img> 태그 src 추출
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(tweet.content, 'text/html');

    const imgs = Array.from(doc.querySelectorAll('img'))
      .map(img => img.src)
      .filter(Boolean);

    setContentImages(imgs);
  }, [tweet.content]);

  // 🔥 prop 으로 온 image(string | string[]) → 배열로 정규화
  const propImages = Array.isArray(tweet.image) ? tweet.image : tweet.image ? [tweet.image] : [];

  // 🔥 최종적으로 사용할 이미지 목록 (prop 우선, 없으면 contentImages)
  const allImages = propImages.length > 0 ? propImages : contentImages;

  // 🔥 본문에서는 img 태그 제거 (이미지는 아래 그리드에서만 보여줄 것)
  const safeContent = DOMPurify.sanitize(tweet.content, {
    ADD_TAGS: ['iframe', 'video', 'source'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
    FORBID_TAGS: ['img'],
  });

  // 🔥 디테일 그리드: 최대 6장 보여주고, 나머지는 +N
  const MAX_GRID = 6;
  const hasMoreImages = allImages.length > MAX_GRID;
  const visibleImages = hasMoreImages ? allImages.slice(0, MAX_GRID) : allImages;

  // 🔥 텍스트가 실제로 있는지 확인 (태그/공백 제거 후)
  const hasText = !!safeContent
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  // ✅ 내가 이 트윗에 좋아요 눌렀는지 초기 로드
  useEffect(() => {
    if (!authUser || !profileId) return;

    const loadLiked = async () => {
      try {
        const { data, error } = await supabase
          .from('tweet_likes')
          .select('id')
          .eq('tweet_id', tweet.id)
          .eq('user_id', profileId) // ✅ profiles.id 기준
          .maybeSingle();

        if (!error && data) {
          setLiked(true);
        }
      } catch (err) {
        console.error('❌ 트윗 좋아요 상태 조회 실패:', err);
      }
    };

    loadLiked();
  }, [authUser, profileId, tweet.id]);

  // ✅ 상세에서 트윗 좋아요 토글
  const toggleTweetLike = async () => {
    if (!authUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (!profileId) {
      toast.error('프로필 정보를 불러오지 못했습니다.');
      return;
    }

    try {
      const { data: existing, error: existingError } = await supabase
        .from('tweet_likes')
        .select('id')
        .eq('tweet_id', tweet.id)
        .eq('user_id', profileId) // ✅ 동일 기준
        .maybeSingle();

      if (existingError) {
        console.error('❌ 트윗 좋아요 조회 실패:', existingError.message);
      }

      if (existing) {
        // 좋아요 취소
        const { error: deleteError } = await supabase
          .from('tweet_likes')
          .delete()
          .eq('id', existing.id);

        if (deleteError) throw deleteError;

        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        return;
      }

      // 새 좋아요
      const { error: insertError } = await supabase.from('tweet_likes').insert({
        tweet_id: tweet.id,
        user_id: profileId, // ✅ FK 맞게
      });

      if (insertError) throw insertError;

      setLiked(true);
      setLikeCount(prev => prev + 1);
    } catch (err: any) {
      console.error('❌ 트윗 좋아요 처리 실패:', err.message);
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-6 bg-white dark:bg-background">
      <div className="flex space-x-3">
        <div onClick={handleAvatarClick} className="cursor-pointer">
          <Avatar>
            <AvatarImage src={tweet.user.avatar || '/default-avatar.svg'} alt={tweet.user.name} />
            <AvatarFallback>{tweet.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          {/* User Info */}
          <div className="flex items-center space-x-1 flex-wrap">
            <span
              className="font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer truncate"
              onClick={handleAvatarClick}
            >
              {tweet.user.name}
            </span>
            {/* 필요하면 핸들(@username)도 표시 가능 */}
            {/* <span className="text-gray-500 dark:text-gray-400 truncate">
              @{tweet.user.username}
            </span> */}
          </div>
        </div>
      </div>

      {/* Tweet Content */}
      <div className="mt-4">
        {hasText && (
          <div
            className="text-gray-900 dark:text-gray-100 text-xl leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        )}

        {/* 이미지 그리드 */}
        {allImages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
            {visibleImages.map((src, idx) => {
              const isLastSlot = hasMoreImages && idx === visibleImages.length - 1;

              return (
                <div
                  key={src + idx}
                  className="relative w-full aspect-[4/3] overflow-hidden bg-black/5 dark:bg-black/20"
                >
                  <img src={src} alt={`이미지 ${idx + 1}`} className="w-full h-full object-cover" />

                  {isLastSlot && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        +{allImages.length - MAX_GRID}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="mt-4 text-gray-500 dark:text-gray-400 text-sm">{tweet.timestamp}</div>

      {/* Stats + 액션 버튼 (댓글/좋아요/조회수) */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-start gap-8 text-sm text-gray-500 dark:text-gray-400">
          {/* 댓글 수 (클릭 동작은 나중에 붙여도 되고 지금은 카운트만) */}
          <button className="flex items-center space-x-2 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-primary/10 dark:group-hover:bg-primary/15 transition-colors">
              <i className="ri-chat-3-line text-lg" />
            </div>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {normalizedStats.replies}
            </span>
          </button>

          {/* 좋아요 토글 */}
          <button
            className={`flex items-center space-x-2 transition-colors group ${
              liked ? 'text-red-500' : 'hover:text-red-500'
            }`}
            onClick={toggleTweetLike}
          >
            <div className="p-2 rounded-full group-hover:bg-primary/10 dark:group-hover:bg-primary/15 transition-colors">
              <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`}></i>
            </div>
            <span className="text-sm text-gray-900 dark:text-gray-100">{likeCount}</span>
          </button>

          {/* 조회수 */}
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-full">
              <i className="ri-eye-line text-lg" />
            </div>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {normalizedStats.views}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

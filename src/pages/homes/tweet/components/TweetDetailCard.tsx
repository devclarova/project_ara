import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import DOMPurify from 'dompurify';
import ImageSlider from './ImageSlider';
import ModalImageSlider from './ModalImageSlider';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import TranslateButton from '@/components/common/TranslateButton';

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
  replyCount: number; // ✅ 상세 페이지에서 내려주는 실시간 댓글 수
}

export default function TweetDetailCard({ tweet, replyCount }: TweetDetailCardProps) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.stats.likes || 0);
  const [contentImages, setContentImages] = useState<string[]>([]);
  const [direction, setDirection] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [translated, setTranslated] = useState<string>('');
    
  const [authorCountryFlagUrl, setAuthorCountryFlagUrl] = useState<string | null>(null);
  const [authorCountryName, setAuthorCountryName] = useState<string | null>(null);
  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(-1);
  };

  const handleAvatarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    navigate(`/profile/${encodeURIComponent(tweet.user.name)}`);
  };

  // ✅ replies 는 외부에서 받은 값 우선 사용
  const normalizedStats = {
    replies:
      typeof replyCount === 'number'
        ? replyCount
        : tweet.stats.replies || tweet.stats.comments || 0,
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
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!error && data) setProfileId(data.id);
    };

    loadProfileId();
  }, [authUser]);

  // 작성자 국가 정보
  useEffect(() => {
    const fetchAuthorCountry = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('country')
          .eq('user_id', tweet.user.username)
          .maybeSingle();

        if (profileError) {
          console.error('작성자 프로필(country) 로드 실패:', profileError.message);
          return;
        }

        if (!profile || !profile.country) {
          setAuthorCountryFlagUrl(null);
          setAuthorCountryName(null);
          return;
        }

        const { data: country, error: countryError } = await supabase
          .from('countries')
          .select('name, flag_url')
          .eq('id', profile.country)
          .maybeSingle();

        if (countryError) {
          console.error('작성자 국가 정보 로드 실패:', countryError.message);
          return;
        }

        if (!country) {
          setAuthorCountryFlagUrl(null);
          setAuthorCountryName(null);
          return;
        }

        setAuthorCountryFlagUrl(country.flag_url ?? null);
        setAuthorCountryName(country.name ?? null);
      } catch (err) {
        console.error('작성자 국기 정보 로드 중 예외:', err);
      }
    };

    fetchAuthorCountry();
  }, [tweet.user.username]);

  // content에서 <img> 태그 src 추출
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(tweet.content, 'text/html');

    const imgs = Array.from(doc.querySelectorAll('img'))
      .map(img => img.src)
      .filter(Boolean);

    setContentImages(imgs);
  }, [tweet.content]);

  const propImages = Array.isArray(tweet.image) ? tweet.image : tweet.image ? [tweet.image] : [];
  const allImages = propImages.length > 0 ? propImages : contentImages;

  const safeContent = DOMPurify.sanitize(tweet.content, {
    ADD_TAGS: ['iframe', 'video', 'source'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
    FORBID_TAGS: ['img'],
  });

  const hasText = !!safeContent
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  // 택스트만 번역
  const plainTextContent = (() => {
    const tmp = document.createElement('div');
    tmp.innerHTML = safeContent;
    return tmp.textContent || tmp.innerText || '';
  })();

  // 내가 이 트윗에 좋아요 눌렀는지 초기 로드
  useEffect(() => {
    if (!authUser || !profileId) return;

    const loadLiked = async () => {
      try {
        const { data, error } = await supabase
          .from('tweet_likes')
          .select('id')
          .eq('tweet_id', tweet.id)
          .eq('user_id', profileId)
          .maybeSingle();

        if (!error && data) {
          setLiked(true);
        }
      } catch (err) {
        console.error('트윗 좋아요 상태 조회 실패:', err);
      }
    };

    loadLiked();
  }, [authUser, profileId, tweet.id]);

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
        .eq('user_id', profileId)
        .maybeSingle();

      if (existingError) {
        console.error('트윗 좋아요 조회 실패:', existingError.message);
      }

      if (existing) {
        const { error: deleteError } = await supabase
          .from('tweet_likes')
          .delete()
          .eq('id', existing.id);

        if (deleteError) throw deleteError;

        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        return;
      }

      const { error: insertError } = await supabase.from('tweet_likes').insert({
        tweet_id: tweet.id,
        user_id: profileId,
      });

      if (insertError) throw insertError;

      setLiked(true);
      setLikeCount(prev => prev + 1);
    } catch (err: any) {
      console.error('트윗 좋아요 처리 실패:', err.message);
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-6 bg-white dark:bg-background">
      <div className="flex items-start space-x-3">
        <button
          type="button"
          onClick={handleBackClick}
          className="mt-1 mr-1 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition-colors flex-shrink-0"
        >
          <i className="ri-arrow-left-line text-lg text-gray-700 dark:text-gray-100" />
        </button>

        <div onClick={handleAvatarClick} className="cursor-pointer flex-shrink-0">
          <Avatar>
            <AvatarImage src={tweet.user.avatar || '/default-avatar.svg'} alt={tweet.user.name} />
            <AvatarFallback>{tweet.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-x-2">
            <span
              className="font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer truncate"
              onClick={handleAvatarClick}
            >
              {tweet.user.name}
            </span>

            {authorCountryFlagUrl && (
              <Badge variant="secondary" className="flex items-center px-1 py-0.5">
                <img
                  src={authorCountryFlagUrl}
                  alt={authorCountryName ?? '국가'}
                  title={authorCountryName ?? ''}
                  className="w-4 h-4 rounded-sm object-cover"
                />
              </Badge>
            )}

            {!authorCountryFlagUrl && authorCountryName && (
              <Badge
                variant="secondary"
                className="flex items-center px-1 py-0.5"
                title={authorCountryName}
              >
                <span className="text-xs">🌐</span>
              </Badge>
            )}

            <span className="mx-1 text-gray-500 dark:text-gray-400">·</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{tweet.timestamp}</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {hasText && (
          <div
            className="text-gray-900 dark:text-gray-100 text-xl leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        )}

        {/* 번역 버튼 */}
        {plainTextContent.trim().length > 0 && (
          <div className="mt-2">
            <TranslateButton
              text={plainTextContent}
              contentId={`tweet_${tweet.id}`}
              setTranslated={setTranslated}
            />
          </div>
        )}

        {/* 번역 결과 */}
        {translated && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-sm whitespace-pre-line break-words">
            {translated}
          </div>
        )}

        {/* 이미지 슬라이더 */}
        {allImages.length > 0 && (
          <ImageSlider
            allImages={allImages}
            currentImage={currentImage}
            setCurrentImage={setCurrentImage}
            setDirection={setDirection}
            direction={direction}
            onOpen={index => {
              setModalIndex(index);
              setShowImageModal(true);
            }}
          />
        )}

        {showImageModal && (
          <div
            className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <ModalImageSlider
              allImages={allImages}
              modalIndex={modalIndex}
              setModalIndex={setModalIndex}
              onClose={() => setShowImageModal(false)}
            />
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-start gap-8 text-sm text-gray-500 dark:text-gray-400">
          {/* ✅ 댓글 수: 항상 replyCount 기반 */}
          <button className="flex items-center space-x-2 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-primary/10 dark:group-hover:bg-primary/15 transition-colors">
              <i className="ri-chat-3-line text-lg" />
            </div>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {normalizedStats.replies}
            </span>
          </button>

          {/* 좋아요 */}
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

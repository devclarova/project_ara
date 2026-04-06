/**
 * 확장형 피드 상세 카드(Extended Feed Detail Card):
 * - 목적(Why): 특정 트윗의 상세 정보, 미디어 자산, 사용자 상호작용 및 관리자 권한 제어 로직을 UI에 통합함
 * - 방법(How): sessionStorage를 활용해 뷰포트 전환 시 트래킹을 유지하고, SnsStore와 반응형으로 통계 무결성을 보장함
 */

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { SnsStore } from '@/lib/snsState';
import ReportButton from '@/components/common/ReportButton';
import BlockButton from '@/components/common/BlockButton';

import type { UIPost } from '@/types/sns';
import { formatDate, formatSmartDate } from '@/utils/dateUtils';
import { OnlineIndicator } from '@/components/common/OnlineIndicator';

interface TweetDetailCardProps {
  tweet: UIPost;
  replyCount: number; // 상세 페이지에서 내려주는 실시간 댓글 수
  onDeleted?: () => void;
  onReplyClick?: () => void;
}

export default function TweetDetailCard({ 
  tweet, 
  replyCount, 
  onDeleted, 
  onReplyClick,
}: TweetDetailCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user: authUser, isAdmin } = useAuth();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.stats.likes || 0);

  useEffect(() => {
    setLikeCount(tweet.stats.likes || 0);
  }, [tweet.stats.likes]);

  const [contentImages, setContentImages] = useState<string[]>([]);
  const [direction, setDirection] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [translated, setTranslated] = useState<string>('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Merged States
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [authorProfileId, setAuthorProfileId] = useState<string | null>(null);

  const [authorCountryFlagUrl, setAuthorCountryFlagUrl] = useState<string | null>(null);
  const [authorCountryName, setAuthorCountryName] = useState<string | null>(null);

  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sns-last-tweet-id', tweet.id);
    }
    // 단순히 /sns로 가는 것이 아니라 히스토리 상에서 뒤로 이동하여 스택을 깨끗하게 유지
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/sns', { replace: true });
    }
  };

  const isDeleted = tweet.user.username === 'anonymous';

  const handleAvatarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isDeleted) return;
    navigate(`/profile/${encodeURIComponent(tweet.user.name)}`);
  };

  // replies 는 외부에서 받은 값 우선 사용
  const normalizedStats = {
    replies:
      typeof replyCount === 'number'
        ? replyCount
        : tweet.stats.replies || 0,
    retweets: tweet.stats.retweets || 0,
    likes: tweet.stats.likes || 0,
    views: tweet.stats.views || 0,
  };

  // 세션 무결성 검증: 활성 인증 객체(Auth User)로부터 식별자를 추출하여 현재 사용자의 프로필 컨텍스트를 인메모리에 바인딩함
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

  // Load Author's Country & Profile ID (from Main)
  useEffect(() => {
    if (isDeleted) {
       setAuthorProfileId(null);
       setAuthorCountryFlagUrl(null);
       setAuthorCountryName(null);
       return;
    }
    const fetchAuthorCountry = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, country')
          .eq('user_id', tweet.user.username)
          .maybeSingle();

        if (profileError) {
          return;
        }

        if (profile) {
          setAuthorProfileId(profile.id);
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
        // Error handled silently
      }
    };

    fetchAuthorCountry();
  }, [tweet.user.username, isDeleted]);

  const isSoftDeleted = !!tweet.deleted_at;
  const isHiddenContent = tweet.is_hidden && !isAdmin;

  const displayContent = isSoftDeleted 
    ? '관리자에 의해 삭제된 메시지입니다.' 
    : isHiddenContent 
      ? '관리자에 의해 숨김 처리된 콘텐츠입니다.' 
      : tweet.content;

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
  const allImages = (isSoftDeleted || isHiddenContent) ? [] : propImages.length > 0 ? propImages : contentImages;

  const safeContent = DOMPurify.sanitize(displayContent, {
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
        // Error handled silently
      }
    };

    loadLiked();
  }, [authUser, profileId, tweet.id]);

  const toggleTweetLike = async () => {
    if (!authUser) {
      toast.error(t('auth.login_needed'));
      return;
    }

    if (!profileId) {
      toast.error(t('common.error_profile_loading'));
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
        // Error handled silently
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

      // 알림 생성 (본인 게시글이 아닐 때만, 작성자 없으면 스킵)
      if (authorProfileId && !isDeleted && authorProfileId !== profileId) {
        const payload = {
          type: 'like',
          content: '당신의 피드를 좋아합니다.',
          is_read: false,
          tweet_id: tweet.id,
          comment_id: null,
          sender_id: profileId,
          receiver_id: authorProfileId,
        };
        await supabase.from('notifications').insert(payload);
      }

      // SnsStore 동기화
      SnsStore.updateStats(tweet.id, {
        likes: (tweet.stats.likes || 0) + 1
      });
    } catch (err: any) {
      toast.error(t('common.error_like'));
    }
  };

  // 트랜잭션 수명 주기 관리: 게시물 삭제 요청 시 데이터베이스 레벨의 영구 삭제를 수행하고, SnsStore 및 내비게이션 스택을 즉시 동기화하여 UI 정합성을 확보함
  const handleDeleteTweet = async () => {
    if (!profileId) {
      toast.error(t('auth.login_needed'));
      return;
    }

    try {
      const { error } = await supabase
        .from('tweets')
        .delete()
        .eq('id', tweet.id)
        .eq('author_id', profileId);

      if (error) throw error;

      toast.success(t('tweet.delete_success', '피드가 삭제되었습니다.'));
      setShowDeleteDialog(false);
      setShowMenu(false);
      
      onDeleted?.();

      // SnsStore에서 해당 트윗 제거
      import('@/lib/snsState').then(({ SnsStore }) => {
        const currentFeed = SnsStore.getFeed();
        if (currentFeed) {
          SnsStore.setFeed(currentFeed.filter(t => t.id !== tweet.id));
        }
      });

      // 상세 페이지이므로 뒤로 이동
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/sns');
      }
    } catch (err: any) {
      toast.error(t('tweet.delete_failed', '삭제 중 오류가 발생했습니다.'));
    }
  };

  // 메뉴 밖 클릭 시 닫힘
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative border-b border-gray-200 dark:border-gray-700 px-4 py-6 bg-white dark:bg-background">
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={handleBackClick}
          className="mt-1 mr-1 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition-colors flex-shrink-0"
        >
          <i className="ri-arrow-left-line text-lg text-gray-700 dark:text-gray-100" />
        </button>

        <div onClick={handleAvatarClick} className={`cursor-pointer flex-shrink-0 relative ${isDeleted ? 'cursor-default' : ''}`}>
          <Avatar>
            <AvatarImage src={tweet.user.avatar || '/default-avatar.svg'} alt={isDeleted ? t('deleted_user') : tweet.user.name} />
            <AvatarFallback>{isDeleted ? '?' : tweet.user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap">
            <div className="relative inline-flex items-center pr-2.5">
              <span
                className={`font-bold text-gray-900 dark:text-gray-100 truncate ${isDeleted ? 'cursor-default' : 'hover:underline cursor-pointer'}`}
                onClick={handleAvatarClick}
              >
                {isDeleted ? t('deleted_user') : tweet.user.name}
              </span>
              {!isDeleted && (
                <OnlineIndicator 
                  userId={tweet.user.id} 
                  size="sm" 
                  className="absolute -top-0.5 right-0 z-20 border-white dark:border-background border shadow-none"
                />
              )}
            </div>

            {authorCountryFlagUrl && !isDeleted && (
              <Badge variant="secondary" className="flex items-center px-1.5 py-0.5 h-5 ml-2">
                <img
                  src={authorCountryFlagUrl}
                  alt={authorCountryName ?? '국가'}
                  title={authorCountryName ?? ''}
                  className="w-5 h-3.5 rounded-[2px] object-cover"
                />
              </Badge>
            )}

            {!authorCountryFlagUrl && authorCountryName && (
              <Badge
                variant="secondary"
                className="flex items-center px-1 py-0.5 ml-2"
                title={authorCountryName}
              >
                <span className="text-xs">🌐</span>
              </Badge>
            )}

            <span className="mx-2 text-gray-500 dark:text-gray-400">·</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {formatSmartDate(tweet.timestamp)}
            </span>
          </div>
        </div>
        <div className="relative ml-auto" ref={menuRef}>
          <button
            onClick={e => {
              e.stopPropagation();
              setShowMenu(prev => !prev);
            }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition"
          >
            <i className="ri-more-2-fill text-gray-500 dark:text-gray-400 text-lg" />
          </button>
          
          {showMenu && (
            <div className="absolute right-3 top-8 min-w-[9rem] whitespace-nowrap bg-white dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg dark:shadow-black/30 py-2 z-50">
              {authUser?.id === tweet.user.username ? (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 text-red-600 dark:text-red-400 flex items-center gap-2"
                >
                  <i className="ri-delete-bin-line" />
                  {t('common.delete')}
                </button>
              ) : (
                <>
                  <ReportButton onClick={() => setShowMenu(false)} />
                  {authorProfileId && (
                    <BlockButton
                      targetProfileId={authorProfileId}
                      onClose={() => setShowMenu(false)}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[1000]">
          <div
            className="bg-white dark:bg-secondary rounded-2xl p-6 w-[90%] max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('tweet.delete_msg_title', '이 게시글을 삭제하시겠어요?')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {t('tweet.delete_msg_desc', '삭제한 게시글은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?')}
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteTweet}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        {/* 텍스트 + 번역 버튼 */}
        {hasText && (
          <div className="flex items-center gap-2">
            <div
              className={`text-xl leading-relaxed break-words whitespace-pre-line ${(isSoftDeleted || isHiddenContent) ? 'italic text-gray-500 opacity-60' : 'text-gray-900 dark:text-gray-100'}`}
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />
            {/* 번역 버튼 */}
            {plainTextContent.trim().length > 0 && (
              <TranslateButton
                text={plainTextContent}
                contentId={`tweet_${tweet.id}`}
                setTranslated={setTranslated}
                size="sm"
              />
            )}
          </div>
        )}

        {/* 번역 결과 */}
        {translated && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-sm whitespace-pre-line break-words">
            {translated}
          </div>
        )}

        {/* 이미지 슬라이더 (Import path needs verification in actual project structure, assumed ../tweet/components as standard) */}
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
          <ModalImageSlider
            allImages={allImages}
            modalIndex={modalIndex}
            setModalIndex={setModalIndex}
            onClose={() => setShowImageModal(false)}
          />
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-start gap-8 text-sm text-gray-500 dark:text-gray-400">
          {/* 댓글 수: 항상 replyCount 기반 */}
          <button 
            className="flex items-center space-x-2 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group"
            onClick={onReplyClick}
          >
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DOMPurify from 'dompurify';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import ImageSlider from '../tweet/components/ImageSlider';
import ModalImageSlider from '../tweet/components/ModalImageSlider';
import TranslateButton from '@/components/common/TranslateButton';
import { useTranslation } from 'react-i18next';
import { type UITweet, type TweetStats, type TweetUser } from '@/types/sns';
import { SnsStore } from '@/lib/snsState';
import EditButton from '@/components/common/EditButton';
import ReportModal from '@/components/common/ReportModal';
import BlockButton from '@/components/common/BlockButton';
import { BanBadge } from '@/components/common/BanBadge';
import { formatSmartDate } from '@/utils/dateUtils';
import { OnlineIndicator } from '@/components/common/OnlineIndicator';
const SNS_LAST_TWEET_ID_KEY = 'sns-last-tweet-id';

function stripImgTags(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('img').forEach(img => img.remove());
  return doc.body.innerHTML;
}

function extractImageSrcs(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.querySelectorAll('img')).map(img => img.src);
}

interface TweetCardProps {
  id: string; // 댓글ID 또는 트윗ID
  tweetId?: string; // reply일 때 원본 트윗ID
  type?: 'tweet' | 'reply' | 'post'; // reply인지 tweet인지 구분
  user: TweetUser;
  content: string;
  image?: string | string[];
  timestamp: string;
  createdAt?: string;
  stats: TweetStats;
  onDeleted?: (id: string) => void;
  deletedAt?: string | null;
  dimmed?: boolean;
  onUnlike?: (id: string) => void;
  liked?: boolean;
  onClick?: (id: string) => void;
  onAvatarClick?: (username: string) => void;
  disableInteractions?: boolean;
  onUpdated?: (id: string, updates: Partial<UITweet>) => void;
}

export default function TweetCard({
  id,
  tweetId,
  type = 'tweet', // 기본값은 tweet
  user,
  content,
  image,
  timestamp,
  stats,
  onDeleted,
  deletedAt,
  dimmed = false,
  liked: initialLiked,
  onClick,
  onAvatarClick,
  disableInteractions = false,
  onUpdated,
}: TweetCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const { t, i18n } = useTranslation();
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [contentImages, setContentImages] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const hasChecked = useRef(false);
  const [direction, setDirection] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [translated, setTranslated] = useState<string>('');
  const [authorCountryFlagUrl, setAuthorCountryFlagUrl] = useState<string | null>(null);
  const [authorCountryName, setAuthorCountryName] = useState<string | null>(null);
  const [authorProfileId, setAuthorProfileId] = useState<string | null>(null);
  const [replyCount, setReplyCount] = useState(stats.replies ?? 0);
  const [likeCount, setLikeCount] = useState(stats.likes ?? 0);
  const [viewCount, setViewCount] = useState(stats.views ?? 0);
  // 글 줄수 제한 기능
  const [expanded, setExpanded] = useState(false);
  const [isLong, setIsLong] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  // prop 으로 온 image(string | string[]) → 배열로 정규화
  const propImages = Array.isArray(image) ? image : image ? [image] : [];
  
  const isSoftDeleted = !!deletedAt;

  // 최종 슬라이드에 사용할 이미지 목록 (prop 우선, 없으면 content에서 추출한 것)
  // Soft delete 되면 이미지는 숨김
  const allImages = isSoftDeleted ? [] : (propImages.length > 0 ? propImages : contentImages);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const dragInfo = useRef({
    startX: 0,
    startY: 0,
    moved: false,
  });
  
  // 글 수정
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(content); // 화면에 보여줄 값
  const [editText, setEditText] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const skipNextPropSync = useRef(false);

  // 본문에서는 img 태그는 제거 (슬라이드에서만 보여줌)
  // Soft Delete 되면 Placeholder 사용
  const displayContent = isSoftDeleted ? '관리자에 의해 삭제된 메시지입니다.' : currentContent;
  
  const safeContent = DOMPurify.sanitize(displayContent, {
    FORBID_TAGS: ['img'],
  });
  /** 로그인한 프로필 ID 로드 (트윗 삭제/좋아요용) */
  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      if (error) {
        console.error('프로필 로드 실패:', error.message);
      } else if (data) {
        setProfileId(data.id);
      }
    };
    loadProfile();
  }, [authUser]);
  /** 내가 이미 좋아요한 트윗인지 확인 (user_id = profiles.id 기준) */
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
        console.error('좋아요 상태 확인 실패:', error.message);
        return;
      }
      if (data) setLiked(true);
    })();
  }, [profileId, id]);
  /** 외부 클릭 시 메뉴 닫기 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  /** 외부 클릭 시 다이얼로그 닫기 */
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
    setCurrentImage(0);
  }, [content]);
  /** 트윗 작성자 국적 / 국기 + 작성자 profileId 로드 */
  useEffect(() => {
    const fetchAuthorCountry = async () => {
      if (!user.username || user.username === 'undefined') return;
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, country')
          .eq('user_id', user.username)
          .maybeSingle();
        if (profileError) {
          console.error('작성자 프로필(country) 로드 실패:', profileError.message);
          return;
        }
        if (!profile) {
          setAuthorCountryFlagUrl(null);
          setAuthorCountryName(null);
          setAuthorProfileId(null);
          return;
        }
        setAuthorProfileId(profile.id);
        if (!profile.country) {
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
  }, [user.username]);
  // props가 바뀔 때 동기화
  useEffect(() => {
    setReplyCount(stats.replies ?? 0);
  }, [stats.replies]);
  useEffect(() => {
    setLikeCount(stats.likes ?? 0);
  }, [stats.likes]);

  useEffect(() => {
    setViewCount(stats.views ?? 0);
  }, [stats.views]);
  // 댓글 삭제 실시간 반영
  useEffect(() => {
    const channel = supabase
      .channel(`tweet-${id}-replies`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tweet_replies',
          filter: `tweet_id=eq.${id}`,
        },
        () => {
          setReplyCount(prev => (prev > 0 ? prev - 1 : 0));
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tweet_replies',
          filter: `tweet_id=eq.${id}`,
        },
        () => {
          setReplyCount(prev => prev + 1);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);
  // 글 줄수 검사
  useEffect(() => {
    if (!contentRef.current) return;
    const lineHeight = 20; // 15px 폰트 기준 line-height 20px
    const maxHeight = lineHeight * 3; // 3줄 높이
    if (contentRef.current.scrollHeight > maxHeight) {
      setIsLong(true);
    }
  }, [safeContent]);
  // 이미지 모달 스크롤 잠금은 ModalImageSlider의 useBodyScrollLock hook에서 처리
  /** 좋아요 토글 (user_id = profiles.id 사용 + 알림 생성) */
  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disableInteractions) return;
    if (!authUser) {
      toast.error(t('auth.login_needed'));
      return;
    }
    if (!profileId) {
      toast.error(t('common.error_profile_missing'));
      return;
    }
    const likeUserId = profileId;
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    // 숫자도 낙관적 업데이트
    setLikeCount(prev => {
      const next = optimisticLiked ? prev + 1 : prev - 1;
      return next < 0 ? 0 : next;
    });
    try {
      if (optimisticLiked) {
        // 1) 좋아요 레코드 추가
        const { error: likeError } = await supabase
          .from('tweet_likes')
          .insert([{ tweet_id: id, user_id: likeUserId }]);
        // 이미 눌렀던 경우(UNIQUE 충돌)만 조용히 무시
        if (likeError && likeError.code !== '23505') throw likeError;
        
        // 토스트 메시지 (간단하게)
        toast.success(t('common.success_like'));
        
        // 2) 알림 추가 (자기 글 좋아요면 알림 안 보냄, 작성자 프로필 없으면 스킵)
        if (authorProfileId && authorProfileId !== likeUserId) {
          const { error: notiError } = await supabase.from('notifications').insert([
            {
              type: 'like',
              content: content || safeContent,  // 실제 게시글 내용
              is_read: false,
              tweet_id: id,
              comment_id: null,
              sender_id: likeUserId,
              receiver_id: authorProfileId,
            },
          ]);
          if (notiError) {
            console.error('좋아요 알림 생성 실패:', notiError.message);
          }
        }
      } else {
        // 좋아요 취소
        const { error } = await supabase
          .from('tweet_likes')
          .delete()
          .eq('tweet_id', id)
          .eq('user_id', likeUserId);
        if (error) throw error;
        
        toast.info(t('common.cancel_like'));
        // 알림은 취소해도 남겨두는 정책이므로 건드리지 않음
      }
    } catch (err: any) {
      console.error('좋아요 토글 실패:', err.message);
      toast.error(t('common.error_like'));
      // 실패 시 원상복구
      setLiked(!optimisticLiked);
      setLikeCount(prev => {
        const next = optimisticLiked ? prev - 1 : prev + 1;
        return next < 0 ? 0 : next;
      });
    }
    // SnsStore 동기화 (리스트 페이지 캐시 업데이트)
    // SnsStore가 없거나 로드되지 않았을 수도 있으니 안전하게 호출
    SnsStore.updateStats(id, {
      likes: optimisticLiked ? likeCount + 1 : Math.max(0, likeCount - 1)
    });
  };

  /** 이미지 파일 선택 핸들러 */
  const handleEditFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    
    // 업로드 시작
    setIsUploading(true);
    
    (async () => {
      const newImages: string[] = [];
      
      for (const file of files) {
        try {
           const fileExt = file.name.split('.').pop();
           const fileName = `${authUser?.id}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
           const filePath = `tweet_images/${authUser?.id}/${fileName}`;
           
           const { error: uploadError } = await supabase.storage
             .from('tweet_media')
             .upload(filePath, file);
             
           if (uploadError) throw uploadError;
           
           const { data } = supabase.storage.from('tweet_media').getPublicUrl(filePath);
           newImages.push(data.publicUrl);
        } catch (err) {
           console.error('이미지 업로드 실패:', err);
           toast.error('일부 이미지 업로드에 실패했습니다.');
        }
      }
      
      setEditImages(prev => [...prev, ...newImages]);
      setIsUploading(false);
    })();
  };

  /** 수정 저장 */
  const saveEdit = async () => {
      if (!profileId) return;
      if (!editText.trim() && editImages.length === 0) {
          toast.error(t('tweets.error_empty', '내용을 입력해주세요'));
          return;
      }

      try {
          // 이미지 태그 생성
          const imgTags = editImages.map(src => `<img src="${src}" alt="uploaded" />`).join('<br />');
          let finalContent = editText.trim();
          if (imgTags) {
              if (finalContent) finalContent += '<br />' + imgTags;
              else finalContent = imgTags;
          }

          const table = type === 'reply' ? 'tweet_replies' : 'tweets';
          const { error } = await supabase
              .from(table)
              .update({ content: finalContent })
              .eq('id', id)
              .eq('author_id', profileId);

          if (error) throw error;

          toast.success(t('common.success_edit', '수정되었습니다'));
          setIsEditing(false);
          setCurrentContent(finalContent);
          
          // 상위 컴포넌트 알림
          if (onUpdated) {
             onUpdated(id, { content: finalContent });
          }
           // SnsStore 업데이트 (선택)
          // SnsStore.updateTweet(id, { content: finalContent }); 

      } catch (err: any) {
          console.error('수정 실패:', err);
          toast.error(t('common.error_edit', '수정에 실패했습니다'));
      }
  };

  /** 트윗 삭제 */
  /** 트윗 삭제 */
  const handleDelete = async () => {
    if (!profileId) return;

    try {
      const table = type === 'reply' ? 'tweet_replies' : 'tweets';
      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) throw error;

      toast.success(t('tweet.delete_success'));
      onDeleted?.(id);
      setShowMenu(false);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(t('tweet.delete_failed'));
    }
  };
    const isNavigatingRef = useRef(false);

    const safeNavigate = (path: string) => {
      if (isNavigatingRef.current) return;
      // 현재 경로와 동일하면 이동 안 함
      if (location.pathname + location.search === path) return;

      isNavigatingRef.current = true;
      navigate(path);

      // 만약 이동이 일어나지 않거나(같은 페이지 등), 뒤로가기로 돌아왔을 때를 대비해 타임아웃으로 해제
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 2000);
    };

    const handleCardClick = () => {
      if (onClick) {
        onClick(id);
        return;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SNS_LAST_TWEET_ID_KEY, type === 'reply' ? tweetId! : id);
      }
      const target = type === 'reply' ? `/sns/${tweetId}?highlight=${id}` : `/sns/${id}`;
      safeNavigate(target);
    };
    const isDeletedUser = user.username === 'anonymous';

    const handleAvatarClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDeletedUser) return;

      if (onAvatarClick) {
        onAvatarClick(user.username);
        return;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SNS_LAST_TWEET_ID_KEY, id);
      }
      const target = `/profile/${encodeURIComponent(user.name)}`;
      safeNavigate(target);
    };
    const isMyTweet = authUser?.id === user.username;
    const nameClass = `
    font-bold cursor-pointer hover:underline
    ${dimmed ? 'text-gray-800 dark:text-gray-200' : 'text-gray-900 dark:text-gray-100'}
  `;
    const metaClass = `
    text-gray-500 dark:text-gray-400
    ${dimmed ? 'opacity-80' : ''}
  `;
    const contentClass = `
    mt-1 text-[15px] leading-snug whitespace-pre-line break-words
    ${dimmed ? 'text-gray-800 dark:text-gray-200 opacity-90' : 'text-gray-900 dark:text-gray-100'}
  `;
    const handleCardClickSafe = () => {
      // 텍스트 선택 확인은 content onClick에서 처리, 여기는 카드 배경 클릭
      if (showImageModal) return;

      // 혹시라도 배경에서 선택이 일어나고 있었을 수 있으니 체크
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;
      handleCardClick();
    };
    // 택스트만 번역
    const plainTextContent = (() => {
      const tmp = document.createElement('div');
      tmp.innerHTML = safeContent;
      return tmp.textContent || tmp.innerText || '';
    })();
    return (
      <div
        data-tweet-id={id}
        className="relative px-4 py-3 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-background hover:bg-gray-50/50 dark:hover:bg-primary/10"
        onClick={handleCardClickSafe}
      >
        {/* Refactored Layout: Header Row (Avatar+Meta) + Full Width Content */}
        <div className="flex items-center gap-3 mb-1">
          {/* Avatar */}
          <div onClick={handleAvatarClick} className={`w-10 h-10 flex-shrink-0 relative ${isDeletedUser ? 'cursor-default' : 'cursor-pointer'}`}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar || '/default-avatar.svg'} alt={isDeletedUser ? t('deleted_user') : user.name} />
              <AvatarFallback>{isDeletedUser ? '?' : user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>

          {/* User Info & Menu */}
          <div className="flex-1 min-w-0 flex items-center justify-between pt-0.5 relative">
            <div className="flex items-center flex-wrap mr-1">
              <div className="relative inline-flex items-center">
                <span
                  className={isDeletedUser ? 'font-bold text-gray-500 cursor-default' : nameClass}
                  onClick={isDeletedUser ? undefined : handleAvatarClick}
                >
                  {isDeletedUser ? t('deleted_user') : user.name}
                </span>
                {!isDeletedUser && (
                  <OnlineIndicator
                    userId={user.username}
                    size="sm"
                    className="absolute -top-0.5 -right-2.5 z-20 border-white dark:border-background border shadow-none"
                  />
                )}
              </div>
              <BanBadge bannedUntil={user.banned_until ?? null} size="xs" />
              {authorCountryFlagUrl && !isDeletedUser && (
                <Badge variant="secondary" className="flex items-center px-1.5 py-0.5 ml-4 h-5">
                  <img
                    src={authorCountryFlagUrl}
                    alt={authorCountryName ?? '국가'}
                    title={authorCountryName ?? ''}
                    className="w-5 h-3.5 rounded-[2px] object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </Badge>
              )}
              {!authorCountryFlagUrl && authorCountryName && (
                <Badge
                  variant="secondary"
                  className="flex items-center px-1 py-0.5 ml-4"
                  title={authorCountryName}
                >
                  <span className="text-xs">🌐</span>
                </Badge>
              )}
              <span className={`${metaClass} mx-1`}>·</span>
              <span className={`${metaClass} flex-shrink-0`}>
                {formatSmartDate(timestamp)}
              </span>
            </div>

            {/* Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowMenu(prev => !prev);
                }}
                className="p-2 -mr-2 -mt-2 rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition"
              >
                <i className="ri-more-2-fill text-gray-500 dark:text-gray-400 text-lg" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 min-w-[9rem] whitespace-nowrap bg-white dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg dark:shadow-black/30 py-2 z-50">
                  {isMyTweet ? (
                    <>
                      <EditButton onClose={() => setShowMenu(false)} />
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setShowDialog(true);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 text-red-600 dark:text-red-400 flex items-center gap-2"
                      >
                        <i className="ri-delete-bin-line" />
                        <span>{t('common.delete')}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setShowReportModal(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                      >
                        <i className="ri-alarm-warning-line" />
                        <span>{t('report.action', '신고하기')}</span>
                      </button>
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
        </div>

        {/* Full Width Content & Actions */}
        <div className="w-full">
          {/* 텍스트 + 번역 버튼 */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="w-full" onClick={e => e.stopPropagation()}>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={4}
                  className="
                    w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-700
                    bg-gray-50 dark:bg-background px-3 py-2 text-sm
                    text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-primary/60
                  "
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      saveEdit();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setIsEditing(false);
                      // 원래 내용으로 되돌리기 (텍스트/이미지 분리해서)
                      setEditText(stripImgTags(currentContent));
                      setEditImages(extractImageSrcs(currentContent));
                    }
                  }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:underline disabled:opacity-50"
                    >
                      <i className="ri-image-add-line" />
                      <span>{isUploading ? '업로드 중...' : '사진 추가'}</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleEditFiles}
                    />

                    {editImages.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        이미지 {editImages.length}개
                      </span>
                    )}
                  </div>
                </div>

                {/* 이미지 미리보기 + 삭제 */}
                {editImages.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {editImages.map((src, idx) => (
                      <div
                        key={src + idx}
                        className="relative w-24 h-24 rounded-xl overflow-hidden border"
                      >
                        <img src={src} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                          onClick={() => setEditImages(prev => prev.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    className="text-sm text-gray-500 hover:underline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(stripImgTags(currentContent));
                      setEditImages(extractImageSrcs(currentContent));
                    }}
                  >
                    취소
                  </button>

                  <button
                    className="px-4 py-1.5 rounded-full text-sm font-semibold bg-primary text-white hover:bg-primary/80"
                    onClick={saveEdit}
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={contentRef}
                  className={`${contentClass} transition-all ${
                    expanded ? 'max-h-none' : 'overflow-hidden'
                  } ${isSoftDeleted ? 'italic text-gray-500 opacity-60' : ''}`}
                  style={!expanded ? { maxHeight: '60px' } : undefined} // 약 3줄
                  dangerouslySetInnerHTML={{ __html: safeContent }}
                  // 드래그 시작
                  onMouseDown={e => {
                    dragInfo.current.startX = e.clientX;
                    dragInfo.current.startY = e.clientY;
                    dragInfo.current.moved = false;
                  }}
                  // 드래그 중 감지
                  onMouseMove={e => {
                    // 이미 움직임으로 판명났으면 계산 불필요
                    if (dragInfo.current.moved) return;
                    const dx = Math.abs(e.clientX - dragInfo.current.startX);
                    const dy = Math.abs(e.clientY - dragInfo.current.startY);
                    // 5px 이상 움직이면 드래그(텍스트 선택)로 판단
                    if (dx > 5 || dy > 5) {
                      dragInfo.current.moved = true;
                      setIsDraggingText(true);
                    }
                  }}
                  // 드래그 종료 시
                  onMouseUp={() => {
                    // 드래그가 끝났으면 잠시 후 상태 해제 (Click 이벤트가 돌고 나서 false가 되도록)
                    if (isDraggingText) {
                      setTimeout(() => setIsDraggingText(false), 50);
                    }
                  }}
                  onClick={e => {
                    // 텍스트 선택(드래그)이 아니었을 때만 카드 클릭 처리
                    if (!dragInfo.current.moved) {
                      e.stopPropagation(); // 👈 부모로 버블링 방지 (부모도 navigate를 호출하므로 중복 방지)
                      handleCardClick();
                    }
                  }}
                />
                {/* 번역 버튼 - 더보기가 없거나 expanded일 때만 표시 */}
                {plainTextContent.trim().length > 0 && (!isLong || expanded) && (
                  <TranslateButton
                    text={plainTextContent}
                    contentId={`tweet_${id}`}
                    setTranslated={setTranslated}
                    size="sm"
                  />
                )}
              </>
            )}
          </div>
          {/* 더보기 버튼 */}
          {isLong && (
            <button
              className="mt-1 text-gray-400 text-sm font-medium hover:underline"
              onClick={e => {
                e.stopPropagation();

                // 접기 동작일 때만 스크롤 이동
                if (expanded) {
                  const cardElement = e.currentTarget.closest('[data-tweet-id]'); // 부모 카드 찾기
                  if (cardElement) {
                    const rect = cardElement.getBoundingClientRect();
                    const absoluteTop = window.scrollY + rect.top;
                    const offset = 100; // 헤더 높이 여유분

                    window.scrollTo({
                      top: absoluteTop - offset,
                      behavior: 'smooth'
                    });
                  }
                }

                setExpanded(prev => !prev);
              }}
            >
              {expanded ? '접기' : '더보기'}
            </button>
          )}

          {/* 번역 결과 */}
          {translated && (
            <div
              className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-sm whitespace-pre-line break-words"
              // 드래그 시작
              onMouseDown={e => {
                dragInfo.current.startX = e.clientX;
                dragInfo.current.startY = e.clientY;
                dragInfo.current.moved = false;
              }}
              // 드래그 중 감지
              onMouseMove={e => {
                if (dragInfo.current.moved) return;
                const dx = Math.abs(e.clientX - dragInfo.current.startX);
                const dy = Math.abs(e.clientY - dragInfo.current.startY);
                if (dx > 5 || dy > 5) {
                  dragInfo.current.moved = true;
                  setIsDraggingText(true);
                }
              }}
              // 드래그 종료 시
              onMouseUp={() => {
                if (isDraggingText) {
                  setTimeout(() => setIsDraggingText(false), 50);
                }
              }}
              onClick={e => {
                if (!dragInfo.current.moved) {
                  e.stopPropagation();
                  handleCardClick();
                }
              }}
            >
              {translated}
            </div>
          )}
          {/* 이미지 슬라이드 */}
          {!isEditing && allImages.length > 0 && (
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
          {!isEditing && showImageModal && (
            <ModalImageSlider
              allImages={allImages}
              modalIndex={modalIndex}
              setModalIndex={setModalIndex}
              onClose={() => setShowImageModal(false)}
            />
          )}
          <div
            className="flex items-center justify-between max-w-md mt-3 text-gray-500 dark:text-gray-400 cursor-pointer"
            onClick={(e) => {
              // 버튼 사이 빈 공간 클릭 시 이동
              if (e.target === e.currentTarget) {
                handleCardClick();
              }
            }}
          >
            {/* 댓글 버튼 (클릭 시 상세 이동) */}
            <button
              className={`flex items-center space-x-2 group p-2 -ml-2 rounded-full transition-colors ${disableInteractions ? 'cursor-default' : 'hover:text-blue-500 dark:hover:text-blue-400'}`}
              onClick={e => {
                if (disableInteractions) {
                  e.stopPropagation();
                  return;
                }
                // 부모 div의 클릭과 겹치지 않게 하기 위해 stopPropagation 할 수도 있지만,
                // 어차피 상세 이동이므로 버블링되어도 상관없음.
                // 하지만 명시적으로 여기서 이동 처리.
                e.stopPropagation();
                handleCardClick();
              }}
            >
              <div className={`p-2 rounded-full transition-colors relative ${disableInteractions ? '' : 'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'}`}>
                <i className="ri-chat-3-line text-lg" />
              </div>
              <span className="text-sm">{replyCount}</span>
            </button>
            {/* 좋아요 버튼 */}
            <button
              className={`flex items-center space-x-2 group p-2 rounded-full transition-colors ${
                liked ? 'text-red-500' : (disableInteractions ? '' : 'hover:text-red-500')
              } ${disableInteractions ? 'cursor-default' : ''}`}
              onClick={handleLikeToggle}
            >
              <div className={`p-2 rounded-full transition-colors ${disableInteractions ? '' : 'group-hover:bg-red-50 dark:group-hover:bg-red-900/20'}`}>
                <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`} />
              </div>
              <span className="text-sm">{likeCount}</span>
            </button>
            {/* 조회수 (클릭 시 상세 이동) */}
            <button
              className={`flex items-center space-x-2 group p-2 rounded-full transition-colors ${disableInteractions ? 'cursor-default' : 'hover:text-green-500 dark:hover:text-green-400'}`}
              onClick={(e) => {
                if (disableInteractions) {
                  e.stopPropagation();
                  return;
                }
                e.stopPropagation();
                handleCardClick();
              }}
            >
              <div className={`p-2 rounded-full transition-colors ${disableInteractions ? '' : 'group-hover:bg-green-50 dark:group-hover:bg-green-900/20'}`}>
                <i className="ri-eye-line text-lg" />
              </div>
              <span className="text-sm">{viewCount}</span>
            </button>
          </div>
        </div>
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[1000]">
          <div
            ref={dialogRef}
            className="bg-white dark:bg-secondary rounded-2xl p-6 w-[90%] max-w-sm shadow-lg relative"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('tweet.delete_msg_title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {t('tweet.delete_msg_desc')}
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType={type as any} // 'tweet' | 'reply' | 'post'
          targetId={id}
          contentSnapshot={{
            id,
            user,
            content,
            image: allImages,
            timestamp,
            stats,
          }}
        />
      )}
    </div>
  );
}
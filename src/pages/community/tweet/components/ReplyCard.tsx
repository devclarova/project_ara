import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { UIReply } from '@/types/sns';
import TranslateButton from '@/components/common/TranslateButton';
import { useTranslation } from 'react-i18next';
import BlockButton from '@/components/common/BlockButton';
// import ReportButton from '@/components/common/ReportButton'; // Unused
import ReportModal from '@/components/common/ReportModal';
import ModalImageSlider from './ModalImageSlider';
import { formatRelativeTime, formatSmartDate } from '@/utils/dateUtils';
import { BanBadge } from '@/components/common/BanBadge';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { OnlineIndicator } from '@/components/common/OnlineIndicator';

function stripImagesAndEmptyLines(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // img 제거
  doc.querySelectorAll('img').forEach(img => img.remove());
  // 빈 <br> 정리
  doc.querySelectorAll('br').forEach(br => {
    const next = br.nextSibling;
    if (!next || next.nodeName === 'BR') {
      br.remove();
    }
  });
  return doc.body.innerHTML.trim();
}

const baseCardClasses =
  'border-b border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors';

interface ReplyCardProps {
  reply: UIReply;
  onDeleted?: (replyId: string) => void;
  onUnlike?: (id: string) => void;
  onLike?: (replyId: string, delta: number) => void;
  onReply?: (reply: UIReply) => void;
  highlight?: boolean;
  onClick?: (id: string, tweetId: string) => void;
  onAvatarClick?: (username: string) => void;
  disableInteractions?: boolean;
  isAdminView?: boolean;
}

export function ReplyCard({
  reply,
  onDeleted,
  onLike,
  onReply,
  highlight = false,
  onClick,
  onAvatarClick,
  disableInteractions = false,
  isAdminView = false,
}: ReplyCardProps) {
  const navigate = useNavigate();
  const params = useParams();
  const { user: authUser } = useAuth();
  const { t, i18n } = useTranslation();
  const [liked, setLiked] = useState(reply.liked ?? false);
  const [likeCount, setLikeCount] = useState(reply.stats?.likes ?? 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [translated, setTranslated] = useState<string>('');
  const [modalIndex, setModalIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [contentImages, setContentImages] = useState<string[]>([]);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const { blockedIds, isLoading: isBlockedLoading } = useBlockedUsers();
  const [isUnmasked, setIsUnmasked] = useState(false);
  const isAuthorBlocked = blockedIds.includes(reply.user.id);
  const showMask = isAuthorBlocked && !isUnmasked;

  const [authorCountryFlagUrl, setAuthorCountryFlagUrl] = useState<string | null>(null);
  const [authorCountryName, setAuthorCountryName] = useState<string | null>(null);

  /** 트윗 작성자 국적 / 국기 로드 */
  useEffect(() => {
    const fetchAuthorCountry = async () => {
      try {
        if (!reply.user.username || reply.user.username === 'anonymous') return;
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, country')
          .eq('user_id', reply.user.username)
          .maybeSingle();
        if (profileError || !profile || !profile.country) return;

        const { data: country, error: countryError } = await supabase
          .from('countries')
          .select('name, flag_url')
          .eq('id', profile.country)
          .maybeSingle();
        if (countryError || !country) return;

        setAuthorCountryFlagUrl(country.flag_url ?? null);
        setAuthorCountryName(country.name ?? null);
      } catch (err) {
        console.error('작성자 국기 정보 로드 중 예외:', err);
      }
    };
    fetchAuthorCountry();
  }, [reply.user.username]);


  // Sync likeCount with props
  useEffect(() => {
    setLikeCount(reply.stats?.likes ?? 0);
  }, [reply.stats?.likes]);

  // reply.content could be undefined in some types, fallback
  const isSoftDeleted = !!reply.deleted_at;
  const rawContent = (isSoftDeleted && !isAdminView) ? '관리자에 의해 삭제된 메시지입니다.' : (reply.content ?? '');
  
  const safeContent = DOMPurify.sanitize(rawContent, {
    ADD_TAGS: ['iframe', 'video', 'source', 'img'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
  });

  const visibleCount = 3;
  const [startIndex, setStartIndex] = useState(0);
  const visibleImages = contentImages.slice(startIndex, startIndex + visibleCount);

  // highlight prop이 true일 때 CSS 애니메이션 클래스 적용
  useEffect(() => {
    if (highlight) {
      setIsHighlighted(true);
      // CSS 애니메이션 지속 시간인 3초 후에 다시 원복 (상태 초기화 목적)
      const timer = setTimeout(() => setIsHighlighted(false), 3000);
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

  // 내가 이미 좋아요 눌렀는지 확인
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
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showDialog]);

  // 이미지 추출
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawContent, 'text/html');
    const imgs = Array.from(doc.querySelectorAll('img'))
      .map(img => img.src)
      .filter(Boolean);
    setContentImages(imgs);
  }, [rawContent]);


  // 댓글 삭제
  const handleDelete = async () => {
    if (!profileId) {
      toast.error(t('auth.login_needed'));
      return;
    }
    try {
      const { error } = await supabase
        .from('tweet_replies')
        .delete()
        .eq('id', reply.id)
        .eq('author_id', profileId);

      if (error) throw error;
      toast.success(t('common.success_delete'));
      setShowDialog(false);
      setShowMenu(false);
      onDeleted?.(reply.id);
    } catch (err: any) {
      console.error('댓글 삭제 실패:', err.message);
      toast.error(t('common.error_delete'));
    }
  };

  const [isLikeProcessing, setIsLikeProcessing] = useState(false);

  // 댓글 좋아요 토글
  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disableInteractions) return;
    if (isLikeProcessing) return;

    if (!authUser) {
      toast.error(t('auth.login_needed'));
      return;
    }
    if (!profileId) {
      toast.error(t('common.error_profile_loading'));
      return;
    }

    setIsLikeProcessing(true);

    // Toggle optimistic
    const nextLiked = !liked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    
    setLiked(nextLiked);
    setLikeCount(nextCount);
    onLike?.(reply.id, nextLiked ? 1 : -1);

    try {
      if (!nextLiked) {
        // 좋아요 취소
        const { error: deleteError } = await supabase
          .from('tweet_replies_likes')
          .delete()
          .eq('reply_id', reply.id)
          .eq('user_id', profileId);
        if (deleteError) throw deleteError;
        
        toast.info(t('common.cancel_like', '좋아요를 취소했습니다'));
      } else {
        // 좋아요 추가
        const { error: insertError } = await supabase.from('tweet_replies_likes').insert({
          reply_id: reply.id,
          user_id: profileId,
        });
        if (insertError) throw insertError;
        
        // 토스트 메시지 (간단하게)
        toast.success(t('common.success_like'));
        
        // 알림 생성 (본인 댓글이 아닐 때만)
        if (reply.user.username !== authUser.id) {
          const { data: receiverProfile, error: receiverError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', reply.user.username)
            .maybeSingle();

          if (!receiverError && receiverProfile && receiverProfile.id !== profileId) {
            // 중복 알림 체크
            const { data: existingNoti } = await supabase
              .from('notifications')
              .select('id')
              .eq('receiver_id', receiverProfile.id)
              .eq('type', 'like')
              .eq('comment_id', reply.id)
              .maybeSingle();

            if (!existingNoti) {
              await supabase.from('notifications').insert({
                receiver_id: receiverProfile.id,
                sender_id: profileId,
                type: 'like',
                content: reply.content || rawContent,
                tweet_id: reply.tweetId,
                comment_id: reply.id,
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.error('좋아요 처리 실패:', err.message);
      toast.error(t('common.error_like'));
      // Rollback
      setLiked(!nextLiked);
      setLikeCount(likeCount); // Revert to original
      onLike?.(reply.id, !nextLiked ? 1 : -1);
    } finally {
      setIsLikeProcessing(false);
    }
  };

  const isDeletedUser = reply.user.username === 'anonymous';

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeletedUser) return;
    
    if (onAvatarClick) {
      onAvatarClick(reply.user.username);
      return;
    }

    navigate(`/profile/${encodeURIComponent(reply.user.name)}`);
  };

  // 텍스트만 추출 (번역용)
  const plainTextContent = stripImagesAndEmptyLines(safeContent);
  const safeContentWithoutImages = DOMPurify.sanitize(plainTextContent, {
    ADD_TAGS: ['iframe', 'video', 'source'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
  });

  // 본인 댓글 여부
  const isMyReply = authUser?.id === reply.user.username;
  const isChildReply = Boolean(reply.parent_reply_id);

  // Loading state during block check to prevent flicker
  if (isBlockedLoading) {
    return <div className={baseCardClasses + " animate-pulse h-24 bg-gray-50 dark:bg-gray-900/10"} />;
  }

  const containerClasses = `${baseCardClasses} ${
    isHighlighted 
      ? 'animate-highlight-blink' 
      : 'bg-white dark:bg-background'
  }`;

  if (showMask) {
    return (
      <div className={`${baseCardClasses} bg-gray-50 dark:bg-gray-900/40 relative overflow-hidden group/mask min-h-[100px] flex flex-col justify-center`}>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3 opacity-60 grayscale">
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-white/50 dark:border-black/20">
                <AvatarImage src="/default-avatar.svg" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-gray-200 dark:bg-gray-700 rounded-full p-0.5">
                <i className="ri-user-forbid-line text-[10px] text-gray-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {t('common.blocked_comment_msg', '차단한 상대의 댓글입니다')}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">
                Blocked Content
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsUnmasked(true);
            }}
            className="text-xs font-bold text-primary hover:text-white bg-primary/10 hover:bg-primary px-4 py-2 rounded-full transition-all active:scale-95 shadow-sm"
          >
            {t('common.view_content', '내용보기')}
          </button>
        </div>
        
        {/* Subtle glass effect pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.1] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>
    );
  }

  return (
    <div
      id={`reply-${reply.id}`}
      className={`${containerClasses} ${isChildReply ? 'ml-10 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''} cursor-pointer`}
      onClick={e => {
        e.stopPropagation();
        
        if (onClick) {
          onClick(reply.id, String(reply.tweetId));
          return;
        }

        // disableInteractions일 때 navigate 방지
        if (disableInteractions) {
          return;
        }

        // useParams로 가져온 id(문자열)와 reply.tweetId(문자열 or 숫자) 비교
        const currentTweetId = params.id;
        const targetTweetId = String(reply.tweetId);

        // 현재 보고 있는 트윗 내에서의 이동(대댓글 등)이면 History 쌓지 않음
        const isSamePage = currentTweetId === targetTweetId;

        const targetPath = `/sns/${targetTweetId}`;
        navigate(targetPath, {
          state: {
            highlightCommentId: reply.id,
            scrollKey: Date.now(),
          },
          replace: isSamePage,
        });
      }}
    >
      <div className="flex space-x-3">
        <div onClick={handleAvatarClick} className={`cursor-pointer relative ${isDeletedUser ? 'cursor-default' : ''}`}>
          <Avatar>
            <AvatarImage src={reply.user.avatar || '/default-avatar.svg'} alt={isDeletedUser ? t('deleted_user') : reply.user.name} />
            <AvatarFallback>{isDeletedUser ? '?' : reply.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          {/* 상단 + 더보기 버튼 */}
          <div className="flex items-center justify-between relative" ref={menuRef}>
            <div className="flex items-center flex-wrap gap-x-1">
            <div className="relative inline-flex items-center pr-2.5">
              <span 
                className={`font-bold text-gray-900 dark:text-gray-100 truncate ${isDeletedUser ? 'cursor-default' : 'hover:underline cursor-pointer'}`}
                onClick={handleAvatarClick}
              >
                {isDeletedUser ? t('deleted_user') : reply.user.name}
              </span>
              {!isDeletedUser && (
                <OnlineIndicator 
                  userId={reply.user.username} 
                  size="sm" 
                  className="absolute -top-1 right-0 z-20 border-white dark:border-background border shadow-none"
                />
              )}
            </div>
            
            <BanBadge bannedUntil={reply.user.banned_until ?? null} size="xs" />

            {/* 작성자 국가 표시 (국기 또는 지구본) */}
            {authorCountryFlagUrl && !isDeletedUser && (
              <Badge variant="secondary" className="flex items-center px-1.5 py-0.5 h-5 ml-1.5">
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
                className="flex items-center px-1 py-0.5 ml-1.5"
                title={authorCountryName}
              >
                <span className="text-xs">🌐</span>
              </Badge>
            )}

            <span className="mx-1 text-gray-500 dark:text-gray-400">·</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {formatSmartDate(reply.timestamp)}
            </span>
          </div>

            <div className="flex items-center">
              {isAuthorBlocked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUnmasked(false);
                  }}
                  className="mr-2 text-[10px] font-bold text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded transition-all flex items-center gap-1 group/remask active:scale-95"
                >
                  <i className="ri-eye-off-line" />
                  <span>{t('common.hide_content', '다시 숨기기')}</span>
                </button>
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowMenu(prev => !prev);
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition"
              >
                <i className="ri-more-2-fill text-gray-500 dark:text-gray-400 text-lg" />
              </button>
            </div>

            {/* 더보기 메뉴 */}
            {showMenu && (
              <div className="absolute right-0 top-8 min-w-[9rem] whitespace-nowrap bg-white dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg dark:shadow-black/30 py-2 z-50">
                {isMyReply ? (
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
                ) : (
                  <>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setShowMenu(false);
                        setShowReportModal(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200"
                    >
                      <i className="ri-flag-line" />
                      <span>{t('common.report')}</span>
                    </button>
                    <BlockButton
                      targetProfileId={reply.user.id}
                      onClose={() => setShowMenu(false)}
                    />
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Report Modal */}
          <ReportModal
             isOpen={showReportModal}
             onClose={() => setShowReportModal(false)}
             targetType="reply"
             targetId={reply.id}
             contentSnapshot={{
               ...reply,
               // Ensure essential fields are present in snapshot
               id: reply.id,
               content: reply.content,
               user: reply.user,
               timestamp: reply.timestamp,
               stats: reply.stats,
             }}
          />

            <div className={`flex items-center gap-2 mt-1 ${isSoftDeleted ? 'italic text-gray-500 opacity-60' : ''}`}>
              <div
                className="text-gray-900 dark:text-gray-100 whitespace-normal break-words leading-relaxed"
                dangerouslySetInnerHTML={{ __html: safeContentWithoutImages }}
              />
              {/* 번역 버튼 */}
              {!isSoftDeleted && plainTextContent.trim().length > 0 && (
                <TranslateButton
                  text={plainTextContent}
                  contentId={`reply_${reply.id}`}
                  setTranslated={setTranslated}
                  size="sm"
                />
              )}
            </div>

          {/* 번역 결과 */}
          {translated && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-sm whitespace-pre-line break-words">
              {translated}
            </div>
          )}

          {/* 이미지 미리보기 */}
          {!showMask && (!isSoftDeleted || isAdminView) && contentImages.length > 0 && (
            <div className="relative group mt-2">
              <div className="grid grid-cols-3 gap-2">
                {visibleImages.map((src, idx) => (
                  <button
                    key={src}
                    onClick={e => {
                      e.stopPropagation();
                      setModalIndex(startIndex + idx);
                      setShowImageModal(true);
                    }}
                    className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 border border-gray-200 dark:border-gray-700"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>

              {/* 왼쪽 버튼 */}
              {startIndex > 0 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setStartIndex(i => Math.max(i - 3, 0));
                  }}
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 text-white text-xl rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10"
                >
                  ‹
                </button>
              )}

              {/* 오른쪽 버튼 */}
              {startIndex + 3 < contentImages.length && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setStartIndex(i => i + 3);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 text-white text-xl rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10"
                >
                  ›
                </button>
              )}
            </div>
          )}

          {showImageModal && contentImages.length > 0 && (
            <div
              className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <ModalImageSlider
                allImages={contentImages}
                modalIndex={modalIndex}
                setModalIndex={setModalIndex}
                onClose={() => setShowImageModal(false)}
              />
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center justify-start gap-7 max-w-md mt-3 text-gray-500 dark:text-gray-400">
            {/* Reply */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${disableInteractions ? 'cursor-default' : 'hover:text-blue-500 dark:hover:text-blue-400'}`}
              onClick={e => {
                if (disableInteractions) {
                    e.stopPropagation();
                    return;
                }
                e.stopPropagation();
                onReply?.(reply); // 부모로 “이 댓글에 답글” 전달
              }}
            >
              <div className={`p-2 rounded-full transition-colors ${disableInteractions ? '' : 'group-hover:bg-blue-50 dark:group-hover:bg-primary/10'}`}>
                <i className="ri-chat-3-line text-lg" />
              </div>
              <span className="text-sm">{reply.stats.replies}</span>
            </button>

            {/* Like */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${liked ? 'text-red-500' : (disableInteractions ? '' : 'hover:text-red-500')} ${disableInteractions ? 'cursor-default' : ''}`}
              onClick={toggleLike}
            >
              <div className={`p-2 rounded-full transition-colors ${disableInteractions ? '' : 'group-hover:bg-red-50 dark:group-hover:bg-primary/10'}`}>
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
    </div>
  );
}

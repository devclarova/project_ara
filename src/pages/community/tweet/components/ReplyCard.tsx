import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { UIReply } from '@/types/sns';
import TranslateButton from '@/components/common/TranslateButton';
import { useTranslation } from 'react-i18next';
import BlockButton from '@/components/common/BlockButton';
import ReportButton from '@/components/common/ReportButton';
import ModalImageSlider from './ModalImageSlider';
import { formatRelativeTime } from '@/utils/dateUtils';
import EditButton from '@/components/common/EditButton';

function linkifyMentions(html: string) {
  if (/<a\b[^>]*>/.test(html)) return html;

  // @아이디(영문/숫자/언더스코어/점) 패턴
  // 한국어 닉네임을 @로 멘션하는 경우는 별도 규칙 필요
  const mentionRegex = /(^|[\s>])@([a-zA-Z0-9_.]{2,30})\b/g;
  const mentionClass =
    'mention-link text-sky-500 dark:text-sky-400 font-medium hover:underline underline-offset-2';

  return html.replace(
    mentionRegex,
    (_match, prefix, username) =>
      `${prefix}<a href="/profile/${encodeURIComponent(
        username,
      )}" class="${mentionClass}" data-mention="${username}">@${username}</a>`,
  );
}

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

interface ReplyCardProps {
  reply: UIReply;
  onDeleted?: (replyId: string) => void;
  onUnlike?: (id: string) => void;
  onLike?: (replyId: string, delta: number) => void;
  onReply?: (reply: UIReply) => void;
  highlight?: boolean;
}

export function ReplyCard({
  reply,
  onDeleted,
  onLike,
  onReply,
  highlight = false,
}: ReplyCardProps) {
  const navigate = useNavigate();
  const params = useParams();
  const { user: authUser } = useAuth();
  const { t, i18n } = useTranslation();
  const [liked, setLiked] = useState(reply.liked ?? false);
  const [likeCount, setLikeCount] = useState(reply.stats?.likes ?? 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [translated, setTranslated] = useState<string>('');
  const [modalIndex, setModalIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [contentImages, setContentImages] = useState<string[]>([]);
  // const contentRef = useRef<HTMLDivElement>(null);
  const timeSource = reply.createdAt || reply.timestamp;
  const timeLabel = timeSource ? formatRelativeTime(timeSource) : '';

  // Sync likeCount with props
  useEffect(() => {
    setLikeCount(reply.stats?.likes ?? 0);
  }, [reply.stats?.likes]);

  // 하이라이트 상태 (잠깐 색 들어왔다 빠지는 용도)
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // reply.content could be undefined in some types, fallback
  const rawContent = reply.content ?? '';

  // 댓글 수정
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(rawContent); // 편집중 값
  const [currentContent, setCurrentContent] = useState(rawContent); // 화면 표시용
  const [isComposing, setIsComposing] = useState(false);

  const safeContent = DOMPurify.sanitize(currentContent, {
    ADD_TAGS: ['iframe', 'video', 'source', 'img'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
  });

  const visibleCount = 3;
  const [startIndex, setStartIndex] = useState(0);
  const visibleImages = contentImages.slice(startIndex, startIndex + visibleCount);

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

  useEffect(() => {
    setCurrentContent(rawContent);
    setDraft(rawContent);
  }, [rawContent]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentContent, 'text/html');
    const imgs = Array.from(doc.querySelectorAll('img'))
      .map(img => img.src)
      .filter(Boolean);
    setContentImages(imgs);
  }, [currentContent]);

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

  const isDeleted = reply.user.username === 'anonymous';

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleted) return;
    navigate(`/profile/${encodeURIComponent(reply.user.name)}`);
  };

  // 본인 댓글 여부
  const isMyReply = authUser?.id === reply.user.username;
  const isChildReply = Boolean(reply.parent_reply_id);

  // 배경 빼고 공통 카드 스타일만
  const baseCardClasses =
    'border-b border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors';
  const containerClasses = `${baseCardClasses} ${
    isHighlighted ? 'bg-primary/15 dark:bg-primary/25' : 'bg-white dark:bg-background'
  }`;

  // 텍스트만 추출 (번역용)
  const plainTextContent = stripImagesAndEmptyLines(safeContent);
  const safeContentWithoutImages = DOMPurify.sanitize(linkifyMentions(plainTextContent), {
    ADD_TAGS: ['iframe', 'video', 'source', 'span', 'a'],
    ADD_ATTR: [
      'href',
      'allow',
      'allowfullscreen',
      'frameborder',
      'scrolling',
      'src',
      'controls',
      'data-mention',
      'class',
    ],
  });

  const saveEdit = async () => {
    if (!profileId) {
      toast.error(t('common.error_profile_missing'));
      return;
    }

    const next = draft.trim();
    if (!next) return;

    const { error } = await supabase
      .from('tweet_replies')
      .update({ content: next })
      .eq('id', reply.id)
      .eq('author_id', profileId);

    if (error) {
      console.error('댓글 편집 실패:', error.message);
      toast.error(t('common.error_edit'));
      return;
    }

    setCurrentContent(next);
    setIsEditing(false);
    setShowMenu(false);
    toast.success(t('common.success_edit'));

    // 부모가 리스트 캐시를 가지고 있으면 알려주기(선택)
    // onEdited?.(reply.id, next) 같은 콜백을 나중에 추가해도 됨
  };

  return (
    <div
      id={`reply-${reply.id}`}
      className={`${containerClasses} ${isChildReply ? 'ml-10 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''} cursor-pointer`}
      onClick={e => {
        e.stopPropagation();
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
        <div
          onClick={handleAvatarClick}
          className={`cursor-pointer ${isDeleted ? 'cursor-default' : ''}`}
        >
          <Avatar>
            <AvatarImage
              src={reply.user.avatar || '/default-avatar.svg'}
              alt={isDeleted ? t('deleted_user') : reply.user.name}
            />
            <AvatarFallback>{isDeleted ? '?' : reply.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          {/* 상단 + 더보기 버튼 */}
          <div className="flex items-start justify-between relative" ref={menuRef}>
            <div className="flex items-center space-x-1 flex-wrap">
              <span
                className={`font-bold text-gray-900 dark:text-gray-100 truncate ${isDeleted ? 'cursor-default text-gray-500' : 'hover:underline cursor-pointer'}`}
                onClick={handleAvatarClick}
              >
                {isDeleted ? t('deleted_user') : reply.user.name}
              </span>
              <span className="text-gray-500 dark:text-gray-400">·</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">{timeLabel}</span>
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
              <div className="absolute right-0 top-8 min-w-[9rem] whitespace-nowrap bg-white dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg dark:shadow-black/30 py-2 z-50">
                {isMyReply ? (
                  <>
                    <EditButton
                      onEdit={() => {
                        setDraft(currentContent);
                        setIsEditing(true);
                      }}
                      onClose={() => setShowMenu(false)}
                    />
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
                    <ReportButton onClose={() => setShowMenu(false)} />
                    <BlockButton
                      username={reply.user.name}
                      isBlocked={isBlocked}
                      onToggle={() => setIsBlocked(prev => !prev)}
                      onClose={() => setShowMenu(false)}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* 본문 + 번역 버튼 */}
          <div className="flex items-center gap-2 mt-1">
            {isEditing ? (
              <div className="w-full" onClick={e => e.stopPropagation()}>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={5}
                  className="
          w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-700
          bg-gray-50 dark:bg-background px-3 py-2 text-sm
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-primary/60
        "
                  onKeyDown={e => {
                    if (isComposing) return;

                    // ESC = 취소
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setDraft(currentContent);
                      setIsEditing(false);
                      return;
                    }

                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      saveEdit();
                      return;
                    }
                  }}
                />

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    className="text-sm text-gray-500 hover:underline"
                    onClick={() => {
                      setDraft(currentContent);
                      setIsEditing(false);
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={saveEdit}
                    className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/80"
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="text-gray-900 dark:text-gray-100 whitespace-normal break-words leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: safeContentWithoutImages }}
                  onClick={e => {
                    const el = (e.target as HTMLElement)?.closest?.(
                      '.mention-link',
                    ) as HTMLElement | null;
                    if (!el) return;
                    const username = el.dataset.mention;
                    if (!username) return;
                    navigate(`/profile/${encodeURIComponent(username)}`);
                  }}
                />
                {plainTextContent.trim().length > 0 && (
                  <TranslateButton
                    text={plainTextContent}
                    contentId={`reply_${reply.id}`}
                    setTranslated={setTranslated}
                    size="sm"
                  />
                )}
              </>
            )}
          </div>

          {/* 번역 결과 */}
          {translated && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-sm whitespace-pre-line break-words">
              {translated}
            </div>
          )}

          {/* 이미지 미리보기 */}
          {contentImages.length > 0 && (
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
              className="flex items-center space-x-2 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group"
              onClick={e => {
                e.stopPropagation();
                onReply?.(reply);
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-primary/10 transition-colors">
                <i className="ri-chat-3-line text-lg" />
              </div>
              <span className="text-sm">{reply.stats?.replies ?? 0}</span>
            </button>

            {/* Like */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${liked ? 'text-red-500' : 'hover:text-red-500'}`}
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

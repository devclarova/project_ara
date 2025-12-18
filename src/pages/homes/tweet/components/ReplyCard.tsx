import BlockButton from '@/components/common/BlockButton';
import ReportButton from '@/components/common/ReportButton';
import TranslateButton from '@/components/common/TranslateButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DOMPurify from 'dompurify';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ModalImageSlider from './ModalImageSlider';
import type { Reply } from './ReplyList';

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

export function ReplyCard({
  reply,
  onDeleted,
  // onUnlike,
  onLike,
  onReply,
  highlight = false,
}: {
  reply: Reply;
  onDeleted?: (id: string) => void;
  // onUnlike?: (id: string) => void;
  onLike?: (replyId: string, delta: number) => void;
  onReply?: (reply: Reply) => void;
  highlight?: boolean;
}) {
  if (reply.is_deleted) {
    return null;
  }

  const safeStats = reply.stats ?? {
    comments: 0,
    retweets: 0,
    likes: 0,
    views: 0,
  };

  const safeUser = {
    name: reply.user?.name || '알 수 없는 사용자',
    username: reply.user?.username || '',
    avatar: reply.user?.avatar || '/default-avatar.svg',
  };

  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [liked, setLiked] = useState(reply.liked ?? false);
  // const [likeCount, setLikeCount] = useState(safeStats.likes);
  const [showMenu, setShowMenu] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [translated, setTranslated] = useState<string>('');
  const [modalIndex, setModalIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [contentImages, setContentImages] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // const [commentCount, setCommentCount] = useState(reply.stats.comments);

  // 하이라이트 상태 (잠깐 색 들어왔다 빠지는 용도)
  const [isHighlighted, setIsHighlighted] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);

  const rawContent = reply.content ?? '';

  const safeContent = DOMPurify.sanitize(rawContent, {
    ADD_TAGS: ['iframe', 'video', 'source', 'img'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
  });

  const visibleCount = 3;
  const [startIndex, setStartIndex] = useState(0);

  const visibleImages = contentImages.slice(startIndex, startIndex + visibleCount);

  // highlight prop이 true일 때 잠깐 하이라이트
  useEffect(() => {
    if (highlight) {
      // highlight=true로 바뀔 때마다 다시 점등
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      // prop이 false로 바뀌면 바로 끔
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

  // 내가 이미 좋아요 눌렀는지 확인 (user_id = profileId 기준으로 수정)
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
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [showDialog]);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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

  // 이미지 클릭 이벤트
  useEffect(() => {
    if (!contentRef.current || contentImages.length === 0) return;

    const imgs = Array.from(contentRef.current.querySelectorAll('img'));
    const cleanups: Array<() => void> = [];

    imgs.forEach((img, index) => {
      img.style.cursor = 'pointer';

      const handleClick = (e: Event) => {
        e.stopPropagation();
        setModalIndex(index);
        setShowImageModal(true);
      };

      img.addEventListener('click', handleClick);
      cleanups.push(() => img.removeEventListener('click', handleClick));
    });

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, [contentImages]);

  // reply가 바뀌면 동기화
  // useEffect(() => {
  //   setCommentCount(reply.stats.comments);
  // }, [reply.stats.comments]);

  // 댓글 삭제
  const handleDelete = async () => {
    if (!profileId) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    const { error } = await supabase
      .from('tweet_replies')
      .delete()
      .eq('id', reply.id)
      .eq('author_id', profileId);

    if (error) {
      console.error('댓글 삭제 실패:', error);
      toast.error('댓글 삭제에 실패했습니다.');
      return;
    }

    toast.success('댓글이 삭제되었습니다.');
    onDeleted?.(reply.id);
  };

  // 댓글 좋아요 토글
  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profileId) return;

    const { data: existing, error: selectError } = await supabase
      .from('tweet_replies_likes')
      .select('id')
      .eq('reply_id', reply.id)
      .eq('user_id', profileId)
      .maybeSingle();

    if (selectError) {
      console.error('LIKE SELECT ERROR:', selectError);
      toast.error(selectError.message);
      return;
    }

    if (existing) {
      // 좋아요 취소
      const { error: deleteError } = await supabase
        .from('tweet_replies_likes')
        .delete()
        .eq('reply_id', reply.id)
        .eq('user_id', profileId)
        .select();

      if (deleteError) {
        console.error('LIKE DELETE ERROR:', deleteError);
        toast.error(deleteError.message);
        return;
      }

      setLiked(false);
      onLike?.(reply.id, -1);
      return;
    }

    // 좋아요 추가
    const { error: insertError } = await supabase
      .from('tweet_replies_likes')
      .insert({
        reply_id: reply.id,
        user_id: profileId,
      })
      .select();

    if (insertError) {
      console.error('LIKE INSERT ERROR:', insertError);
      toast.error(insertError.message);
      return;
    }

    setLiked(true);
    onLike?.(reply.id, +1);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // URL에는 닉네임(name)을 넣고, ProfileAsap에서 nickname 기준으로 조회
    navigate(`/profile/${encodeURIComponent(safeUser.name)}`);
  };

  // 본인 댓글 여부 (profiles.id 비교 불가하므로 user_id 비교)
  const isMyReply = authUser?.id === safeUser.username;

  // 대댓글 여부
  const isChildReply = Boolean(reply.parent_reply_id);

  // 배경 빼고 공통 카드 스타일만
  const baseCardClasses =
    'border-b border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors';

  // 하이라이트/일반 배경을 분리
  const containerClasses = `${baseCardClasses} ${
    isHighlighted ? 'bg-primary/15 dark:bg-primary/25' : 'bg-white dark:bg-background'
  }`;

  // 라이트/다크 모두 primary 색감이 눈에 띄게 배경 강조
  const highlightClasses = isHighlighted
    ? 'bg-[hsl(var(--primary)/0.3)] dark:bg-[hsl(var(--primary)/0.20)]'
    : '';

  // 택스트만 번역
  const plainTextContent = (() => {
    const tmp = document.createElement('div');
    tmp.innerHTML = safeContent;
    return tmp.textContent || tmp.innerText || '';
  })();

  // 이미지 제거용
  const safeContentWithoutImages = DOMPurify.sanitize(stripImagesAndEmptyLines(rawContent), {
    ADD_TAGS: ['iframe', 'video', 'source'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'controls'],
  });

  return (
    <div
      id={`reply-${reply.id}`}
      className={`${containerClasses} ${isChildReply ? 'ml-10 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''} cursor-pointer`}
      onClick={e => {
        e.stopPropagation();
        navigate(`/sns/${reply.tweetId}`, {
          state: {
            highlightCommentId: reply.id,
            scrollKey: Date.now(),
          },
        });
      }}
    >
      <div className="flex space-x-3">
        <div onClick={handleAvatarClick} className="cursor-pointer">
          <Avatar>
            <AvatarImage src={safeUser.avatar || '/default-avatar.svg'} alt={safeUser.name} />
            <AvatarFallback>{safeUser.name.charAt(0)}</AvatarFallback>
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
                {safeUser.name}
              </span>
              <span className="text-gray-500 dark:text-gray-400">·</span>
              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                {reply.timestamp}
              </span>
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
                  <>
                    <ReportButton onClose={() => setShowMenu(false)} />
                    <BlockButton
                      username={safeUser.name}
                      isBlocked={isBlocked}
                      onToggle={() => setIsBlocked(prev => !prev)}
                      onClose={() => setShowMenu(false)}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* 본문 */}
          <div
            className="mt-1 text-gray-900 dark:text-gray-100 whitespace-normal break-words leading-relaxed"
            dangerouslySetInnerHTML={{ __html: safeContentWithoutImages }}
          />

          {/* 번역 버튼 */}
          {plainTextContent.trim().length > 0 && (
            <div className="mt-2">
              <TranslateButton
                text={plainTextContent}
                contentId={`reply_${reply.id}`}
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

          {contentImages.length > 0 && (
            <div className="relative group">
              <div className="grid grid-cols-3 gap-2">
                {visibleImages.map((src, idx) => (
                  <button
                    key={src}
                    onClick={e => {
                      e.stopPropagation();
                      setModalIndex(startIndex + idx);
                      setShowImageModal(true);
                    }}
                    className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
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
                onReply?.(reply); // 부모로 “이 댓글에 답글” 전달
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-primary/10 transition-colors">
                <i className="ri-chat-3-line text-lg" />
              </div>
              <span className="text-sm">{safeStats.comments}</span>
            </button>

            {/* Like */}
            <button
              className={`flex items-center space-x-2 transition-colors group ${liked ? 'text-red-500' : 'hover:text-red-500'}`}
              onClick={toggleLike}
            >
              <div className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-primary/10 transition-colors">
                <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`} />
              </div>
              <span className="text-sm">{safeStats.likes}</span>
            </button>

            {/* Views */}
            {/* <button className="flex items-center space-x-2 hover:text-green-500 dark:hover:text-emerald-400 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-primary/10 transition-colors">
                <i className="ri-eye-line text-lg" />
              </div>
              <span className="text-sm">{reply.stats.views}</span>
            </button> */}
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

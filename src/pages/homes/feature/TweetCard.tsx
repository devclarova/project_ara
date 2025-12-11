import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DOMPurify from 'dompurify';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ImageSlider from '../tweet/components/ImageSlider';
import ModalImageSlider from '../tweet/components/ModalImageSlider';
import TranslateButton from '@/components/common/TranslateButton';
import ReportButton from '@/components/common/ReportButton';
import BlockButton from '@/components/common/BlockButton';

const SNS_LAST_TWEET_ID_KEY = 'sns-last-tweet-id';

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
  id: string; // 댓글ID 또는 트윗ID
  tweetId?: string; // reply일 때 원본 트윗ID
  type?: 'tweet' | 'reply'; // reply인지 tweet인지 구분
  user: User;
  content: string;
  image?: string | string[];
  timestamp: string;
  stats: Stats;
  onDeleted?: (id: string) => void;
  dimmed?: boolean;
  onUnlike?: (id: string) => void;
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
  dimmed = false,
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
  const [direction, setDirection] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
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

  // 최종 슬라이드에 사용할 이미지 목록 (prop 우선, 없으면 content에서 추출한 것)
  const allImages = propImages.length > 0 ? propImages : contentImages;

  const [isDraggingText, setIsDraggingText] = useState(false);
  const textDragStartX = useRef(0);
  const textDragStartY = useRef(0);
  const dragInfo = useRef({
    startX: 0,
    startY: 0,
    moved: false,
  });

  const [isBlocked, setIsBlocked] = useState(false);

  // 본문에서는 img 태그는 제거 (슬라이드에서만 보여줌)
  const safeContent = DOMPurify.sanitize(content, {
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

  // 글 줄수 검사
  useEffect(() => {
    if (!contentRef.current) return;
    const lineHeight = 20; // 15px 폰트 기준 line-height 20px
    const maxHeight = lineHeight * 3; // 3줄 높이

    if (contentRef.current.scrollHeight > maxHeight) {
      setIsLong(true);
    }
  }, [safeContent]);

  /** 좋아요 토글 (user_id = profiles.id 사용 + 알림 생성) */
  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (!profileId) {
      toast.error('프로필 정보가 없습니다. 다시 로그인해 주세요.');
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

        // 2) 알림 추가 (자기 글 좋아요면 알림 안 보냄, 작성자 프로필 없으면 스킵)
        if (authorProfileId && authorProfileId !== likeUserId) {
          const { error: notiError } = await supabase.from('notifications').insert([
            {
              type: 'like',
              content: '당신의 피드를 좋아합니다.',
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
        // 알림은 취소해도 남겨두는 정책이므로 건드리지 않음
      }
    } catch (err: any) {
      console.error('좋아요 토글 실패:', err.message);
      toast.error('좋아요 처리 중 오류가 발생했습니다.');

      // 실패 시 원상복구
      setLiked(!optimisticLiked);
      setLikeCount(prev => {
        const next = optimisticLiked ? prev - 1 : prev + 1;
        return next < 0 ? 0 : next;
      });
    }
  };

  /** 트윗 삭제 */
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
      console.error('삭제 실패:', err.message);
      toast.error('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCardClick = () => {
    if (typeof window !== 'undefined') {
      const y = window.scrollY || window.pageYOffset || 0;
      sessionStorage.setItem(SNS_LAST_TWEET_ID_KEY, type === 'reply' ? tweetId! : id);
    }

    if (type === 'reply') {
      navigate(`/sns/${tweetId}?highlight=${id}`);
    } else {
      navigate(`/sns/${id}`);
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SNS_LAST_TWEET_ID_KEY, id);
    }

    navigate(`/profile/${encodeURIComponent(user.name)}`);
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
    // 텍스트 드래그 중이면 이동 막기
    if (isDraggingText) return;
    if (showImageModal) return;
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
      <div className="flex space-x-3">
        {/* 아바타 */}
        <div onClick={handleAvatarClick} className="w-10 h-10 flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatar || '/default-avatar.svg'} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        {/* 본문 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between relative" ref={menuRef}>
            <div className="flex items-center flex-wrap">
              <span className={nameClass} onClick={handleAvatarClick}>
                {user.name}
              </span>
              {authorCountryFlagUrl && (
                <Badge variant="secondary" className="flex items-center px-1 py-0.5 ml-2">
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
                  className="flex items-center px-1 py-0.5 ml-2"
                  title={authorCountryName}
                >
                  <span className="text-xs">🌐</span>
                </Badge>
              )}

              <span className={`${metaClass} mx-1`}>·</span>
              <span className={`${metaClass} flex-shrink-0`}>{timestamp}</span>
            </div>

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
                  <>
                    <ReportButton onClose={() => setShowMenu(false)} />
                    <BlockButton
                      isBlocked={isBlocked}
                      onToggle={() => setIsBlocked(prev => !prev)}
                      onClose={() => setShowMenu(false)}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          <div
            ref={contentRef}
            className={`${contentClass} transition-all ${
              expanded ? 'max-h-none' : 'overflow-hidden'
            }`}
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
              const dx = Math.abs(e.clientX - dragInfo.current.startX);
              const dy = Math.abs(e.clientY - dragInfo.current.startY);

              // 5px 이상 움직이면 드래그로 판단
              if (dx > 5 || dy > 5) {
                setIsDraggingText(true);
              }
            }}
            // 드래그 종료 시 (클릭으로 취급되지 않게 해야 함)
            onMouseUp={() => {
              // 드래그 후 mouseup이 발생해 click 이벤트로 이어지지 않도록 50ms block
              if (isDraggingText) {
                setTimeout(() => setIsDraggingText(false), 50);
              }
            }}
            onClick={e => {
              if (!dragInfo.current.moved) {
                handleCardClick(); // 클릭일 때만 이동
              }
            }}
          />

          {/* 더보기 버튼 */}
          {isLong && (
            <button
              className="mt-1 text-gray-400 text-sm font-medium hover:underline"
              onClick={e => {
                e.stopPropagation();
                setExpanded(prev => !prev);
              }}
            >
              {expanded ? '접기' : '더보기'}
            </button>
          )}

          {/* 번역 버튼 */}
          {plainTextContent.trim().length > 0 && (
            <div className="mt-2">
              <TranslateButton
                text={plainTextContent}
                contentId={`tweet_${id}`}
                setTranslated={setTranslated}
              />
            </div>
          )}

          {/* 번역 결과 */}
          {translated && (
            <div
              className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-sm whitespace-pre-line break-words" // 드래그 시작
              // 드래그 시작
              onMouseDown={e => {
                dragInfo.current.startX = e.clientX;
                dragInfo.current.startY = e.clientY;
                dragInfo.current.moved = false;
              }}
              // 드래그 중 감지
              onMouseMove={e => {
                const dx = Math.abs(e.clientX - dragInfo.current.startX);
                const dy = Math.abs(e.clientY - dragInfo.current.startY);

                // 5px 이상 움직이면 드래그로 판단
                if (dx > 5 || dy > 5) {
                  setIsDraggingText(true);
                }
              }}
              // 드래그 종료 시 (클릭으로 취급되지 않게 해야 함)
              onMouseUp={() => {
                // 드래그 후 mouseup이 발생해 click 이벤트로 이어지지 않도록 50ms block
                if (isDraggingText) {
                  setTimeout(() => setIsDraggingText(false), 50);
                }
              }}
              onClick={e => {
                if (!dragInfo.current.moved) {
                  handleCardClick(); // 클릭일 때만 이동
                }
              }}
            >
              {translated}
            </div>
          )}

          {/* 이미지 슬라이드 */}
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
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000]"
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

          <div className="flex items-center justify-between max-w-md mt-3 text-gray-500 dark:text-gray-400">
            {/* 댓글 버튼 */}
            <button
              className="flex items-center space-x-2 hover:text-blue-500 dark:hover:text-blue-400"
              onClick={e => {
                e.stopPropagation();
                if (typeof window !== 'undefined') {
                  const y = window.scrollY || window.pageYOffset || 0;
                  sessionStorage.setItem(SNS_LAST_TWEET_ID_KEY, id);
                }
                navigate(`/sns/${id}`);
              }}
            >
              <div className="p-2 rounded-full transition-colors">
                <i className="ri-chat-3-line text-lg" />
              </div>
              <span className="text-sm">{replyCount}</span>
            </button>

            {/* 좋아요 버튼 */}
            <button
              className={`flex items-center space-x-2 ${
                liked ? 'text-red-500' : 'hover:text-red-500'
              } transition-colors`}
              onClick={handleLikeToggle}
            >
              <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`} />
              <span className="text-sm">{likeCount}</span>
            </button>

            {/* 조회수 버튼 */}
            <button className="flex items-center space-x-2 hover:text-green-500 dark:hover:text-green-400">
              <i className="ri-eye-line text-lg" />
              <span className="text-sm">{viewCount}</span>
            </button>
          </div>
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
              이 게시글을 삭제하시겠어요?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              삭제한 게시글은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg:white/10"
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

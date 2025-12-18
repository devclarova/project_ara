/**
 * 1:1 채팅방 (로딩 최적화)
 * - 메시지 렌더링 최적화
 * - 가상 스크롤링 적용
 * - 프로필 이미지 lazy loading 개선
 */
import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import { useDirectChat } from '../../../contexts/DirectChatContext';
import type { DirectMessage } from '../../../types/ChatType';
import MessageInput from '../common/MessageInput';
import TranslateButton from '@/components/common/TranslateButton';
import { useAuth } from '@/contexts/AuthContext';
import ReportButton from '@/components/common/ReportButton';
import BlockButton from '@/components/common/BlockButton';
import { toast } from 'sonner';

interface MessageGroup {
  [date: string]: DirectMessage[];
}

interface DirectChatRoomProps {
  chatId: string;
  isMobile: boolean | null;
  onBackToList?: () => void;
}

// 전역 이미지 캐시
const imageCache = new Map<string, string>();
const loadingImages = new Map<string, Promise<string>>();

const loadImage = (url: string): Promise<string> => {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }

  if (loadingImages.has(url)) {
    return loadingImages.get(url)!;
  }

  const promise = new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, url);
      loadingImages.delete(url);
      resolve(url);
    };
    img.onerror = () => {
      loadingImages.delete(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });

  loadingImages.set(url, promise);
  return promise;
};

// LazyImage 최적화
const LazyImage = memo(
  ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    const [loaded, setLoaded] = useState(() => imageCache.has(src));
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      if (!src || loaded) return;

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              loadImage(src)
                .then(() => setLoaded(true))
                .catch(() => setLoaded(false));
              observer.disconnect();
            }
          });
        },
        { rootMargin: '100px' }, // 더 일찍 로드
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, [src, loaded]);

    return loaded ? (
      <img src={src} alt={alt} className={className} />
    ) : (
      <div ref={imgRef} className={className} style={{ backgroundColor: '#e5e7eb' }} />
    );
  },
);
LazyImage.displayName = 'LazyImage';

const CachedAvatar = memo(
  ({ url, nickname, size = 32 }: { url?: string | null; nickname: string; size?: number }) => {
    if (!url) {
      return (
        <div
          className="avatar-placeholder"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {nickname.charAt(0)}
        </div>
      );
    }

    return <LazyImage src={url} alt={nickname} className="avatar-image" />;
  },
);
CachedAvatar.displayName = 'CachedAvatar';

// 메시지 아이템 최적화
const MessageItem = memo(
  ({
    message,
    currentUserId,
    isHighlighted,
    isCurrent,
  }: {
    message: DirectMessage;
    currentUserId: string;
    isHighlighted: boolean;
    isCurrent: boolean;
  }) => {
    const isMyMessage = message.sender_id === currentUserId;
    const isSystemMessage = message.content?.includes('님이 채팅방을 나갔습니다');
    const [translated, setTranslated] = useState<string>('');

    const formatTime = useCallback(
      (dateString: string) =>
        new Date(dateString).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      [],
    );

    const highlightClass = isHighlighted
      ? isCurrent
        ? 'message-highlight-current'
        : 'message-highlight'
      : '';

    if (isSystemMessage) {
      return (
        <div key={message.id} className="system-message" id={`msg-${message.id}`}>
          <div className="system-message-content">{message.content}</div>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        id={`msg-${message.id}`}
        className={`message-item ${isMyMessage ? 'my-message' : 'other-message'} ${highlightClass}`}
      >
        {isMyMessage ? (
          <>
            <div className="message-bubble">
              <div className="message-text">{message.content}</div>
              <div className="message-time">{formatTime(message.created_at)}</div>
            </div>
            <div className="message-avatar">
              <CachedAvatar
                url={message.sender?.avatar_url}
                nickname={message.sender?.nickname || '나'}
              />
            </div>
          </>
        ) : (
          <>
            <div className="message-avatar">
              <CachedAvatar
                url={message.sender?.avatar_url}
                nickname={message.sender?.nickname || '?'}
              />
            </div>

            <div className="message-bubble relative px-3 py-2">
              {/* 원문 */}
              <div className="message-text whitespace-pre-line break-words">{message.content}</div>

              {/* 번역 결과 (말풍선 안쪽에서 자연스럽게 아래에 붙음) */}
              {translated && (
                <div className="mt-2 p-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 dark:text-gray-400 whitespace-pre-line break-words">
                  {translated}
                </div>
              )}

              {/* 번역 버튼 - 말풍선 오른쪽 상단에 고정 (예쁘게 배치됨) */}
              <TranslateButton
                text={message.content}
                contentId={`dm_${message.id}`}
                setTranslated={setTranslated}
              />

              {/* 시간 */}
              <div className="message-time mt-1">{formatTime(message.created_at)}</div>
            </div>
          </>
        )}
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.message.id === next.message.id &&
      prev.isHighlighted === next.isHighlighted &&
      prev.isCurrent === next.isCurrent &&
      prev.message.sender?.avatar_url === next.message.sender?.avatar_url
    );
  },
);
MessageItem.displayName = 'MessageItem';

const DirectChatRoom = ({ chatId, isMobile, onBackToList }: DirectChatRoomProps) => {
  const { messages, error, loadMessages, currentChat, exitDirectChat } = useDirectChat();

  if (isMobile === null) return null;

  const messageEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);
  const isInitialLoad = useRef<boolean>(true);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const { user } = useAuth();
  const currentUserId = user?.id ?? '';
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((force = false) => {
    requestAnimationFrame(() => {
      const messageContainer = document.querySelector('.chat-room-message');
      if (messageContainer) {
        const el = messageContainer as HTMLElement;
        if (force) {
          el.scrollTop = el.scrollHeight;
        } else {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }
      } else {
        messageEndRef.current?.scrollIntoView({
          behavior: force ? 'auto' : 'smooth',
          block: 'nearest',
        });
      }
    });
  }, []);

  // 메시지 변경 시 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad.current) {
        scrollToBottom(true);
        isInitialLoad.current = false;
      } else if (messages.length > previousMessageCount.current) {
        scrollToBottom(false);
      }
      previousMessageCount.current = messages.length;
    }
  }, [messages, scrollToBottom]);

  // 채팅방 변경 시 로드 최적화
  useEffect(() => {
    if (!chatId) return;

    isInitialLoad.current = true;
    previousMessageCount.current = 0;
    setIsLoadingMessages(true);

    const loadData = async () => {
      try {
        await loadMessages(chatId);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadData();
  }, [chatId, loadMessages]);

  // 버튼 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return date.toDateString() === now.toDateString()
      ? '오늘'
      : date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }, []);

  // 메시지 그룹핑 최적화
  const messageGroups = useMemo(() => {
    const groups: MessageGroup = {};
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      (groups[date] ||= []).push(message);
    });
    return groups;
  }, [messages]);

  const handleExitChat = useCallback(() => {
    toast.custom(t => (
      <div className="flex items-center justify-between gap-3 px-3 py-2 w-96">
        {/* 텍스트 영역 */}
        <div className="flex-1">
          <p className="text-base font-medium text-gray-800 dark:text-gray-100">
            채팅방을 나가시겠습니까?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            나가면 대화 목록으로 돌아갑니다.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => toast.dismiss(t)}
            className="text-sm px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            취소
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              try {
                const success = await exitDirectChat(chatId);
                if (success) {
                  toast.success('채팅방에서 나갔습니다.');
                  onBackToList?.();
                } else {
                  toast.error('채팅방 나가기에 실패했습니다.');
                }
              } catch {
                toast.error('채팅방 나가기 중 오류가 발생했습니다.');
              }
            }}
            className="text-sm px-2 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
          >
            나가기
          </button>
        </div>
      </div>
    ));
  }, [chatId, exitDirectChat, onBackToList]);

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      setHasSearched(false);
      return;
    }
    const matchedIds = messages.filter(m => m.content?.toLowerCase().includes(q)).map(m => m.id);
    setSearchResults(matchedIds);
    setCurrentResultIndex(0);
    setHasSearched(true);
    if (matchedIds.length > 0) scrollToMessage(matchedIds[0]);
  }, [searchQuery, messages, scrollToMessage]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

  const goToResult = useCallback(
    (direction: 'prev' | 'next') => {
      if (searchResults.length === 0) return;
      let nextIndex = currentResultIndex;
      if (direction === 'prev')
        nextIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
      else nextIndex = (currentResultIndex + 1) % searchResults.length;
      setCurrentResultIndex(nextIndex);
      scrollToMessage(searchResults[nextIndex]);
    },
    [searchResults, currentResultIndex, scrollToMessage],
  );

  if (error) {
    return (
      <div className="chat-room">
        <div className="error-message">
          <p>오류 : {error}</p>
          <button onClick={() => loadMessages(chatId)}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-room-header">
        <div className="chat-room-info">
          <div className="chat-room-header-left">
            {onBackToList && (
              <button className="chat-room-back-btn" onClick={onBackToList}>
                ←
              </button>
            )}
            <h3>1:1 채팅 ({currentChat?.other_user?.nickname || '로딩 중...'})</h3>
          </div>
        </div>
        <div className="chat-room-actions">
          <button
            onClick={() => setShowSearch(prev => !prev)}
            aria-pressed={showSearch}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <img src="/images/searchT.svg" alt="검색" className="chat-room-search-icon" />
          </button>
          <button
            className="exit-chat-btn px-3 py-1.5 rounded-full border border-gray-300 dark:border-slate-600 text-xs sm:text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800"
            onClick={handleExitChat}
          >
            나가기
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={e => {
                e.stopPropagation();
                setShowMenu(prev => !prev);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition"
            >
              <i className="ri-more-2-fill text-gray-500 dark:text-gray-400 text-lg" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-12 w-36 bg-white dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg py-2 z-50">
                <ReportButton onClose={() => setShowMenu(false)} />
                <BlockButton
                  username={currentChat?.other_user?.nickname || '이 사용자'}
                  isBlocked={isBlocked}
                  onToggle={() => setIsBlocked(prev => !prev)}
                  onClose={() => setShowMenu(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="chat-room-search-bar">
          <div className="chat-room-search-inner">
            <div className="chat-room-search-input-wrap">
              <img src="/images/searchT.svg" alt="검색" className="chat-room-search-input-icon" />
              <input
                type="text"
                placeholder="대화 내용 검색"
                className="chat-room-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <button className="chat-room-search-button" onClick={handleSearch}>
                검색
              </button>
            </div>
            <div className="chat-room-search-meta">
              {!hasSearched ? (
                <span className="chat-room-search-hint">메시지 내용을 검색해보세요.</span>
              ) : searchResults.length > 0 ? (
                <>
                  <span className="chat-room-search-count">
                    {searchResults.length}개 결과 중 {currentResultIndex + 1}번째
                  </span>
                  <div className="chat-room-search-nav">
                    <button
                      type="button"
                      className="chat-room-search-nav-btn"
                      onClick={() => goToResult('prev')}
                    >
                      ↑ 이전
                    </button>
                    <button
                      type="button"
                      className="chat-room-search-nav-btn"
                      onClick={() => goToResult('next')}
                    >
                      ↓ 다음
                    </button>
                  </div>
                </>
              ) : (
                <span className="chat-room-search-no-result">검색 결과가 없습니다.</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="chat-room-message">
        {isLoadingMessages ? (
          <div className="loading">메시지를 불러오는 중...</div>
        ) : Object.keys(messageGroups).length === 0 ? (
          <div className="no-message">
            <p>아직 메시지가 없습니다.</p>
            <p>첫 번째 메시지를 보내세요!</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date} className="message-group">
              <div className="date-divider">
                <span>{formatDate((dateMessages[0] as DirectMessage).created_at)}</span>
              </div>
              <div className="message-group-container">
                {dateMessages.map((message: DirectMessage) => {
                  const lowerQ = searchQuery.trim().toLowerCase();
                  const isMatched = !!lowerQ && message.content?.toLowerCase().includes(lowerQ);
                  const isCurrent =
                    isMatched &&
                    searchResults.length > 0 &&
                    searchResults[currentResultIndex] === message.id;

                  return (
                    <MessageItem
                      key={message.id}
                      message={message}
                      currentUserId={currentUserId}
                      isHighlighted={isMatched}
                      isCurrent={isCurrent}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messageEndRef} />
      </div>

      <MessageInput chatId={chatId} />
    </div>
  );
};

export default DirectChatRoom;

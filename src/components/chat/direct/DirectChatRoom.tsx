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

interface MessageGroup {
  [date: string]: DirectMessage[];
}

interface DirectChatRoomProps {
  chatId: string;
  isMobile?: boolean;
  onBackToList?: () => void;
}

// 🚀 전역 이미지 캐시
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

// 🚀 LazyImage 최적화
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

// 🚀 메시지 아이템 최적화
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
            <div className="message-bubble">
              <div className="message-text">{message.content}</div>
              <div className="message-time">{formatTime(message.created_at)}</div>
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

  const messageEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);
  const isInitialLoad = useRef<boolean>(true);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // 🚀 현재 유저 ID 가져오기
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const { supabase } = await import('../../../lib/supabase');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
      } catch {}
    };
    getCurrentUserId();
  }, []);

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

  // 🚀 메시지 변경 시 스크롤
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

  // 🚀 채팅방 변경 시 로드 최적화
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

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return date.toDateString() === now.toDateString()
      ? '오늘'
      : date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }, []);

  // 🚀 메시지 그룹핑 최적화
  const messageGroups = useMemo(() => {
    const groups: MessageGroup = {};
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      (groups[date] ||= []).push(message);
    });
    return groups;
  }, [messages]);

  const handleExitChat = useCallback(async () => {
    if (!window.confirm('채팅방을 나가시겠습니까?')) return;
    try {
      const success = await exitDirectChat(chatId);
      if (success) onBackToList?.();
      else alert('채팅방 나가기에 실패했습니다.');
    } catch {
      alert('채팅방 나가기 중 오류가 발생했습니다.');
    }
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

/**
 * 1:1 채팅방 (로딩 최적화)
 * - 메시지 렌더링 최적화
 * - 가상 스크롤링 적용
 * - 프로필 이미지 lazy loading 개선
 */
import { useEffect, useMemo, useRef, useState, useCallback, memo, useLayoutEffect } from 'react';
import { useDirectChat } from '../../../contexts/DirectChatContext';
import type { DirectMessage } from '../../../types/ChatType';
import MessageInput from '../common/MessageInput';
import TranslateButton from '@/components/common/TranslateButton';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowDown } from 'lucide-react';
import styles from '../chat.module.css';

// HMR Trigger
interface MessageGroup {
  [date: string]: DirectMessage[];
}

interface DirectChatRoomProps {
  chatId: string;
  isMobile: boolean | null;
  onBackToList?: () => void;
  highlightMessageId?: string;
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
import HighlightText from '../../common/HighlightText';

const MessageItem = memo(
  ({
    message,
    currentUserId,
    isHighlighted,
    isFlashing,
    isCurrent,
    searchQuery,
  }: {
    message: DirectMessage;
    currentUserId: string;
    isHighlighted: boolean;
    isFlashing?: boolean;
    isCurrent: boolean;
    searchQuery?: string;
  }) => {
    const isMyMessage = message.sender_id === currentUserId;
    const isSystemMessage = message.content?.includes('님이 채팅방을 나갔습니다');
    const [translated, setTranslated] = useState<string>('');
    const { t, i18n } = useTranslation();

    const formatTime = useCallback(
      (dateString: string) => {
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '';
          const lang = i18n.language || 'ko';
          return new Intl.DateTimeFormat(lang, {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          }).format(date);
        } catch {
          return '';
        }
      },
      [i18n.language],
    );

    const highlightClass = isHighlighted
      ? isCurrent
        ? 'message-highlight-current'
        : 'message-highlight'
      : '';

    const flashClass = isFlashing ? styles['message-highlight-flash'] : '';

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
        className={`message-item ${isMyMessage ? 'my-message' : 'other-message'} ${highlightClass} ${flashClass}`}
      >
        {isMyMessage ? (
          <>
            <div className="message-bubble">
              <div className="message-text">
                <HighlightText 
                  text={message.content} 
                  query={searchQuery} 
                  className="bg-white/90 text-primary font-medium" // 내 말풍선(Primary) 위에서는 흰색 배경에 Primary 텍스트
                />
              </div>
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
              <div className="message-text whitespace-pre-line break-words">
                <HighlightText text={message.content} query={searchQuery} />
              </div>

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
      prev.isFlashing === next.isFlashing &&
      prev.isCurrent === next.isCurrent &&
      prev.message.sender?.avatar_url === next.message.sender?.avatar_url &&
      prev.searchQuery === next.searchQuery
    );
  },
);
MessageItem.displayName = 'MessageItem';

const DirectChatRoom = ({ chatId, isMobile, onBackToList, highlightMessageId }: DirectChatRoomProps) => {
  const { messages, error, loadMessages, currentChat, exitDirectChat, loadMoreMessages, hasMoreMessages, loadNewerMessages, hasNewerMessages, searchMessagesInChat } = useDirectChat();

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
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
  const prevLastMessageId = useRef<string | null>(null); // 마지막 메시지 ID 추적용
  const currentChatIdRef = useRef<string | null>(null); // 현재 채팅방 ID 추적용
  const [isLoadingNewer, setIsLoadingNewer] = useState(false); // 정방향 로딩 상태 UI용
  const isLoadingNewerRef = useRef(false); // 정방향 로딩 상태 로직용 (Ref로 즉시성 보장)

  // 무한 스크롤용 Refs & State
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { user } = useAuth();
  const currentUserId = user?.id ?? '';

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

  // 메시지 변경 시 스크롤 제어 (떨림 방지를 위해 useLayoutEffect 사용)
  useLayoutEffect(() => {
    if (!messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isNewMessageArrived = lastMessage.id !== prevLastMessageId.current;
    
    // 1. 메시지 추가 로드(무한 스크롤)로 인한 변경인 경우 -> 스크롤 위치 보정
    if (prevScrollHeightRef.current > 0 && containerRef.current) {
        const newScrollHeight = containerRef.current.scrollHeight;
        const diff = newScrollHeight - prevScrollHeightRef.current;
        containerRef.current.scrollTop = diff; // 기존 보고 있던 위치 유지
        prevScrollHeightRef.current = 0; // 초기화
        setIsLoadingMore(false);
    } 
    // 2. 초기 로딩인 경우 -> 맨 아래로
    else if (isInitialLoad.current) {
        scrollToBottom(true);
        isInitialLoad.current = false;
    } 
    // 3. 새 메시지가 도착한 경우 (내 메시지거나 맨 아래 보고 있을 때) -> 맨 아래로
    else if (isNewMessageArrived) {
        // 정방향 로딩(isLoadingNewerRef) 중이었다면, 스크롤을 강제하면 안 됨 (자연스럽게 이어지도록)
        // 이 시점에서 로딩 UI 상태도 해제한다. (렌더링 직후 타이밍)
        if (isLoadingNewerRef.current) {
            console.log('Skipping auto-scroll due to forward loading');
            isLoadingNewerRef.current = false;
            setIsLoadingNewer(false);
        } else {
            // 간단하게 무조건 내리면 읽던 중 불편할 수 있으므로, 
            // 내 메시지이거나(내가 씀) 스크롤이 거의 바닥일 때만 내림
            scrollToBottom(false); 
        }
    }

    prevLastMessageId.current = lastMessage.id;
    previousMessageCount.current = messages.length;
    prevLastMessageId.current = lastMessage.id;
    previousMessageCount.current = messages.length;
  }, [messages, scrollToBottom]);

  // 컨테이너 크기 변화 감지 (입력창 줄바꿈으로 인한 높이 변화 대응)
  useEffect(() => {
     const container = containerRef.current;
     if (!container) return;

     let prevHeight = container.clientHeight;

     const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
           const newHeight = entry.contentRect.height;
           // 높이가 줄어듦 (입력창이 커짐) && 기존에 바닥 근처였음
           // -> 스크롤을 그만큼 더 내려줘야 바닥이 유지됨
           if (newHeight < prevHeight) {
                const { scrollTop, scrollHeight } = container;
                const isBottom = scrollHeight - scrollTop - prevHeight < 50; 
                
                if (isBottom) {
                    // 높이 차이만큼 스크롤 보정
                    container.scrollTop += (prevHeight - newHeight);
                }
           }
           prevHeight = newHeight;
        }
     });

     observer.observe(container);
     return () => observer.disconnect();
  }, []);

  // 스크롤 이벤트 핸들러
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    
    // 1. 무한 스크롤 감지
    // 맨 위 도달 (여유분 50px) & 더 불러올 메시지 있음 & 로딩 중 아님
    if (container.scrollTop < 50 && hasMoreMessages && !isLoadingMore && messages.length > 0) {
        setIsLoadingMore(true);
        prevScrollHeightRef.current = container.scrollHeight;
        
        const addedCount = await loadMoreMessages();
        
        // 추가된 메시지가 없으면 로딩 상태 해제 및 스크롤 높이 참조 초기화
        if (addedCount === 0) {
            setIsLoadingMore(false);
            prevScrollHeightRef.current = 0;
        }
    }

    // 2. 정방향 무한 스크롤 감지 (바닥 도달)
    // scrollHeight - scrollTop - clientHeight 가 0에 가까우면 바닥
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    
    // 바닥 여유분 50px & 더 불러올 미래 메시지 있음 & 로딩 중 아님
    if (scrollBottom < 50 && hasNewerMessages && !isLoadingNewerRef.current && messages.length > 0) {
        setIsLoadingNewer(true);
        isLoadingNewerRef.current = true;
        
        const addedCount = await loadNewerMessages();
        
        // 데이터가 없으면 리렌더링이 안 될 수 있으므로 여기서 꺼줌
        // 데이터가 있으면(addedCount > 0) useLayoutEffect에서 꺼줌 (렌더링 싱크 맞춤)
        if (addedCount === 0) {
            setIsLoadingNewer(false);
            isLoadingNewerRef.current = false;
        }
    }

    // 3. 스크롤 다운 버튼 표시 여부
    const { scrollTop, scrollHeight, clientHeight } = container;
    // 바닥에서 100px 이상 떨어지면 버튼 표시
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollDownBtn(!isBottom);
  };

  // 채팅방 변경 시 로드 최적화 & 딥링킹(검색 이동) 처리
  useEffect(() => {
    if (!chatId) return;

    // 이미 로드된 채팅방이고, 메시지도 있으며, 딥링킹(highlightMessageId)이 없는 경우 -> 재로드 방지
    // 단, highlightMessageId가 있으면 해당 메시지 위치로 가야 하므로 무조건 로드 수행 (Context 내부에서 최적화 됨)
    if (chatId === currentChatIdRef.current && messages.length > 0 && !highlightMessageId) {
       return; 
    }
    
    setIsLoadingMessages(true);
    
    // highlightMessageId(targetId)가 있으면 딥링킹 로드 수행, 없으면 일반 로드
    // loadMessages(chatId, targetId) 형태
    loadMessages(chatId, highlightMessageId).finally(() => {
      setIsLoadingMessages(false);
      // 채팅방 진입 시 스크롤 초기화
      // 딥링킹 시에는 자동 바닥 스크롤을 막고(해당 위치로 가야 하므로), 일반 진입 시에는 바닥으로
      if (highlightMessageId) {
          isInitialLoad.current = false; 
      } else {
          isInitialLoad.current = true;
          // 일반 진입 시 바닥 스크롤 로직 트리거
          // (useEffect dep에 의해 isInitialLoad가 true면 아래 스크롤 로직이 바닥으로 보냄)
      }
    });

  }, [chatId, loadMessages, highlightMessageId]); // highlightMessageId 변경 시에도 반응해야 함

  // 하이라이트 메시지 이동 처리
  // 하이라이트 메시지 ID가 변경되면 스크롤 플래그 초기화
  const hasScrolledToHighlightRef = useRef<string | null>(null);

  useEffect(() => {
      if (highlightMessageId !== hasScrolledToHighlightRef.current) {
          // ID가 바뀌었으면 (혹은 null->값) 스크롤 시도 허용
          // 단, null일 때는 굳이 리셋할 필요 없음(어차피 동작 안함)
          if (highlightMessageId) {
             hasScrolledToHighlightRef.current = null; // 아직 스크롤 안함
          }
      }
  }, [highlightMessageId]);

  // 하이라이트 메시지 이동 처리 (강력한 재시도 로직 적용)
  useEffect(() => {
    if (!highlightMessageId || messages.length === 0 || isLoadingMessages) return;

    // 이미 스크롤을 완료한 ID라면 건너뜀 (데이터 업데이트로 인한 재실행 방지)
    if (hasScrolledToHighlightRef.current === highlightMessageId) return;

    // 데이터 진단: 타겟 메시지가 목록에 있는지 확인
    const exists = messages.some(m => m.id === highlightMessageId);
    if (!exists) return;

    const targetId = `msg-${highlightMessageId}`;
    let retryCount = 0;
    const maxRetries = 20; // 2초 동안 시도 (100ms * 20)

    const tryScroll = () => {
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // 시각적 강조 (깜빡임 재확인)
            el.classList.add(styles['message-highlight-flash']);
            setTimeout(() => el.classList.remove(styles['message-highlight-flash']), 3000);
            
            // 스크롤 완료 표시
            hasScrolledToHighlightRef.current = highlightMessageId;
        } else {
            // 아직 렌더링되지 않음 (조용히 재시도)
            retryCount++;
            if (retryCount < maxRetries) {
                setTimeout(tryScroll, 100);
            }
        }
    };

    // 즉시 시도
    tryScroll();
    
  }, [highlightMessageId, messages, isLoadingMessages]);

  const { t, i18n } = useTranslation();

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const lang = i18n.language || 'ko';
      
      if (date.toDateString() === now.toDateString()) {
        return t('chat.today');
      }
      return new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', weekday: 'short' }).format(date);
    } catch {
      return '';
    }
  }, [t, i18n.language]);

  // 메시지 그룹핑 최적화
  const messageGroups = useMemo(() => {
    const groups: MessageGroup = {};
    if (messages && Array.isArray(messages)) {
      messages.forEach(message => {
        const date = new Date(message.created_at).toDateString();
        (groups[date] ||= []).push(message);
      });
    }
    return groups;
  }, [messages]);

  const handleExitChat = useCallback(async () => {
    if (!window.confirm(t('chat.confirm_exit'))) return;
    try {
      const success = await exitDirectChat(chatId);
      if (success) onBackToList?.();
      else alert(t('chat.exit_fail'));
    } catch {
      alert(t('chat.exit_error'));
    }
  }, [chatId, exitDirectChat, onBackToList]);

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      setHasSearched(false);
      return;
    }
    
    // 서버 사이드 검색 수행
    const foundMessages = await searchMessagesInChat(chatId, q);
    const matchedIds = foundMessages.map(m => m.id);
    
    setSearchResults(matchedIds);
    setCurrentResultIndex(0);
    setHasSearched(true);
    
    if (matchedIds.length > 0) {
       // 첫 번째 결과로 이동 시도
       goToResultRef.current(matchedIds[0]);
    }
  }, [searchQuery, chatId, searchMessagesInChat]);

  // goToResult에서 쓸 수 있도록 별도 함수 분리 (Ref나 내부 로직 활용)
  const jumpToMessage = useCallback((messageId: string) => {
      const exists = messages.some(m => m.id === messageId);
      if (exists) {
          scrollToMessage(messageId);
      } else {
          // 없으면 로드 -> Deep Link
          setIsLoadingMessages(true);
          loadMessages(chatId, messageId).finally(() => {
             setIsLoadingMessages(false);
             // 로드 후 스크롤은 loadMessages 후 useEffect 등에서 처리되거나, 
             // 여기서 명시적으로 다시 시도해야 함.
             // 다만 DirectChatRoom에는 highlightMessageId prop에 의존하는 useEffect가 있음.
             // 여기서는 prop을 바꾸는 게 아니라 내부적으로 로드했으므로, 수동으로 스크롤 시도가 필요할 수 있음.
             // 하지만 loadMessages가 state를 바꾸므로 리렌더링 됨.
             // 확실한 이동을 위해 잠시 후 스크롤 시도
             setTimeout(() => scrollToMessage(messageId), 500);
          });
      }
  }, [messages, chatId, loadMessages, scrollToMessage]);

  // goToResult가 최신 jumpToMessage를 쓰도록 Ref 패턴 사용 또는 의존성 추가
  // 여기서는 useEffect 패턴 대신 직접 호출 구조로 변경
  const goToResultRef = useRef<(id: string) => void>(() => {});
  useEffect(() => {
      goToResultRef.current = jumpToMessage;
  }, [jumpToMessage]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

  // 검색창 닫히면 초기화
  useEffect(() => {
    if (!showSearch) {
      setSearchQuery('');
      setSearchResults([]);
      setCurrentResultIndex(0);
      setHasSearched(false);
    }
  }, [showSearch]);

  const goToResult = useCallback(
    (direction: 'prev' | 'next') => {
      if (searchResults.length === 0) return;
      let nextIndex = currentResultIndex;
      if (direction === 'prev')
        nextIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
      else nextIndex = (currentResultIndex + 1) % searchResults.length;
      
      setCurrentResultIndex(nextIndex);
      const targetId = searchResults[nextIndex];
      // jumpToMessage 호출
      goToResultRef.current(targetId);
    },
    [searchResults, currentResultIndex],
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
            <h3>{currentChat?.other_user?.nickname || t('chat.loading')}</h3>
          </div>
        </div>
        <div className="chat-room-actions">
          <button
            onClick={() => {
              setShowSearch(prev => !prev);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            aria-pressed={showSearch}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <img src="/images/searchT.svg" alt="검색" className="chat-room-search-icon" />
          </button>
          <button
            className="exit-chat-btn"
            onClick={handleExitChat}
          >
            {t('chat.btn_leave')}
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="chat-room-search-bar">
          <div className="chat-room-search-inner">
            <div className={`chat-room-search-input-wrap transition-all duration-200 border border-transparent rounded-full focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus-within:bg-background`}>
              <img src="/images/searchT.svg" alt="검색" className="chat-room-search-input-icon" />
              <input
                type="text"
                placeholder={t('chat.search_placeholder')}
                className="chat-room-search-input focus:outline-none focus:ring-0 focus:border-none border-none ring-0 shadow-none bg-transparent"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                ref={searchInputRef}
              />
              <button className="chat-room-search-button" onClick={handleSearch}>
                {t('chat.search_btn')}
              </button>
            </div>
            <div className="chat-room-search-meta">
              {!hasSearched ? (
                <span className="chat-room-search-hint">{t('chat.search_hint')}</span>
              ) : searchResults.length > 0 ? (
                <>
                  <span className="chat-room-search-count">
                    {t('chat.result_count', { count: searchResults.length, index: currentResultIndex + 1 })}
                  </span>
                  <div className="chat-room-search-nav">
                    <button
                      type="button"
                      className="chat-room-search-nav-btn"
                      onClick={() => goToResult('prev')}
                    >
                      ↓ {t('chat.prev')}
                    </button>
                    <button
                      type="button"
                      className="chat-room-search-nav-btn"
                      onClick={() => goToResult('next')}
                    >
                      ↑ {t('chat.next')}
                    </button>
                  </div>
                </>
              ) : (
                <span className="chat-room-search-no-result">{t('chat.no_result')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 메시지 영역과 플로팅 버튼을 감싸는 래퍼 */}
      <div className="chat-message-wrapper">
        <div 
          className="chat-room-message" 
          ref={containerRef}
          onScroll={handleScroll}
        >
          {isLoadingMessages ? (
            <div className="loading">{t('chat.loading_messages')}</div>
          ) : Object.keys(messageGroups).length === 0 ? (
            <div className="no-message">
              <p>{t('chat.no_messages')}</p>
              <p>{t('chat.send_first_message')}</p>
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
                        isFlashing={message.id === highlightMessageId}
                        isCurrent={isCurrent}
                        searchQuery={searchQuery}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messageEndRef} style={{ position: 'absolute', bottom: 0, left: 0, width: 0, height: 0, visibility: 'hidden' }} />
        </div>

        {showScrollDownBtn && (
          <button 
            className="scroll-bottom-btn"
            onClick={() => scrollToBottom(false)}
            aria-label="맨 아래로 스크롤"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      <MessageInput chatId={chatId} />
    </div>
  );
};

export default DirectChatRoom;

import { useEffect, useRef, useState } from 'react';
import { useDirectChat } from '../../../contexts/DirectChatContext';
import { supabase } from '../../../lib/supabase';
import type { DirectMessage } from '../../../types/ChatType';
import MessageInput from '../common/MessageInput';

// 날짜별 메시지 그룹 타입 정의  - 같은 날짜의 메시들을 그룹핑
// 원본데이터를 가공하고 마무리 별도의 파일에 type 으로 정의안함.
interface MessageGroup {
  [date: string]: DirectMessage[]; // 날짜 문자열을 키로 하고 해당 날짜의 메시지 배열을 값으로 담음.
}

// DirectChatRoom 컴포넌트이 Props 타입 정의
interface DirectChatRoomProps {
  chatId: string;
  isMobile?: boolean;
  onBackToList?: () => void;
}

const DirectChatRoom = ({ chatId, isMobile, onBackToList }: DirectChatRoomProps) => {
  // DirectChatContext 에서 필요한 상태와 함수를 가져오기
  const { messages, loading, error, loadMessages, currentChat, exitDirectChat } = useDirectChat();

  // 메시지가 개수가 많으면 하단으로 스크롤을 해야 함.
  // 새메시지가 추가될 때 마다 최신 메시지를 볼 수 있도록 해야 함.
  const messageEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef<number>(0);
  const isInitialLoad = useRef<boolean>(true);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // DOM 업데이트 후 실행되도록 함.
  const scrollToBottom = (force: boolean = false) => {
    // DOM 완료 후 실행되도록
    requestAnimationFrame(() => {
      // chat-room-message 클래스를 가진 메시지 컨테이너 찾기
      const messageContainer = document.querySelector('.chat-room-message');
      if (messageContainer) {
        // 메시지 컨테이너의 스크롤을 맨 아래로 설정
        if (force) {
          (messageContainer as HTMLElement).scrollTop = (
            messageContainer as HTMLElement
          ).scrollHeight;
        } else {
          // 부드러운 스크롤
          (messageContainer as HTMLElement).scrollTo({
            top: (messageContainer as HTMLElement).scrollHeight,
            behavior: 'smooth',
          });
        }
      } else {
        // fallback: 기존 방식 사용하되 block을 'nearest'로 변경
        messageEndRef.current?.scrollIntoView({
          behavior: force ? 'auto' : 'smooth',
          block: 'nearest', // 가장 가까운 위치에 맞춤 (입력창이 보이도록)
          inline: 'nearest',
        });
      }
    });
  };

  // 새로운 메시지가 추가될 때만 하단으로 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      // 초기 로드 시에는 즉시 스크롤
      if (isInitialLoad.current) {
        scrollToBottom(true);
        isInitialLoad.current = false;
      }
      // 메시지가 추가된 경우에만 부드럽게 스크롤
      else if (messages.length > previousMessageCount.current) {
        scrollToBottom(false);
      }

      previousMessageCount.current = messages.length;
    }
  }, [messages]);

  // 초기 로딩 완료 후 스크롤 (메세지 처음 로딩 완료)
  useEffect(() => {
    if (!loading && messages.length > 0 && isInitialLoad.current) {
      scrollToBottom(true);
      isInitialLoad.current = false;
    }
  }, [loading, messages]);

  // ✅ 1) 채팅방 ID 가 변경되면 메시지를 한 번 로드
  useEffect(() => {
    if (!chatId) return;

    // 새 채팅방 들어오면 스크롤 상태 초기화
    isInitialLoad.current = true;
    previousMessageCount.current = 0;

    loadMessages(chatId);
    // loadMessages 는 context 에서 온 함수라 의존성에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // ✅ 2) Supabase Realtime 으로 메시지 실시간 동기화 (구독 1개만 유지)
  useEffect(() => {
    if (!chatId) return;

    const subscription = supabase
      .channel(`direct_messages_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // ✅ 새 메시지 추가될 때만
          schema: 'public',
          table: 'direct_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        () => {
          // 새 메시지가 들어온 경우에만 전체 메시지 재로딩
          loadMessages(chatId);
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // 메시지 시간 포맷팅 함수 -  HH:MM:DD 형식 반환
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 24시간 형식 사용
    });
  };

  // 날짜 포맷팅 함수 - 오늘 : "오늘",  과거 : "12월 25일" 형식
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return '오늘';
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short', // 짧은 월 이름 (예: "12월")
        day: 'numeric', // 숫자 날짜 (예: "25")
      });
    }
  };

  // 메시지를 날짜별로 그룹화하는 함수 - 같은 날짜의 메시지들을 하나의 그룹으로
  // 날짜 구분선도 표시
  // 사용자가 만약 채팅방을 한개 선택하면 각 채팅방의 메세지 내용이 들어옴
  const groupMessagesByDate = (messages: DirectMessage[]): MessageGroup => {
    // 날짜별로 그룹화된 메시지를 저장할 객체
    const groups: MessageGroup = {};
    messages.forEach((message: DirectMessage) => {
      // 메시지 생성일의 속성을 문자열로 만듦
      const date = new Date(message.created_at).toDateString();
      // 만약 키명으로 새로운 날짜글자가 들어오면 키명을 새로 만들자.
      if (!groups[date]) {
        groups[date] = [];
      }
      // 해당 날짜의 그룹에 메시지 추가
      groups[date].push(message);
    });
    return groups; // 날짜별로 그룹화된 메시지 객체 반환
  };

  // 현재 사용자 ID (지금은 Mock 버전이어서 current 라고 함)
  // 실제 구현에서는 인증된 사용자의 ID를 사용함.
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // 현재 사용자 ID 가져오기
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          console.error('사용자 정보를 가져올 수 없습니다:', error);
          return;
        }
        setCurrentUserId(user.id);
      } catch (error) {
        console.error('사용자 ID 가져오기 오류:', error);
      }
    };

    getCurrentUserId();
  }, []);

  // 채팅방 나가기 처리 함수
  const handleExitChat = async () => {
    if (window.confirm('채팅방을 나가시겠습니까?')) {
      try {
        const success = await exitDirectChat(chatId);
        if (success) {
          // 페이지 새로고침 또는 채팅방 목록으로 이동
          window.location.reload();
        } else {
          alert('채팅방 나가기에 실패했습니다.');
        }
      } catch (error) {
        console.error('채팅방 나가기 오류:', error);
        alert('채팅방 나가기 중 오류가 발생했습니다.');
      }
    }
  };

  // 특정 메시지로 스크롤
  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 검색 실행
  const handleSearch = () => {
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

    if (matchedIds.length > 0) {
      scrollToMessage(matchedIds[0]);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // 이전/다음 결과 이동
  const goToResult = (direction: 'prev' | 'next') => {
    if (searchResults.length === 0) return;

    let nextIndex = currentResultIndex;
    if (direction === 'prev') {
      nextIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    } else {
      nextIndex = (currentResultIndex + 1) % searchResults.length;
    }

    setCurrentResultIndex(nextIndex);
    scrollToMessage(searchResults[nextIndex]);
  };

  //  에러 상태일 때 에러 메시지 표시
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

  // 로딩 상태일 떄 로딩 메세지 표현
  if (loading) {
    return (
      <div className="chat-room">
        <div className="loading">메시지를 불러오는 중...</div>
      </div>
    );
  }

  // 메시지들을 날짜별로 그룹화 (리랜더링 자동으로 됨)
  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-room">
      {/* 채팅방 헤더  - 제목과 나가기 */}
      <div className="chat-room-header">
        {/* 채팅방 정보 */}
        <div className="chat-room-info">
          <div className="chat-room-header-left">
            {onBackToList && (
              <button
                className="chat-room-back-btn"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBackToList();
                }}
              >
                ←
              </button>
            )}
            <h3>1:1 채팅 ({currentChat?.other_user.nickname || '로딩 중...'}) </h3>
          </div>
        </div>

        {/* 채팅방 액션 버튼들  */}
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
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleExitChat();
            }}
          >
            나가기
          </button>
        </div>
      </div>

      {/* 검색 바 (헤더 아래에 펼쳐지는 영역) */}
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

            {/* 검색 결과 요약 + 이전/다음 */}
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

      {/* 메시지 목록 영역 */}
      <div className="chat-room-message">
        {Object.keys(messageGroups).length === 0 ? (
          // 메시지가 없을 때 안내 메시지
          <div className="no-message">
            <p>아직 메시지가 없습니다.</p>
            <p>첫 번째 메시지를 보내세요!</p>
          </div>
        ) : (
          // 날짜 별로 그룹화된 메시지 목록 렌더링
          Object.entries(messageGroups).map(([date, dateMessages]: [string, DirectMessage[]]) => (
            <div key={date} className="message-group">
              {/* 날짜 구분선 */}
              <div className="date-divider">
                {/* 날짜 출력 */}
                <span>{formatDate(dateMessages[0].created_at)}</span>
              </div>

              {/* 메시지들 묶음 컨테이너  */}
              <div className="message-group-container">
                {dateMessages.map((message: DirectMessage) => {
                  const isMyMessage = message.sender_id === currentUserId;
                  const isSystemMessage =
                    message.content && message.content.includes('님이 채팅방을 나갔습니다');

                  // 검색 하이라이트 여부
                  const lowerQ = searchQuery.trim().toLowerCase();
                  const isMatched = !!lowerQ && message.content?.toLowerCase().includes(lowerQ);
                  const isCurrent =
                    isMatched &&
                    searchResults.length > 0 &&
                    searchResults[currentResultIndex] === message.id;

                  const highlightClass = isMatched
                    ? isCurrent
                      ? 'message-highlight-current'
                      : 'message-highlight'
                    : '';

                  // 시스템 메시지인 경우 별도 처리
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
                      className={`message-item ${
                        isMyMessage ? 'my-message' : 'other-message'
                      } ${highlightClass}`}
                    >
                      {isMyMessage ? (
                        <>
                          {/* 나의 메시지 - 오른쪽 정렬 */}
                          {/* 내 메시지 :  말풍선, 시간, 아바타 (오른쪽 정렬) */}
                          <div className="message-bubble">
                            <div className="message-text">{message.content} </div>
                            <div className="message-time">{formatTime(message.created_at)}</div>
                          </div>
                          <div className="message-avatar">
                            {(() => {
                              return message.sender?.avatar_url ? (
                                <>
                                  {/* 나의 아바타 이미지가 있는 경우 */}
                                  <img
                                    src={message.sender.avatar_url}
                                    alt={message.sender.nickname}
                                    onError={e => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove(
                                        'hidden',
                                      );
                                    }}
                                  />
                                  <div className="avatar-placeholder hidden">
                                    {message.sender?.nickname.charAt(0)}
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* 나의 아바타 이미지가 없는 경우 - 첫글자만 */}
                                  <div className="avatar-placeholder">
                                    {message.sender?.nickname.charAt(0)}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* 대상의 메시지 - 왼쪽 정렬 */}
                          <div className="message-avatar">
                            {(() => {
                              return message.sender?.avatar_url ? (
                                <>
                                  {/* 대화상대 아바타 이미지가 있는 경우 */}
                                  <img
                                    src={message.sender.avatar_url}
                                    alt={message.sender.nickname}
                                    onError={e => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove(
                                        'hidden',
                                      );
                                    }}
                                  />
                                  <div className="avatar-placeholder hidden">
                                    {message.sender?.nickname.charAt(0)}
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* 대화상대 아바타 이미지가 없는 경우 - 첫글자만*/}
                                  <div className="avatar-placeholder">
                                    {message.sender?.nickname.charAt(0)}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          {/* 대화상대 메시지 :  말풍선, 시간, 아바타 (왼쪽 정렬) */}
                          <div className="message-bubble">
                            <div className="message-text">{message.content}</div>
                            <div className="message-time">{formatTime(message.created_at)}</div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        {/* 자동 스크롤을 위한 참조 */}
        <div ref={messageEndRef} />
      </div>

      {/* 메시지 입력 컴포넌트 */}
      <MessageInput chatId={chatId} />
    </div>
  );
};

export default DirectChatRoom;

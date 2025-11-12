/**
 * 채팅 목록 (최적화)
 * - 디바운스 개선
 * - 불필요한 리렌더링 제거
 * - 메모이제이션 강화
 */
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useDirectChat } from '../../../contexts/DirectChatContext';
import type { ChatUser } from '../../../types/ChatType';

interface DirectChatListProps {
  onChatSelect: (chatId: string) => void;
  onCreateChat: () => void;
  selectedChatId?: string;
}

// 🚀 채팅 아이템 메모이제이션
const ChatItem = memo(
  ({
    chat,
    isSelected,
    onSelect,
  }: {
    chat: any;
    isSelected: boolean;
    onSelect: (id: string) => void;
  }) => {
    const formatTime = useCallback((dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }, []);

    return (
      <div
        className={`chat-item ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(chat.id)}
      >
        <div className="chat-avatar">
          {chat.other_user.avatar_url ? (
            <img src={chat.other_user.avatar_url} alt={chat.other_user.nickname} />
          ) : (
            <div className="avatar-placeholder">{chat.other_user.nickname.charAt(0)}</div>
          )}
          {chat.unread_count > 0 && <div className="unread-badge">{chat.unread_count}</div>}
        </div>
        <div className="chat-info">
          <div className="chat-header">
            <div className="chat-name-row">
              <div className="chat-name">{chat.other_user.nickname}</div>
              {chat.is_new_chat && <span className="chat-new-badge">NEW</span>}
            </div>
            <div className="chat-time">
              {chat.last_message ? formatTime(chat.last_message.created_at) : ''}
            </div>
          </div>
          <div className="chat-preview">
            {chat.last_message ? (
              <span className={chat.unread_count > 0 ? 'unread' : ''}>
                {chat.last_message.sender_nickname} : {chat.last_message.content}
              </span>
            ) : (
              <span className="no-message">메시지가 없습니다.</span>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.chat.id === next.chat.id &&
      prev.isSelected === next.isSelected &&
      prev.chat.unread_count === next.chat.unread_count &&
      prev.chat.last_message?.content === next.chat.last_message?.content &&
      prev.chat.last_message?.created_at === next.chat.last_message?.created_at &&
      prev.chat.is_new_chat === next.chat.is_new_chat
    );
  },
);
ChatItem.displayName = 'ChatItem';

// 🚀 사용자 검색 아이템 메모이제이션
const UserItem = memo(
  ({ user, onSelect }: { user: ChatUser; onSelect: (user: ChatUser) => void }) => {
    return (
      <div className="user-item" onClick={() => onSelect(user)}>
        <div className="user-avatar">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.nickname} />
          ) : (
            <div className="avatar-placeholder">{user.nickname.charAt(0)}</div>
          )}
        </div>
        <div className="user-info">
          <div className="user-nickname">{user.nickname}</div>
        </div>
      </div>
    );
  },
  (prev, next) => prev.user.id === next.user.id,
);
UserItem.displayName = 'UserItem';

const DirectChatList = ({ onChatSelect, onCreateChat, selectedChatId }: DirectChatListProps) => {
  const { createDirectChat, error, users, searchUsers, userSearchLoading, chats } = useDirectChat();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showUserSearch, setShowUserSearch] = useState<boolean>(false);

  // 🚀 디바운스 개선 (useRef + cleanup)
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    // 이전 타이머 취소
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    // 300ms 디바운스
    debounceRef.current = window.setTimeout(() => {
      searchUsers(trimmed);
      debounceRef.current = null;
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [searchTerm, searchUsers]);

  const handleUserSelect = useCallback(
    async (user: ChatUser) => {
      const chatId = await createDirectChat(user.id);
      if (chatId) {
        onChatSelect(chatId);
        setShowUserSearch(false);
        setSearchTerm('');
      }
    },
    [createDirectChat, onChatSelect],
  );

  const handleChatSelect = useCallback(
    (chatId: string) => {
      onChatSelect(chatId);
    },
    [onChatSelect],
  );

  if (error) {
    return (
      <div className="chat-list">
        <div className="error-message">
          <p>오류 : {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <div className="chat-list-title">
          <h2>1 : 1 채팅</h2>
        </div>
        <button className="new-chat-btn" onClick={() => setShowUserSearch(!showUserSearch)}>
          새 채팅
        </button>
      </div>

      {showUserSearch && (
        <div className="user-search">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="사용자 검색..."
            className="search-input"
          />
          <div className="search-result">
            {userSearchLoading ? (
              <div className="loading">사용자 검색 중...</div>
            ) : (
              users.map(user => <UserItem key={user.id} user={user} onSelect={handleUserSelect} />)
            )}
          </div>
          {searchTerm && !userSearchLoading && users.length === 0 && (
            <div className="no-results">검색 결과가 없습니다.</div>
          )}
        </div>
      )}

      <div className="chat-items">
        {chats.length === 0 ? (
          <div className="no-chats">
            <p>아직 채팅방이 없습니다.</p>
            <p>새 채팅 버튼을 눌러 대화를 시작하세요!</p>
          </div>
        ) : (
          chats.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChatId === chat.id}
              onSelect={handleChatSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DirectChatList;

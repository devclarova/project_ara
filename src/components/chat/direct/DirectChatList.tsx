import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useDirectChat } from '../../../contexts/DirectChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import type { ChatUser } from '../../../types/ChatType';
import ReportButton from '@/components/common/ReportButton';
import BlockButton from '@/components/common/BlockButton';
import HighlightText from '../../common/HighlightText';
// HMR Trigger
interface DirectChatListProps {
  onChatSelect: (chatId: string) => void;
  onCreateChat: () => void;
  selectedChatId?: string;
}
// 채팅 아이템 메모이제이션
const ChatItem = memo(
  ({
    chat,
    isSelected,
    onSelect,
    currentUserId,
  }: {
    chat: any;
    isSelected: boolean;
    onSelect: (id: string) => void;
    currentUserId?: string;
  }) => {
    const { t, i18n } = useTranslation();
    // Main 브랜치의 robust한 시간 포맷팅 로직 유지 (I18N + 24시 처리)
    const formatTime = useCallback((dateString: string) => {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const lang = i18n.language || 'ko';
        if (diff < 24 * 60 * 60 * 1000) {
          return new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
        } else {
          return new Intl.DateTimeFormat(lang, { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          }).format(date);
        }
      } catch (e) {
        return '';
      }
    }, [i18n.language]);
    // 팀원(10-zzeon)의 새로운 기능(신고/차단 메뉴) State & Hooks 병합
    const [showMenu, setShowMenu] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
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
    return (
      <div
        className={`chat-item ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(chat.id)}
      >
        <div className="chat-avatar">
          {chat.other_user.avatar_url ? (
            <img src={chat.other_user.avatar_url} alt={chat.other_user.nickname} loading="lazy" decoding="async" />
          ) : (
            <div className="avatar-placeholder">{chat.other_user.nickname.charAt(0)}</div>
          )}
          {chat.unread_count > 0 && <div className="unread-badge">{chat.unread_count}</div>}
        </div>
        <div className="chat-info">
          <div className="chat-header">
            <div className="chat-name-row">
              <div className="chat-name">{chat.other_user.nickname}</div>
            </div>
            <div className="flex items-center gap-1">
              <div className="chat-time">
                {chat.last_message ? formatTime(chat.last_message.created_at) : ''}
              </div>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(prev => !prev);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition"
                >
                  <i className="ri-more-2-fill text-gray-500 dark:text-gray-400 text-lg leading-none block" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg py-2 z-50">
                    <ReportButton onClose={() => setShowMenu(false)} />
                    <BlockButton
                      username={chat.other_user.nickname} // BlockButton이 이 prop을 받는지 확인 필요하지만, snippet 기반으로 유지
                      isBlocked={isBlocked}
                      onToggle={() => setIsBlocked(prev => !prev)}
                      onClose={() => setShowMenu(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="chat-preview">
            {chat.last_message ? (
              <span className={chat.unread_count > 0 ? 'unread' : ''}>
                {chat.last_message.sender_id === currentUserId 
                  ? t('chat.me') 
                  : (chat.last_message.sender_nickname || chat.other_user.nickname)} : {chat.last_message.content}
              </span>
            ) : (
              <span className="no-message">{t('chat.no_messages')}</span>
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
      prev.chat.is_new_chat === next.chat.is_new_chat &&
      prev.currentUserId === next.currentUserId
    );
  },
);
ChatItem.displayName = 'ChatItem';
// 사용자 검색 아이템 메모이제이션
const UserItem = memo(
  ({ user, onSelect, query }: { user: ChatUser; onSelect: (user: ChatUser) => void; query?: string }) => {
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
          <div className="user-nickname">
            <HighlightText text={user.nickname} query={query} />
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => prev.user.id === next.user.id && prev.query === next.query,
);
UserItem.displayName = 'UserItem';
const DirectChatList = ({ onChatSelect, onCreateChat, selectedChatId }: DirectChatListProps) => {
  const { createDirectChat, error, users, searchUsers, clearSearchResults, userSearchLoading, chats } = useDirectChat();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showUserSearch, setShowUserSearch] = useState<boolean>(false);
  // 디바운스 개선 (useRef + cleanup)
  const debounceRef = useRef<number | null>(null);
  const userSearchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // 이전 타이머 취소
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      clearSearchResults(); // 검색어 없으면 결과 초기화
      return;
    }
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
          <h2>{t('chat.title_direct_chat')}</h2>
        </div>
        <button 
          className="new-chat-btn" 
          onClick={() => {
            if (!showUserSearch) {
              setSearchTerm('');
              clearSearchResults();
              setTimeout(() => userSearchInputRef.current?.focus(), 100);
            }
            setShowUserSearch(!showUserSearch);
          }}
          aria-label={t('chat.btn_new_chat')}
          title={t('chat.btn_new_chat')}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {showUserSearch && (
        <div className="user-search">
            <div className="flex items-center w-full px-4 h-10 bg-background border border-border rounded-full focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200 shadow-sm">
              <img src="/images/searchT.svg" alt="검색" className="chat-room-search-input-icon mr-2" />
              <input
                ref={userSearchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('chat.user_search_placeholder')}
                className="w-full bg-transparent border-none outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none text-sm placeholder:text-muted-foreground"
              />
            </div>
          <div className="search-result">
            {userSearchLoading ? (
              <div className="loading">{t('chat.user_search_loading')}</div>
            ) : (
              users.map(user => (
                <UserItem 
                  key={user.id} 
                  user={user} 
                  onSelect={handleUserSelect} 
                  query={searchTerm} // 검색어 전달
                />
              ))
            )}
          </div>
          {searchTerm && !userSearchLoading && users.length === 0 && (
            <div className="no-results">{t('chat.no_result')}</div>
          )}
        </div>
      )}
      <div className="chat-items">
        {chats.length === 0 ? (
          <div className="no-chats">
            <p>{t('chat.no_chats')}</p>
            <p>{t('chat.start_conversation')}</p>
          </div>
        ) : (
          chats.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChatId === chat.id}
              onSelect={handleChatSelect}
              currentUserId={user?.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
export default DirectChatList;
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useDirectChat } from '../../../contexts/DirectChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import type { ChatUser } from '../../../types/ChatType';
import ReportButton from '@/components/common/ReportButton';
import BlockButton from '@/components/common/BlockButton';
import HighlightText from '../../common/HighlightText';
import { formatChatListDate } from '@/utils/dateUtils';
import { BanBadge } from '@/components/common/BanBadge';
// HMR Trigger
interface DirectChatListProps {
  onChatSelect: (chatId: string) => void;
  onCreateChat: () => void;
  selectedChatId?: string;
  onLeave?: () => void;
}

import { useNavigate } from 'react-router-dom';
import Modal from '@/components/common/Modal';
import ReportModal from '@/components/common/ReportModal';
import { OnlineIndicator } from '@/components/common/OnlineIndicator';

// 채팅 아이템 메모이제이션
const ChatItem = memo(
  ({
    chat,
    isSelected,
    onSelect,
    currentUserId,
    onLeave,
    onReport,
  }: {
    chat: any;
    isSelected: boolean;
    onSelect: (id: string) => void;
    currentUserId?: string;
    onLeave: (chatId: string) => void;
    onReport: (targetId: string, type: 'chat' | 'user') => void;
  }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const handleAvatarClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        const target = chat.other_user.username || chat.other_user.id;
        if (target) {
          navigate(`/profile/${target}`);
        }
      },
      [chat.other_user, navigate],
    );

    // dateUtils를 사용한 날짜 포맷팅.
    const formatTime = useCallback(
      (dateString: string) => {
        return formatChatListDate(dateString);
      },
      [i18n.language], // locale 변경 시 리렌더링 (formatChatListDate 내부에서 getLocale 호출)
    );
    // 팀원(10-zzeon)의 새로운 기능(신고/차단 메뉴) State & Hooks 병합
    const [showMenu, setShowMenu] = useState(false);

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
        <div className="chat-avatar cursor-pointer" onClick={handleAvatarClick}>
          {chat.other_user.avatar_url ? (
            <img
              src={chat.other_user.avatar_url}
              alt={chat.other_user.nickname}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="avatar-placeholder">{chat.other_user.nickname.charAt(0)}</div>
          )}
          <OnlineIndicator
            userId={chat.other_user.id}
            size="sm"
            className="absolute bottom-0 right-0 z-10 border-white dark:border-secondary border-2"
          />
          {chat.unread_count > 0 && <div className="unread-badge">{chat.unread_count}</div>}
        </div>
        <div className="chat-info">
          <div className="chat-header">
            <div className="chat-name-row">
              <div className="chat-name flex items-center gap-1">
                <span>{chat.other_user.nickname}</span>
                <BanBadge
                  bannedUntil={chat.other_user.nickname ? chat.other_user.banned_until : null}
                  size="xs"
                />
              </div>
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
                    <ReportButton
                      onClick={() => {
                        setShowMenu(false);
                        // Report Mode (Select Messages)
                        onReport(chat.id, 'chat');
                      }}
                    />
                    {chat.other_user.id && ( // Assuming item.other_profile_id refers to chat.other_user.id
                      <BlockButton
                        targetProfileId={chat.other_user.id}
                        onClose={() => setShowMenu(false)}
                      />
                    )}
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onLeave(chat.id);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <i className="ri-logout-box-r-line" />
                      {t('chat.action_exit')}
                    </button>
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
                  : chat.last_message.sender_nickname || chat.other_user.nickname}{' '}
                :{' '}
                {chat.last_message.content === '\u200B' || !chat.last_message.content
                  ? chat.last_message.attachments?.[0]?.type === 'video'
                    ? t('chat.video_preview')
                    : chat.last_message.attachments?.[0]?.type === 'file'
                      ? t('chat.file_preview')
                      : t('chat.image_preview')
                  : chat.last_message.content}
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
  ({
    user,
    onSelect,
    query,
  }: {
    user: ChatUser;
    onSelect: (user: ChatUser) => void;
    query?: string;
  }) => {
    return (
      <div className="user-item" onMouseDown={() => onSelect(user)}>
        <div className="user-avatar">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.nickname} />
          ) : (
            <div className="avatar-placeholder">{user.nickname.charAt(0)}</div>
          )}
        </div>
        <div className="user-info">
          <div className="user-nickname flex items-center gap-1">
            <HighlightText text={user.nickname} query={query} />
            <BanBadge bannedUntil={user.banned_until ?? null} size="xs" />
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => prev.user.id === next.user.id && prev.query === next.query,
);
UserItem.displayName = 'UserItem';
const DirectChatList = ({
  onChatSelect,
  onCreateChat,
  selectedChatId,
  onLeave,
}: DirectChatListProps) => {
  const {
    createDirectChat,
    error,
    users,
    searchUsers,
    clearSearchResults,
    userSearchLoading,
    chats,
    exitDirectChat,
  } = useDirectChat();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showUserSearch, setShowUserSearch] = useState<boolean>(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  // 모달 상태
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitTargetChatId, setExitTargetChatId] = useState<string | null>(null);

  // 10-zzeon: Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'user' | 'chat'; id: string } | null>(
    null,
  );

  const handleReport = useCallback((targetId: string, type: 'chat' | 'user') => {
    setReportTarget({ id: targetId, type });
    setIsReportModalOpen(true);
  }, []);

  // 디바운스 개선 (useRef + cleanup)
  const debounceRef = useRef<number | null>(null);
  const userSearchInputRef = useRef<HTMLInputElement>(null);

  // 검색어 변경 감지용 Ref (불필요한 중복 검색 방지)
  // useEffect가 searchUsers 변경으로 인해 실행될 때, 검색어가 그대로라면 무시하기 위함
  const lastProcessedTermRef = useRef<string>(searchTerm);

  useEffect(() => {
    // 0. 채팅방 생성 중이면 검색 중단 (중복 실행 방지)
    if (isCreatingChat) return;

    // 1. 검색어가 이전 렌더링과 동일하다면(단순 리렌더링) 검색 로직 스킵
    if (searchTerm === lastProcessedTermRef.current) {
      return;
    }
    // 2. 검색어가 변했으므로 업데이트
    lastProcessedTermRef.current = searchTerm;

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
  const handleLeaveChat = useCallback((chatId: string) => {
    setExitTargetChatId(chatId);
    setIsExitModalOpen(true);
  }, []);

  // 실제 나가기 실행
  const confirmLeave = useCallback(async () => {
    if (!exitTargetChatId) return;

    try {
      const success = await exitDirectChat(exitTargetChatId);
      if (success) {
        if (selectedChatId === exitTargetChatId) {
          navigate('/chat');
          if (onLeave) onLeave();
        }
      } else {
        alert(t('chat.exit_fail'));
      }
    } catch (err) {
      console.error(err);
      alert(t('chat.exit_fail'));
    } finally {
      setIsExitModalOpen(false);
      setExitTargetChatId(null);
    }
  }, [exitTargetChatId, exitDirectChat, navigate, onLeave, selectedChatId, t]);

  const handleUserSelect = useCallback(
    async (user: ChatUser) => {
      // 선택 시 진행 중이던 검색 타이머 취소 (중복 검색 방지)
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      try {
        setIsCreatingChat(true);
        const chatId = await createDirectChat(user.id);
        if (chatId) {
          onChatSelect(chatId);
          setShowUserSearch(false);
          setSearchTerm('');
        }
      } catch (error) {
        console.error('Failed to create chat:', error);
      } finally {
        setIsCreatingChat(false);
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
      {isCreatingChat && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-50 flex flex-col items-center justify-center rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="mt-2 text-sm text-primary font-medium">{t('chat.creating_chat')}</span>
        </div>
      )}
      {showUserSearch && (
        <div className="user-search">
          <div className="flex items-center w-full px-4 h-10 bg-background border border-border rounded-full focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200 shadow-sm">
            <img
              src="/images/searchT.svg"
              alt="검색"
              className="chat-room-search-input-icon mr-2"
            />
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
              onLeave={handleLeaveChat}
              onReport={(targetId, type) => {
                if (type === 'chat') {
                  // Navigate to chat room in report mode
                  handleChatSelect(targetId);
                  navigate('/chat', { state: { roomId: targetId, report: true } });
                } else {
                  handleReport(targetId, type);
                }
              }}
            />
          ))
        )}
      </div>

      {/* 나가기 확인 모달 */}
      <Modal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        title={t('chat.confirm_exit_title')}
        className="max-w-sm h-auto"
      >
        <div className="flex flex-col gap-4">
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            {t('chat.confirm_exit_desc')}
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsExitModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200"
            >
              {t('common.cancel', '취소')}
            </button>
            <button
              onClick={confirmLeave}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600"
            >
              {t('chat.btn_leave', '나가기')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setReportTarget(null);
          }}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </div>
  );
};
export default DirectChatList;

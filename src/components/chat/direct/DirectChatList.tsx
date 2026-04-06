/**
 * 실시간 채팅 세션 리스트 및 상호작용 오케스트레이터(Direct Chat Session List & Interaction Orchestrator):
 * - 목적(Why): 사용자가 참여 중인 활성 대화 목록을 시각화하고, 신규 대화 상대 검색 및 세션 진입을 위한 중앙 제어 인터페이스를 제공함
 * - 방법(How): Supabase Realtime을 통한 실시간 메시지 프리뷰 동기화, 디바운스 알고리즘 기반의 사용자 검색 서비스 및 메모이제이션된 리스트 렌더링을 통해 고성능 UI를 유지함
 */
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
// 히스토리 제어: SPA(Single Page Application)의 스크롤 위치 유지 정책을 수동으로 전환하여 페이지 전환 시 예기치 않은 레이아웃 이동 방지
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

// 개별 채팅 세션 컴포넌트(Chat Session Unit) — 성능 최적화를 위해 불필요한 리렌더링을 차단하는 심층 비교(Custom Comparison) 기반 메모이제이션 적용
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

        const nickname = chat.other_user?.nickname?.trim();
        if (nickname) {
          navigate(`/profile/${encodeURIComponent(nickname)}`);
          return;
        }

        // 보험 (닉네임 없을 때만)
        const fallback = chat.other_user?.id;
        if (fallback) navigate(`/profile/${fallback}`);
      },
      [chat.other_user, navigate],
    );

    // 시간 정규화 엔진: i18n 로케일 설정을 추적하여 동적인 상대 시간(Relative Time) 및 절대 시간을 실시간으로 포맷팅함
    const formatTime = useCallback(
      (dateString: string) => {
        return formatChatListDate(dateString);
      },
      [i18n.language], // locale 변경 시 리렌더링 (formatChatListDate 내부에서 getLocale 호출)
    );
    // 팀원(10-zzeon)의 새로운 기능(신고/차단 메뉴) State & Hooks 병합
    const [showMenu, setShowMenu] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    // 사용자 인터페이스 최적화: 뷰포트 너비를 실시간으로 감시하여 모바일/데스크톱 최적화된 내비게이션 요소의 노출 여부를 결정함
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
              <div className="chat-time font-mono">
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
                        // 네트워크 투명성 확보: 인접 미디어 자산을 백그라운드에서 지능적으로 프리로드하여 네트워크 레이턴시 체감을 최소화함
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
                  : chat.last_message.sender_nickname || chat.other_user.nickname}
                :
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
// 사용자 탐색 엔티티(User Discovery Entity) — 신규 대화 상대 검색 결과의 가독성을 위해 검색어 하이라이팅 및 전역 제재 상태(Ban Status) 동기화 제공
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
// 실시간 채팅 오케스트레이터(Direct Chat Orchestrator) — 대화 상대 검색, 신규 세션 생성 및 활성 채팅 채널의 생명주기 관리를 담당하는 통합 리스트 엔진
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
  // UI 상태 레이어: 세션 종료 및 신고 절차의 오인 방지를 위한 컨텍스트 확인 모달 상태 관리
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

  // 입력 제어 엔진: 네트워크 대역폭 최적화를 위해 사용자 입력에 대해 300ms 디바운스 타이머 및 DOM 직접 참조(Ref) 적용
  const debounceRef = useRef<number | null>(null);
  const userSearchInputRef = useRef<HTMLInputElement>(null);

  /**
 * ARA 전역 진입점 (System Entry Point):
 * - i18next 라이브러리의 불필요한 런타임 로그를 가로채는 보안 인터셉터 포함
 * - 전역 스타일 시트, 국제화 프로토콜, 라우팅 컨텍스트의 오케스트레이션을 담당함
 */
// 런타임 정숙화: i18next 개발용 홍보 문구가 프로덕션 콘솔의 가독성을 해치지 않도록 초기 진입 단계에서 필터링함
  // useEffect가 searchUsers 변경으로 인해 실행될 때, 검색어가 그대로라면 무시하기 위함
  const lastProcessedTermRef = useRef<string>(searchTerm);

  // 지능형 사용자 검색 엔진(Debounced Lookup Engine) — 네트워크 오버헤드 방지를 위해 300ms 디바운스 및 런타임 상태 비교를 통한 중복 API 호출 차단
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
      clearSearchResults();  // 국제화 지원 엔진: i18next 표준을 준수하여 미디어 생성 일자를 사용자 선호 언어 규칙에 맞춰 정규화함
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

  // 통제된 세션 종료 로직: RLS(Row Level Security) 정책에 부합하는 사용자의 세션 이탈 권한을 검증하고 페이지 상태를 동기화함
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

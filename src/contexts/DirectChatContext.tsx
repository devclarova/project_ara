/**
 * 1 : 1 채팅 Context Provider
 */

import { createContext, useCallback, useContext, useRef, useState, useEffect } from 'react';
import type { ChatListItem, ChatUser, CreateMessageData, DirectMessage } from '../types/ChatType';
import {
  getChatList,
  getMessages,
  sendMessage as sendMessageService,
  searchUsers as searchUsersService,
  findOrCreateDirectChat,
  exitDirectChat,
  getInactiveChatList,
  restoreDirectChat,
  getUserProfile,
  clearNewChatNotification,
} from '../services/chat/directChatService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNewChatNotification } from './NewChatNotificationContext';

interface DirectChatContextType {
  chats: ChatListItem[];
  inactiveChats: ChatListItem[];
  messages: DirectMessage[];
  users: ChatUser[];
  currentChat: ChatListItem | null;
  loading: boolean;
  userSearchLoading: boolean;
  error: string | null;
  hasNewChatNotification: boolean;

  loadChats: () => Promise<void>;
  loadInactiveChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (messageData: CreateMessageData) => Promise<boolean>;
  searchUsers: (searchTerm: string) => Promise<void>;
  createDirectChat: (participantId: string) => Promise<string | null>;
  exitDirectChat: (chatId: string) => Promise<boolean>;
  restoreDirectChat: (chatId: string) => Promise<boolean>;
  getUserProfile: (userId: string) => Promise<ChatUser | null>;
  clearNewChatNotification: (chatId: string) => Promise<boolean>;
  clearError: () => void;
  resetCurrentChat: () => void;
}

const DirectChatContext = createContext<DirectChatContextType | null>(null);

interface DirectChatProiderProps {
  children: React.ReactNode;
}

export const DirectChatProider: React.FC<DirectChatProiderProps> = ({ children }) => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [inactiveChats, setInactiveChats] = useState<ChatListItem[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNewChatNotification, setHasNewChatNotification] = useState(false);

  // 현재 열려 있는 채팅방 ID
  const currentChatId = useRef<string | null>(null);

  const { user } = useAuth();
  const currentUserId = user?.id;

  // 사이드바 뱃지 Context
  const { setUnreadCount } = useNewChatNotification();

  // 에러 처리
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  // 🔧 현재 채팅방/메시지 상태 초기화
  const resetCurrentChat = useCallback(() => {
    currentChatId.current = null;
    setCurrentChat(null);
    setMessages([]);
  }, []);

  /**
   * 공통: getChatList 결과를 상태에 반영 + 사이드바 뱃지까지 업데이트
   */
  const applyChatList = useCallback(
    (nextChats: ChatListItem[]) => {
      setChats(nextChats);

      const unreadChatsCount = nextChats.filter(chat => (chat.unread_count || 0) > 0).length;
      setHasNewChatNotification(unreadChatsCount > 0);
      setUnreadCount(unreadChatsCount);

      // console.log('[DirectChat] applyChatList / unreadChatsCount =', unreadChatsCount);
    },
    [setUnreadCount],
  );

  /**
   * 채팅방 목록 가져오기 (DB 기준)
   */
  const loadChats = useCallback(async () => {
    try {
      const response = await getChatList();
      if (response.success && response.data) {
        applyChatList(response.data);
      } else {
        handleError(response.error || '채팅방 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      handleError('채팅방 목록 로드 중 오류가 발생했습니다.');
    }
  }, [applyChatList, handleError]);

  /**
   * 새 채팅방 "NEW" 알림 해제
   */
  const clearNewChatNotificationHandler = useCallback(
    async (chatId: string): Promise<boolean> => {
      try {
        const response = await clearNewChatNotification(chatId);
        if (response.success) {
          // DB 상태 반영 위해 다시 전체 목록 로드
          await loadChats();
          return true;
        }
        return false;
      } catch (error) {
        console.error('알림 해제 오류:', error);
        return false;
      }
    },
    [loadChats],
  );

  /**
   * 채팅방 입장: 메시지 가져오기 + 읽음 처리 (백엔드) + 목록 다시 로드
   */
  const loadMessages = useCallback(
    async (chatId: string) => {
      try {
        currentChatId.current = chatId;

        const chatInfo = chats.find(chat => chat.id === chatId) || null;
        if (chatInfo) {
          setCurrentChat(chatInfo);

          if (chatInfo.is_new_chat) {
            await clearNewChatNotificationHandler(chatId);
          }
        }

        const response = await getMessages(chatId);
        if (response.success && response.data) {
          setMessages(response.data);

          // getMessages 안에서 is_read 업데이트가 이미 DB에 들어감 (우리가 확인함)
          // → 여기서는 그냥 DB 기준으로 다시 목록을 새로 가져와서 unreadCount를 맞춘다.
          await loadChats();
        } else {
          handleError(response.error || '메시지를 불러올 수 없습니다.');
        }
      } catch (err) {
        handleError('메시지 로드 중 오류가 발생했습니다.');
      }
    },
    [handleError, chats, clearNewChatNotificationHandler, loadChats],
  );

  /**
   * 메시지 전송
   */
  const sendMessage = useCallback(
    async (messageData: CreateMessageData) => {
      try {
        const response = await sendMessageService(messageData);
        if (response.success && response.data) {
          const sent = response.data;

          // 현재 열려 있는 방이면 메시지 리스트에 바로 추가
          setMessages(prev =>
            currentChatId.current === messageData.chat_id ? [...prev, sent] : prev,
          );

          // DB에서 last_message, last_message_at 등이 갱신되므로 전체 목록 새로고침
          await loadChats();

          return true;
        } else {
          handleError(response.error || '메시지 전송에 실패했습니다.');
          return false;
        }
      } catch (err) {
        handleError('메시지 전송 중 오류가 발생했습니다.');
        return false;
      }
    },
    [handleError, loadChats],
  );

  /**
   * 사용자 검색
   */
  const searchUsers = useCallback(
    async (searchTerm: string) => {
      try {
        setUserSearchLoading(true);
        const response = await searchUsersService(searchTerm);
        if (response.success && response.data) {
          setUsers(response.data);
        } else {
          handleError(response.error || '사용자 검색에 실패했습니다.');
        }
      } catch (err) {
        handleError('사용자 검색 중 오류가 발생했습니다.');
      } finally {
        setUserSearchLoading(false);
      }
    },
    [handleError],
  );

  /**
   * 채팅방 생성 또는 재사용
   */
  const createDirectChat = useCallback(
    async (participantId: string): Promise<string | null> => {
      try {
        setLoading(true);
        const response = await findOrCreateDirectChat(participantId);

        if (response.success && response.data) {
          await loadChats(); // 새 방/재활성화 반영
          return response.data.id;
        } else {
          handleError(response.error || '채팅방 생성에 실패했습니다.');
          return null;
        }
      } catch (err) {
        handleError('채팅방 생성 중 오류가 발생했습니다.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError, loadChats],
  );

  /**
   * 채팅방 나가기
   */
  const exitDirectChatHandler = useCallback(
    async (chatId: string): Promise<boolean> => {
      try {
        setLoading(true);
        const response = await exitDirectChat(chatId);
        if (response.success) {
          // DB 상태 반영 위해 전체 목록 새로고침
          await loadChats();

          if (currentChatId.current === chatId) {
            resetCurrentChat();
          }
          return true;
        } else {
          handleError(response.error || '채팅방 나가기에 실패했습니다.');
          return false;
        }
      } catch (err) {
        handleError('채팅방 나가기 중 오류가 발생했습니다.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [handleError, loadChats, resetCurrentChat],
  );

  /**
   * 비활성화 채팅방 목록
   */
  const loadInactiveChats = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await getInactiveChatList();
      if (response.success) {
        setInactiveChats(response.data || []);
      } else {
        handleError(response.error || '비활성화된 채팅방 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      handleError('비활성화된 채팅방 목록 로딩 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * 비활성화 채팅방 복구
   */
  const restoreDirectChatHandler = useCallback(
    async (chatId: string): Promise<boolean> => {
      try {
        setLoading(true);
        const response = await restoreDirectChat(chatId);
        if (response.success) {
          setInactiveChats(prev => prev.filter(chat => chat.id !== chatId));
          await loadChats();
          return true;
        } else {
          handleError(response.error || '채팅방 복구에 실패했습니다.');
          return false;
        }
      } catch (err) {
        handleError('채팅방 복구 중 오류가 발생했습니다.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [handleError, loadChats],
  );

  /**
   * 사용자 프로필 조회
   */
  const getUserProfileHandler = useCallback(async (userId: string): Promise<ChatUser | null> => {
    try {
      const response = await getUserProfile(userId);
      if (response.success && response.data) {
        return response.data;
      } else {
        console.error('프로필 조회 실패:', response.error);
        return null;
      }
    } catch (err) {
      console.error('프로필 조회 중 오류:', err);
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Realtime: direct_chats / direct_messages 변경 처리
   *  - 핵심: 뭔가 바뀌면 → loadChats()로 DB 기준으로 다시 맞춘다.
   */
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`direct_chat_realtime_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_chats',
        },
        payload => {
          if (payload.new.user1_id === currentUserId || payload.new.user2_id === currentUserId) {
            loadChats();
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'direct_chats',
        },
        payload => {
          if (payload.old.user1_id === currentUserId || payload.old.user2_id === currentUserId) {
            loadChats();
            if (currentChatId.current === payload.old.id) {
              resetCurrentChat();
            }
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_chats',
        },
        payload => {
          if (payload.new.user1_id === currentUserId || payload.new.user2_id === currentUserId) {
            loadChats();
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        async payload => {
          const isSystemMessage =
            payload.new.content && payload.new.content.includes('님이 채팅방을 나갔습니다');
          const chatId = payload.new.chat_id as string;

          // 1) 현재 열려 있는 채팅방
          if (currentChatId.current === chatId) {
            // UI에 메시지 추가
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new as DirectMessage];
            });

            // 상대방이 보낸 메시지면 → 읽음 처리 시도 후, DB 기준으로 다시 loadChats
            if (payload.new.sender_id !== currentUserId) {
              try {
                await supabase
                  .from('direct_messages')
                  .update({
                    is_read: true,
                    read_at: new Date().toISOString(),
                  })
                  .eq('id', payload.new.id);
              } catch (err) {
                console.error('실시간 메시지 읽음 처리 실패:', err);
              }

              await loadChats();
            }

            return;
          }

          // 2) 내가 안 보고 있는 다른 채팅방에서 온 상대 메시지
          if (!isSystemMessage && payload.new.sender_id !== currentUserId) {
            await loadChats();
          }
        },
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime 구독 실패!');
        } else if (status === 'TIMED_OUT') {
          console.error('Realtime 구독 시간 초과!');
        } else if (status === 'CLOSED') {
          console.log('Realtime 구독 정상 종료');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, loadChats, resetCurrentChat]);

  /**
   * 로그인 직후 / 초기 로드 시 채팅 목록 가져오기
   */
  useEffect(() => {
    if (!currentUserId) return;
    loadChats();
  }, [currentUserId, loadChats]);

  const value: DirectChatContextType = {
    chats,
    inactiveChats,
    messages,
    users,
    currentChat,
    loading,
    userSearchLoading,
    error,
    hasNewChatNotification,

    loadChats,
    loadInactiveChats,
    loadMessages,
    sendMessage,
    searchUsers,
    createDirectChat,
    exitDirectChat: exitDirectChatHandler,
    restoreDirectChat: restoreDirectChatHandler,
    getUserProfile: getUserProfileHandler,
    clearNewChatNotification: clearNewChatNotificationHandler,
    clearError,
    resetCurrentChat,
  };

  return <DirectChatContext.Provider value={value}>{children}</DirectChatContext.Provider>;
};

export const useDirectChat = () => {
  const context = useContext(DirectChatContext);
  if (!context) {
    throw new Error('채팅 컨텐스트가 생성되지 않았습니다.');
  }
  return context;
};

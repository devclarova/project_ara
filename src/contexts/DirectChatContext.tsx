/**
 * 1:1 채팅 Context Provider (무한루프 완전 수정)
 * - 모든 useCallback 의존성 배열 최적화
 * - ref 사용으로 불필요한 재생성 방지
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
  useMemo,
} from 'react';
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

interface DirectChatProviderProps {
  children: React.ReactNode;
}

export const DirectChatProvider: React.FC<DirectChatProviderProps> = ({ children }) => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [inactiveChats, setInactiveChats] = useState<ChatListItem[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentChatId = useRef<string | null>(null);
  const { user } = useAuth();
  const currentUserId = user?.id;
  const { setUnreadCount } = useNewChatNotification();

  // chats를 ref로 관리 (의존성 배열에서 제거하기 위함)
  const chatsRef = useRef<ChatListItem[]>([]);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  // loadChats 디바운스 (중복 호출 방지)
  const loadChatsTimeoutRef = useRef<number | null>(null);
  const isLoadingChatsRef = useRef(false);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const resetCurrentChat = useCallback(() => {
    currentChatId.current = null;
    setCurrentChat(null);
    setMessages([]);
  }, []);

  // 채팅 목록 로드 (디바운스 적용)
  const loadChats = useCallback(async () => {
    if (isLoadingChatsRef.current) return;

    if (loadChatsTimeoutRef.current) {
      window.clearTimeout(loadChatsTimeoutRef.current);
    }

    loadChatsTimeoutRef.current = window.setTimeout(async () => {
      if (isLoadingChatsRef.current) return;

      isLoadingChatsRef.current = true;
      try {
        const response = await getChatList();
        if (response.success && response.data) {
          setChats(response.data);
          const unreadChatsCount = response.data.filter(
            chat => (chat.unread_count || 0) > 0,
          ).length;
          setUnreadCount(unreadChatsCount);
        } else {
          handleError(response.error || '채팅방 목록을 불러올 수 없습니다.');
        }
      } catch (err) {
        handleError('채팅방 목록 로드 중 오류가 발생했습니다.');
      } finally {
        isLoadingChatsRef.current = false;
      }
    }, 200);
  }, []); // 의존성 제거

  const clearNewChatNotificationHandler = useCallback(async (chatId: string): Promise<boolean> => {
    try {
      const response = await clearNewChatNotification(chatId);
      if (response.success) {
        setChats(prev =>
          prev.map(chat => (chat.id === chatId ? { ...chat, is_new_chat: false } : chat)),
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('알림 해제 오류:', error);
      return false;
    }
  }, []);

  // loadMessages - chats 의존성 제거, ref 사용
  const loadMessages = useCallback(
    async (chatId: string) => {
      try {
        currentChatId.current = chatId;

        // ref에서 chatInfo 찾기
        const chatInfo = chatsRef.current.find(chat => chat.id === chatId) || null;
        if (chatInfo) {
          setCurrentChat(chatInfo);
          if (chatInfo.is_new_chat) {
            await clearNewChatNotificationHandler(chatId);
          }
        }

        const response = await getMessages(chatId);
        if (response.success && response.data) {
          setMessages(response.data);

          setChats(prev =>
            prev.map(chat => (chat.id === chatId ? { ...chat, unread_count: 0 } : chat)),
          );
        } else {
          handleError(response.error || '메시지를 불러올 수 없습니다.');
        }
      } catch (err) {
        handleError('메시지 로드 중 오류가 발생했습니다.');
      }
    },
    [clearNewChatNotificationHandler],
  ); // chats 의존성 제거

  const sendMessage = useCallback(async (messageData: CreateMessageData) => {
    try {
      const response = await sendMessageService(messageData);
      if (response.success && response.data) {
        const sent = response.data;

        if (currentChatId.current === messageData.chat_id) {
          setMessages(prev => [...prev, sent]);
        }

        setChats(prev =>
          prev.map(chat =>
            chat.id === messageData.chat_id
              ? {
                  ...chat,
                  last_message: {
                    content: sent.content,
                    created_at: sent.created_at,
                    sender_nickname: sent.sender?.nickname || '',
                  },
                  last_message_at: sent.created_at,
                }
              : chat,
          ),
        );

        return true;
      } else {
        handleError(response.error || '메시지 전송에 실패했습니다.');
        return false;
      }
    } catch (err) {
      handleError('메시지 전송 중 오류가 발생했습니다.');
      return false;
    }
  }, []);

  const searchUsers = useCallback(async (searchTerm: string) => {
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
  }, []);

  const createDirectChat = useCallback(
    async (participantId: string): Promise<string | null> => {
      try {
        setLoading(true);
        const response = await findOrCreateDirectChat(participantId);

        if (response.success && response.data) {
          await loadChats();
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
    [loadChats],
  );

  const exitDirectChatHandler = useCallback(
    async (chatId: string): Promise<boolean> => {
      try {
        setLoading(true);
        const response = await exitDirectChat(chatId);
        if (response.success) {
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
    [loadChats, resetCurrentChat],
  );

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
  }, []);

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
    [loadChats],
  );

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

  // Realtime: 단일 채널로 통합
  useEffect(() => {
    if (!currentUserId) return;

    const pendingUpdates = new Set<string>();
    let updateTimer: number | null = null;

    const scheduleUpdate = () => {
      if (updateTimer) window.clearTimeout(updateTimer);
      updateTimer = window.setTimeout(() => {
        if (pendingUpdates.size > 0) {
          loadChats();
          pendingUpdates.clear();
        }
      }, 300);
    };

    const channel = supabase
      .channel(`direct_chat_unified_${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_chats' }, payload => {
        const chatId = (payload.new as any)?.id || (payload.old as any)?.id;
        if (chatId) {
          pendingUpdates.add(chatId);
          scheduleUpdate();
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        async payload => {
          const newMessage = payload.new as any;
          const chatId = newMessage.chat_id as string;
          const senderId = newMessage.sender_id as string;

          if (currentChatId.current === chatId) {
            setMessages(prev => {
              const exists = prev.some(msg => String(msg.id) === String(newMessage.id));
              if (exists) return prev;
              return [...prev, newMessage].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
              );
            });

            if (senderId !== currentUserId) {
              try {
                await supabase
                  .from('direct_messages')
                  .update({ is_read: true, read_at: new Date().toISOString() })
                  .eq('id', newMessage.id);
              } catch (err) {
                console.error('읽음 처리 실패:', err);
              }
            }
          }

          pendingUpdates.add(chatId);
          scheduleUpdate();
        },
      )
      .subscribe();

    return () => {
      if (updateTimer) window.clearTimeout(updateTimer);
      channel.unsubscribe();
    };
  }, [currentUserId, loadChats]);

  // 초기 로드 - 딱 한번만
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!currentUserId || initialLoadDone.current) return;

    initialLoadDone.current = true;
    loadChats();
  }, [currentUserId, loadChats]);

  const hasNewChatNotification = useMemo(
    () => chats.some(chat => (chat.unread_count || 0) > 0),
    [chats],
  );

  const value = useMemo<DirectChatContextType>(
    () => ({
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
    }),
    [
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
      exitDirectChatHandler,
      restoreDirectChatHandler,
      getUserProfileHandler,
      clearNewChatNotificationHandler,
      clearError,
      resetCurrentChat,
    ],
  );

  const profileCache = useRef<Map<string, ChatUser>>(new Map());

  const fetchProfileByAuthId = useCallback(async (authUserId: string): Promise<ChatUser> => {
    const cached = profileCache.current.get(authUserId);
    if (cached) return cached;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .eq('user_id', authUserId)
      .single();
    const user: ChatUser = data
      ? {
          id: data.id,
          email: `user-${data.id}@example.com`,
          nickname: data.nickname,
          avatar_url: data.avatar_url,
        }
      : {
          id: authUserId,
          email: `user-${authUserId}@example.com`,
          nickname: `User ${authUserId.slice(0, 8)}`,
          avatar_url: null,
        };
    profileCache.current.set(authUserId, user);
    return user;
  }, []);

  /* 1) 유저가 바뀌면(로그아웃/로그인 전환 포함) 상태 리셋 + 목록 재로딩 */
  useEffect(() => {
    if (!currentUserId) return;
    // 초기화
    setChats([]);
    setInactiveChats([]);
    setMessages([]);
    setUsers([]);
    setCurrentChat(null);
    currentChatId.current = null;

    // 새 사용자 기준으로 로드
    loadChats();
  }, [currentUserId, loadChats]);

  /* 2) 인증 세션 이벤트가 바뀌어도 안전하게 초기화 */
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setChats([]);
      setInactiveChats([]);
      setMessages([]);
      setUsers([]);
      setCurrentChat(null);
      currentChatId.current = null;
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /* 3) messages 배열에 sender가 비어 있는 항목을 자동 보정(아바타 즉시 표시) */
  useEffect(() => {
    // 비어 있으면 스킵
    if (!messages || messages.length === 0) return;

    const needFill = messages.filter(m => !m.sender && m.sender_id);
    if (needFill.length === 0) return;

    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        needFill.map(async m => {
          try {
            const s = await fetchProfileByAuthId(m.sender_id as string);
            return { id: m.id, sender: s };
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;
      const map = new Map<string, ChatUser>();
      pairs.filter(Boolean).forEach(p => map.set((p as any).id, (p as any).sender));

      // sender 없는 메시지만 교체
      setMessages(prev =>
        prev.map(m => {
          if (m.sender || !map.has(m.id)) return m;
          return { ...m, sender: map.get(m.id)! };
        }),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [messages, fetchProfileByAuthId]);

  return <DirectChatContext.Provider value={value}>{children}</DirectChatContext.Provider>;
};

export const useDirectChat = () => {
  const context = useContext(DirectChatContext);
  if (!context) {
    throw new Error('채팅 컨텐스트가 생성되지 않았습니다.');
  }
  return context;
};

/**
 * 1:1 실시간 채팅 오케스트레이션 엔진(Direct Chat Orchestration Engine):
 * - 목적(Why): 데이터 정규화, 실시간 상태 동기화 및 무한 스크롤 버퍼 관리를 총괄함
 * - 방법(How): 낙관적 업데이트(Optimistic UI) 및 네트워크 안정성 확보를 위한 자동 재시도 프로토콜을 구현함
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
import type {
  ChatListItem,
  ChatUser,
  CreateMessageData,
  DirectMessage,
  MessageAttachment,
} from '../types/ChatType';
import {
  getChatList,
  getMessages,
  getDirectChat,
  sendMessage as sendMessageService,
  searchUsers as searchUsersService,
  searchMessagesInChat as searchMessagesInChatService,
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
  loadMessages: (chatId: string, targetId?: string) => Promise<void>;
  sendMessage: (messageData: CreateMessageData) => Promise<boolean>;
  searchUsers: (searchTerm: string) => Promise<void>;
  createDirectChat: (participantId: string) => Promise<string | null>;
  exitDirectChat: (chatId: string) => Promise<boolean>;
  restoreDirectChat: (chatId: string) => Promise<boolean>;
  getUserProfile: (userId: string) => Promise<ChatUser | null>;
  clearNewChatNotification: (chatId: string) => Promise<boolean>;
  clearError: () => void;
  resetCurrentChat: () => void;
  clearSearchResults: () => void;
  // 채팅 이력 검색
  searchChatHistory: (query: string) => Promise<void>;
  searchMessagesInChat: (chatId: string, query: string) => Promise<DirectMessage[]>;
  historySearchResults: {
    users: ChatListItem[]; // 기존 채팅방 리스트 아이템 활용
    messages: DirectMessage[];
  };
  isHistorySearching: boolean;

  // 무한 스크롤 관련
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<number>;

  // 정방향 무한 스크롤 (더 최신 메시지 로드)
  hasNewerMessages: boolean;
  loadNewerMessages: () => Promise<number>;
  blockedUserIds: Set<string>;
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
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  // 무한 스크롤 상태
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [hasNewerMessages, setHasNewerMessages] = useState(false);
  const isMessageLoadingRef = useRef(false);

  const currentChatId = useRef<string | null>(null);
  const { user } = useAuth();
  const currentUserId = user?.id;
  const { setUnreadCount } = useNewChatNotification();
  
  // 프로필 캐시 & 조회용 Ref
  const profileCache = useRef<Map<string, ChatUser>>(new Map());
  const currentUserProfileRef = useRef<ChatUser | null>(null);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  // 차단 목록 로드 (Ref를 사용하여 함수의 안정성 확보)
  const blockedIdsRef = useRef<Set<string>>(new Set());
  
  const loadBlockedUsers = useCallback(async () => {
    if (!currentUserId) return;
    try {
      let myProfId = '';
      if (currentUserProfileRef.current) {
        myProfId = currentUserProfileRef.current.id;
      } else {
        const { data: pData } = await (supabase.from('profiles') as any)
          .select('id')
          .eq('user_id', currentUserId)
          .maybeSingle();
        if (pData) myProfId = pData.id;
      }

      if (!myProfId) return;

      const { data } = await (supabase.from('user_blocks') as any)
        .select('blocked_id')
        .eq('blocker_id', myProfId)
        .is('ended_at', null);

      if (data) {
        const newSet = new Set<string>(data.map((b: any) => b.blocked_id));
        blockedIdsRef.current = newSet;
        setBlockedUserIds(newSet);
      }
    } catch (err) {
      console.error('Failed to load blocked users:', err);
    }
  }, [currentUserId]);

  // 🟢 헤더 배지(미읽음 카운트) 동기화 — chats 또는 차단 목록 변경 시 렌더링 사이클 외부에서 안전하게 상태 업데이트
  useEffect(() => {
    const totalUnread = chats.filter((chat) => {
      // 차단된 사용자의 채팅은 카운트에서 제외
      if (blockedUserIds.has(chat.other_user.id)) return false;
      return (chat.unread_count || 0) > 0;
    }).length;
    
    setUnreadCount(totalUnread);
  }, [chats, blockedUserIds, setUnreadCount]);


  // loadChats 디바운스 및 상태 관리
  const loadChatsTimeoutRef = useRef<number | null>(null);
  const isLoadingChatsRef = useRef(false);

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
          // DB의 last_message_at이 stale한 경우가 있으므로, last_message.created_at과 비교하여 더 최신인 값으로 정렬
          const sorted = [...response.data].sort((a: any, b: any) => {
            const aDb = new Date(a.last_message_at || 0).getTime();
            const aMsg = new Date(a.last_message?.created_at || 0).getTime();
            const bDb = new Date(b.last_message_at || 0).getTime();
            const bMsg = new Date(b.last_message?.created_at || 0).getTime();
            return Math.max(bDb, bMsg) - Math.max(aDb, aMsg);
          });
          setChats(sorted);
        } else {

          handleError(response.error || '채팅방 목록을 불러올 수 없습니다.');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message === '사용자가 로그인되지 않았습니다.') return;
        handleError('채팅방 목록 로드 중 오류가 발생했습니다.');
      } finally {
        isLoadingChatsRef.current = false;
      }
    }, 200);
  }, [setUnreadCount, handleError]); 
  // blockedUserIds 의존성 제거 -> 리렌더링은 chats 업데이트로 충분함

  // 차단/해제 시 상태 갱신 리스너 (의존성 최소화로 무한루프 방지)
  useEffect(() => {
    loadBlockedUsers();

    const handleRefresh = () => {
      loadBlockedUsers();
      loadChats(); 
    };
    window.addEventListener('REFRESH_BLOCKED_USERS', handleRefresh);

    return () => {
      window.removeEventListener('REFRESH_BLOCKED_USERS', handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]); // currentUserId가 바뀔 때만 (즉 로그인 시에만) 초기화

  const fetchProfileByAuthId = useCallback(
    async (authUserId: string): Promise<ChatUser> => {
      if (!authUserId || authUserId === 'undefined') {
        return {
          id: 'unknown',
          email: '',
          nickname: 'Unknown User',
          username: 'unknown',
          avatar_url: null,
          is_online: false,
        };
      }
      
      if (user && authUserId === user.id && currentUserProfileRef.current) {
        return currentUserProfileRef.current;
      }

      const cached = profileCache.current.get(authUserId);
      if (cached) return cached;

      const { data } = await (supabase.from('profiles') as any)
        .select('id, nickname, avatar_url, username, is_online')
        .eq('user_id', authUserId)
        .maybeSingle();

      const userInfo: ChatUser = data
        ? {
            id: data.id,
            email: `user-${data.id}@example.com`,
            nickname: data.nickname,
            username: data.username,
            avatar_url: data.avatar_url,
            is_online: data.is_online,
          }
        : {
            id: authUserId,
            email: `user-${authUserId}@example.com`,
            nickname: `User ${authUserId.slice(0, 8)}`,
            avatar_url: null,
            is_online: false,
          };

      profileCache.current.set(authUserId, userInfo);

      if (user && authUserId === user.id) {
        currentUserProfileRef.current = userInfo;
      }

      return userInfo;
    },
    [user],
  );

  useEffect(() => {
    if (user?.id) {
      fetchProfileByAuthId(user.id);
    }
  }, [user?.id, fetchProfileByAuthId]);

  const chatsRef = useRef<ChatListItem[]>([]);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const resetCurrentChat = useCallback(() => {
    currentChatId.current = null;
    setCurrentChat(null);
    setMessages([]);
  }, []);

  const clearNewChatNotificationHandler = useCallback(async (chatId: string): Promise<boolean> => {
    try {
      const response = await clearNewChatNotification(chatId);
      if (response.success) {
        setChats(prev =>
          prev.map((chat: any) => (chat.id === chatId ? { ...chat, is_new_chat: false } : chat)),
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('알림 해제 오류:', error);
      return false;
    }
  }, []);

  // 메시지 로딩 및 뷰포트 상태 정규화 — 지정된 채팅방의 메시지 이력을 가져오고 미읽음 상태 및 배지 카운트 실시간 동기화
  const loadMessages = useCallback(
    async (chatId: string, targetId?: string) => {
      try {
        currentChatId.current = chatId;
        setError(null);
        setMessages([]);
        setHasMoreMessages(false);

        let chatInfo = chatsRef.current.find((chat: any) => chat.id === chatId) || null;

        if (!chatInfo) {
          try {
            const res = await getDirectChat(chatId);
            if (res.success && res.data) {
              chatInfo = res.data;
            }
          } catch (e) {
            console.error('getDirectChat error', e);
          }
        }

        if (chatInfo) {
          setCurrentChat(chatInfo);
          if (chatInfo.is_new_chat) {
            await clearNewChatNotificationHandler(chatId);
          }
        }

        const response = await getMessages(chatId, 30, undefined, targetId);
        if (response.success && response.data) {
          const incoming = response.data.messages;
          const filteredIncoming = incoming.filter((m: any) => !blockedUserIds.has(m.sender_id));
          const sorted = targetId ? filteredIncoming : [...filteredIncoming].reverse();

          const unique = Array.from(new Map(sorted.map((m: any) => [m.id, m])).values());
          unique.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          setMessages(unique);
          setHasMoreMessages(response.data.hasNext);

          if (targetId) {
            setHasNewerMessages(response.data.hasNext);
            setHasMoreMessages(true);
          } else {
            setHasNewerMessages(false);
          }

          // DB에서도 해당 채팅방의 미읽음 메시지를 일괄 읽음 처리 (await으로 완료 대기)
          if (currentUserId) {
            const { error: readError } = await (supabase.from('direct_messages') as any)
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq('chat_id', chatId)
              .neq('sender_id', currentUserId)
              .eq('is_read', false);

            if (readError) {
              console.error('[loadMessages] is_read 일괄 업데이트 실패:', readError);
            }
          }

          // 로컬 상태 즉시 반영
          setChats(prev => {
            return prev.map((chat: any) => (chat.id === chatId ? { ...chat, unread_count: 0 } : chat));
          });
        } else {

          handleError(response.error || '메시지를 불러올 수 없습니다.');
        }
      } catch (err) {
        handleError('메시지 로드 중 오류가 발생했습니다.');
      }
    },
    [clearNewChatNotificationHandler, blockedUserIds, handleError],
  );

  const loadMoreMessages = useCallback(async (): Promise<number> => {
    const chatId = currentChatId.current;
    if (!chatId || !hasMoreMessages || isMessageLoadingRef.current || messages.length === 0)
      return 0;

    isMessageLoadingRef.current = true;
    try {
      const oldesetMessage = messages[0];
      const beforeAt = oldesetMessage.created_at;

      const response = await getMessages(chatId, 30, beforeAt);

      if (response.success && response.data) {
        const { messages: olderMessages, hasNext } = response.data;

        if (olderMessages.length > 0) {
          const sortedOlder = [...olderMessages].reverse();
          setMessages(prev => {
            const combined = [...sortedOlder, ...prev];
            const unique = Array.from(new Map(combined.map((m: any) => [m.id, m])).values());
            unique.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return unique;
          });
        }

        setHasMoreMessages(hasNext);
        return olderMessages.length;
      }
      return 0;
    } catch (err) {
      console.error('메시지 추가 로드 실패:', err);
      return 0;
    } finally {
      isMessageLoadingRef.current = false;
    }
  }, [hasMoreMessages, messages]);

  const loadNewerMessages = useCallback(async (): Promise<number> => {
    const chatId = currentChatId.current;
    if (!chatId || !hasNewerMessages || isMessageLoadingRef.current || messages.length === 0)
      return 0;

    isMessageLoadingRef.current = true;
    try {
      const latestMessage = messages[messages.length - 1];
      const afterAt = latestMessage.created_at;

      const response = await getMessages(chatId, 30, undefined, undefined, afterAt);

      if (response.success && response.data) {
        const { messages: newerMessages, hasNext } = response.data;

        if (newerMessages.length > 0) {
          setMessages(prev => {
            const combined = [...prev, ...newerMessages];
            const unique = Array.from(new Map(combined.map((m: any) => [m.id, m])).values());
            unique.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return unique;
          });
        }

        setHasNewerMessages(hasNext);
        return newerMessages.length;
      }
      return 0;
    } catch (err) {
      console.error('메시지 정방향 추가 로드 실패:', err);
      return 0;
    } finally {
      isMessageLoadingRef.current = false;
    }
  }, [hasNewerMessages, messages]);

  // 메시지 전송 및 낙관적 업데이트(Optimistic UI) — 네트워크 트랜잭션 전 로컬 UI 즉시 반영 및 전송 결과에 따른 상태 확정 처리
  const sendMessage = useCallback(
    async (messageData: CreateMessageData) => {
      if (
        (!messageData.content || messageData.content.trim() === '') &&
        (!messageData.attachments || messageData.attachments.length === 0)
      ) {
        return false;
      }
      
      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();
      const myProfile = user ? await fetchProfileByAuthId(user.id) : null;

      const previewAttachments: MessageAttachment[] =
        messageData.attachments?.map(file => {
          let type: 'image' | 'video' | 'file' = 'file';
          if (file.type.startsWith('image/')) type = 'image';
          else if (file.type.startsWith('video/')) type = 'video';

          return {
            id: crypto.randomUUID(),
            type,
            url: URL.createObjectURL(file),
            name: file.name,
            is_temp: true,
          };
        }) ?? [];

      const optimisticMessage: DirectMessage = {
        id: tempId,
        chat_id: messageData.chat_id,
        sender_id: user?.id || '',
        content: messageData.content ?? null,
        created_at: now,
        is_read: false,
        sender: myProfile || {
          id: user?.id || '',
          nickname: '나',
          avatar_url: null,
          email: '',
        },
        attachments: previewAttachments,
      };

      if (currentChatId.current === messageData.chat_id) {
        setMessages(prev => [...prev, optimisticMessage]);
      }

      setChats(prev => {
        const chatIdx = prev.findIndex(chat => chat.id === messageData.chat_id);
        if (chatIdx === -1) return prev;
        
        const updatedChat = {
          ...prev[chatIdx],
          last_message: {
            content: messageData.content ?? '',
            created_at: now,
            sender_nickname: myProfile?.nickname || '',
            sender_id: user?.id || '',
            attachments: previewAttachments,
          },
          last_message_at: now,
        };
        
        const next = [...prev];
        next.splice(chatIdx, 1);
        return [updatedChat, ...next];
      });

      try {
        const response = await sendMessageService({
          chat_id: messageData.chat_id,
          content: messageData.content ?? null,
          attachments: messageData.attachments,
        });

        if (response.success && response.data) {
          const sent = response.data;
          if (currentChatId.current === messageData.chat_id) {
            setMessages(prev =>
              prev.map((msg: any) => {
                if (msg.id !== tempId) return msg;
                return {
                  ...sent,
                  sender: (sent.sender || msg.sender || myProfile || undefined) as ChatUser,
                  attachments: sent.attachments && sent.attachments.length > 0 ? sent.attachments : msg.attachments,
                };
              }),
            );
          }

          setChats(prev => {
            const chatIdx = prev.findIndex(chat => chat.id === messageData.chat_id);
            if (chatIdx === -1) return prev;

            const updatedChat = {
              ...prev[chatIdx],
              last_message: {
                content: sent.content ?? '',
                created_at: sent.created_at,
                sender_nickname: sent.sender?.nickname || '',
                sender_id: sent.sender_id,
                attachments: sent.attachments ?? [],
              },
              last_message_at: sent.created_at,
            };

            const next = [...prev];
            next.splice(chatIdx, 1);
            return [updatedChat, ...next];
          });
          return true;
        } else {
          if (currentChatId.current === messageData.chat_id) {
            setMessages(prev => prev.filter((msg: any) => msg.id !== tempId));
          }
          handleError(response.error || '메시지 전송에 실패했습니다.');
          return false;
        }
      } catch (err) {
        if (currentChatId.current === messageData.chat_id) {
          setMessages(prev => prev.filter((msg: any) => msg.id !== tempId));
        }
        handleError('메시지 전송 중 오류가 발생했습니다.');
        return false;
      }
    },
    [user, fetchProfileByAuthId, handleError],
  );

  const [historySearchResults, setHistorySearchResults] = useState<{
    users: ChatListItem[];
    messages: DirectMessage[];
  }>({ users: [], messages: [] });
  const [isHistorySearching, setIsHistorySearching] = useState(false);

  const searchChatHistory = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setHistorySearchResults({ users: [], messages: [] });
        return;
      }

      setIsHistorySearching(true);
      try {
        const lowerQuery = query.toLowerCase();
        const matchedChats = chats.filter((chat: any) =>
          chat.other_user?.nickname?.toLowerCase().includes(lowerQuery),
        );

        const { searchMessagesGlobal } = await import('../services/chat/directChatService');
        const msgRes = await searchMessagesGlobal(query);

        setHistorySearchResults({
          users: matchedChats,
          messages: msgRes.success && msgRes.data ? msgRes.data : [],
        });
      } catch (err) {
        console.error('채팅 이력 검색 오류', err);
      } finally {
        setIsHistorySearching(false);
      }
    },
    [chats],
  );

  const searchMessagesInChat = useCallback(async (chatId: string, query: string) => {
    const res = await searchMessagesInChatService(chatId, query);
    if (res.success && res.data) {
      return res.data;
    }
    return [];
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
  }, [handleError]);

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
    [loadChats, handleError],
  );

  const exitDirectChatHandler = useCallback(
    async (chatId: string): Promise<boolean> => {
      try {
        setLoading(true);
        const targetChat = chatsRef.current.find((c: any) => c.id === chatId);
        const otherProfileId = targetChat?.other_user?.id;
        const myProfileId = currentUserProfileRef.current?.id;

        const response = await exitDirectChat(chatId);

        if (response.success) {
          await (supabase.from('direct_messages') as any)
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('chat_id', chatId)
            .neq('sender_id', currentUserId)
            .eq('is_read', false);

          if (otherProfileId && myProfileId) {
            await (supabase.from('notifications') as any)
              .update({ is_read: true })
              .eq('sender_id', otherProfileId)
              .eq('receiver_id', myProfileId)
              .eq('is_read', false);
          }

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
    [loadChats, resetCurrentChat, currentUserId, handleError],
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
    } catch (err: unknown) {
      if (err instanceof Error && err.message === '사용자가 로그인되지 않았습니다.') return;
      handleError('비활성화된 채팅방 목록 로딩 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    if (user?.id) {
      loadChats();
      loadInactiveChats();
    }
  }, [user?.id, loadChats, loadInactiveChats]);

  const restoreDirectChatHandler = useCallback(
    async (chatId: string): Promise<boolean> => {
      try {
        setLoading(true);
        const response = await restoreDirectChat(chatId);
        if (response.success) {
          setInactiveChats(prev => prev.filter((chat: any) => chat.id !== chatId));
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
    [loadChats, handleError],
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

  const clearSearchResults = useCallback(() => {
    setUsers([]);
  }, []);

  // 실시간 메시지 구독 및 파이프라인(Realtime Processing Pipeline) — Supabase Realtime을 통한 유입 메시지 감지, 이미지 지연 로딩 처리 및 멀티 탭 동기화
  const channelIdRef = useRef(0);
  useEffect(() => {
    if (!currentUserId) return;

    // 재구독 시 이전 채널명과 충돌 방지
    channelIdRef.current += 1;
    const channelName = `direct_chat_unified_${currentUserId}_${channelIdRef.current}`;

    // console.log('[RT-DEBUG] 실시간 구독 설정됨. currentUserId:', currentUserId, 'channel:', channelName);

    const handleNewMessage = async (payload: import('@supabase/supabase-js').RealtimePostgresInsertPayload<import('../types/database').MessagesRow>) => {
      let newMessage = payload.new as any;
      const chatId = newMessage.chat_id;
      
      // console.log('[RT-DEBUG] INSERT 이벤트 수신:', { chatId, senderId: newMessage.sender_id, currentChatId: currentChatId.current, messageId: newMessage.id });
      
      if (blockedIdsRef.current.has(newMessage.sender_id)) return;

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      for (let i = 0; i < 3; i++) {
        try {
          const { data: fullMessage } = await (supabase.from('direct_messages') as any)
            .select(`*, attachments:direct_message_attachments(*)`)
            .eq('id', newMessage.id)
            .maybeSingle();

          if (fullMessage) {
            newMessage = fullMessage;
            break;
          }
        } catch (e) {}
        if (i < 2) await delay(500);
      }

      if (currentChatId.current === chatId) {
        let senderProfile = await fetchProfileByAuthId(newMessage.sender_id);
        const msgWithSender = { ...newMessage, sender: senderProfile };

        setMessages(prev => {
          if (prev.some((msg: any) => msg.id === newMessage.id)) return prev;
          const tempIndex = prev.findIndex(msg =>
            msg.id.startsWith('temp-') &&
            msg.sender_id === newMessage.sender_id &&
            Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 3000,
          );

          if (tempIndex !== -1) {
            const next = [...prev];
            next[tempIndex] = {
              ...newMessage,
              sender: senderProfile,
              attachments: newMessage.attachments && newMessage.attachments.length > 0 ? newMessage.attachments : prev[tempIndex].attachments,
            };
            return next;
          }

          const added = [...prev, { ...newMessage, sender: senderProfile, attachments: newMessage.attachments ?? [] }];
          added.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          return added;
        });

        if (newMessage.sender_id !== currentUserId) {
          (supabase.from('direct_messages') as any).update({ is_read: true, read_at: new Date().toISOString() }).eq('id', newMessage.id).then();
        }
      }

      setChats(prevChats => {
        const existingChatIndex = prevChats.findIndex(chat => chat.id === chatId);
        if (existingChatIndex !== -1) {
          const updatedChat = { ...prevChats[existingChatIndex] };
          updatedChat.last_message = {
            content: newMessage.content ?? '',
            created_at: newMessage.created_at,
            sender_id: newMessage.sender_id,
            sender_nickname: '',
            attachments: (newMessage as any).attachments ?? [],
          };
          updatedChat.last_message_at = newMessage.created_at;

          if (currentChatId.current !== chatId) {
            updatedChat.unread_count = (updatedChat.unread_count || 0) + 1;
            updatedChat.is_new_chat = true;
          }

          const newChats = [...prevChats];
          newChats.splice(existingChatIndex, 1);
          return [updatedChat, ...newChats];
        } else {
          loadChats();
          return prevChats;
        }
      });
    };

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, 
        (payload: any) => {
        if (payload.eventType === 'INSERT') {
          handleNewMessage(payload);
        } else if (payload.eventType === 'UPDATE') {
          const updatedMsg = payload.new;
          const chatId = updatedMsg.chat_id;
          const isDeleted = !!updatedMsg.deleted_at || (updatedMsg.content && updatedMsg.content.includes('관리자에 의해 삭제된 메시지입니다'));

          if (currentChatId.current === chatId) {
            setMessages(prev => prev.map((msg: any) => msg.id === updatedMsg.id ? { ...msg, content: updatedMsg.content, deleted_at: isDeleted ? updatedMsg.deleted_at || new Date().toISOString() : updatedMsg.deleted_at, attachments: isDeleted ? [] : msg.attachments } : msg));
          }

          setChats(prev => prev.map((chat: any) => {
            if (chat.id === chatId && chat.last_message && (chat.last_message.created_at === updatedMsg.created_at || (chat.last_message as Record<string, any>).id === updatedMsg.id)) {
              return { ...chat, last_message: { ...chat.last_message, content: updatedMsg.content, attachments: isDeleted ? [] : chat.last_message.attachments } };
            }
            return chat;
          }));
        }
      })
      .subscribe((status: string) => {
        // console.log('[RT-DEBUG] 채널 상태:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, loadChats, fetchProfileByAuthId]);

  const hasNewChatNotification = useMemo(
    () => chats.some((chat: any) => !blockedUserIds.has(chat.other_user.id) && (chat.unread_count || 0) > 0),
    [chats, blockedUserIds],
  );

  useEffect(() => {
    const channel = supabase
      .channel('global-profile-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, 
        (payload: import('@supabase/supabase-js').RealtimePostgresUpdatePayload<import('../types/database').Profile>) => {
          const updated = payload.new;
        if (!updated) return;
        const authId = updated.user_id;
        if (authId && profileCache.current.has(authId)) {
          const existing = profileCache.current.get(authId)!;
          profileCache.current.set(authId, { ...existing, nickname: updated.nickname ?? existing.nickname, avatar_url: updated.avatar_url ?? existing.avatar_url, banned_until: updated.banned_until });
        }
        setChats(prev => prev.map((chat: any) => chat.other_user?.id === updated.id ? { ...chat, other_user: { ...chat.other_user, nickname: updated.nickname ?? chat.other_user.nickname, avatar_url: updated.avatar_url ?? chat.other_user.avatar_url, banned_until: updated.banned_until } } : chat));
        setCurrentChat(prev => (prev && prev.other_user?.id === updated.id) ? { ...prev, other_user: { ...prev.other_user, nickname: updated.nickname ?? prev.other_user.nickname, avatar_url: updated.avatar_url ?? prev.other_user.avatar_url, banned_until: updated.banned_until } } : prev);
        setMessages(prev => prev.map((msg: any) => (msg.sender?.id === updated.id || msg.sender_id === updated.user_id) ? { ...msg, sender: { ...(msg.sender || {}), nickname: updated.nickname ?? msg.sender?.nickname, avatar_url: updated.avatar_url ?? msg.sender?.avatar_url, banned_until: updated.banned_until } as ChatUser } : msg));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const needFill = messages.filter((m: any) => !m.sender && m.sender_id);
    if (needFill.length === 0) return;
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(needFill.map(async m => {
        try { const s = await fetchProfileByAuthId(m.sender_id as string); return { id: m.id, sender: s }; } catch { return null; }
      }));
      if (cancelled) return;
      const map = new Map<string, ChatUser>();
      pairs.filter((p): p is { id: string; sender: ChatUser } => !!p).forEach((p: any) => map.set(p.id, p.sender));
      setMessages(prev => prev.map((m: any) => (m.sender || !map.has(m.id)) ? m : { ...m, sender: map.get(m.id)! }));
    })();
    return () => { cancelled = true; };
  }, [messages, fetchProfileByAuthId]);

  const value = useMemo<DirectChatContextType>(
    () => ({
      chats, inactiveChats, messages, users, currentChat, loading, userSearchLoading, error, hasNewChatNotification,
      loadChats, loadInactiveChats, loadMessages, sendMessage, searchUsers, clearSearchResults, createDirectChat,
      exitDirectChat: exitDirectChatHandler, restoreDirectChat: restoreDirectChatHandler, getUserProfile: getUserProfileHandler,
      clearNewChatNotification: clearNewChatNotificationHandler, clearError, resetCurrentChat, searchChatHistory,
      historySearchResults, isHistorySearching, hasMoreMessages, loadMoreMessages, hasNewerMessages, loadNewerMessages,
      searchMessagesInChat, blockedUserIds,
    }),
    [
      chats, inactiveChats, messages, users, currentChat, loading, userSearchLoading, error, hasNewChatNotification,
      loadChats, loadInactiveChats, loadMessages, sendMessage, searchUsers, clearSearchResults, createDirectChat,
      exitDirectChatHandler, restoreDirectChatHandler, getUserProfileHandler, clearNewChatNotificationHandler,
      clearError, resetCurrentChat, searchChatHistory, historySearchResults, isHistorySearching, hasMoreMessages,
      loadMoreMessages, hasNewerMessages, loadNewerMessages, blockedUserIds, searchMessagesInChat
    ],
  );

  return <DirectChatContext.Provider value={value}>{children}</DirectChatContext.Provider>;
};

export const useDirectChat = () => {
  const context = useContext(DirectChatContext);
  if (!context) throw new Error('채팅 컨텐스트가 생성되지 않았습니다.');
  return context;
};
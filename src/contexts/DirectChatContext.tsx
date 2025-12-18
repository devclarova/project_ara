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

  // 무한 스크롤 상태
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [hasNewerMessages, setHasNewerMessages] = useState(false); // 정방향 스크롤 상태
  const isMessageLoadingRef = useRef(false); // 중복 로드 방지

  const currentChatId = useRef<string | null>(null);
  const { user } = useAuth();
  const currentUserId = user?.id;
  const { setUnreadCount } = useNewChatNotification();

  // 프로필 캐시 & 조회 함수 (Realtime 업데이트용 - 상단 이동)
  const profileCache = useRef<Map<string, ChatUser>>(new Map());

  const fetchProfileByAuthId = useCallback(async (authUserId: string): Promise<ChatUser> => {
    const cached = profileCache.current.get(authUserId);
    if (cached) return cached;
    
    // 내 정보라면 즉시 반환 가능
    if (authUserId === user?.id && user) {
        // ... (user 객체 활용은 useCallback 의존성 걸리므로 아래 supabase 로직 태우거나, 여기서 user ref를 쓰거나)
        // 그냥 supabase 조회로 통일 (캐싱되므로 2번째부턴 빠름)
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .eq('user_id', authUserId)
      .single();
      
    const userInfo: ChatUser = data
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
    profileCache.current.set(authUserId, userInfo);
    return userInfo;
  }, []);

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
    async (chatId: string, targetId?: string) => {
      try {
        currentChatId.current = chatId;
        setMessages([]); // 초기화
        setHasMoreMessages(false);

        // ref에서 chatInfo 찾기
        const chatInfo = chatsRef.current.find(chat => chat.id === chatId) || null;
        if (chatInfo) {
          setCurrentChat(chatInfo);
          if (chatInfo.is_new_chat) {
            await clearNewChatNotificationHandler(chatId);
          }
        }

        // 초기 로딩은 30개만 (targetId가 있으면 딥링킹)
        const response = await getMessages(chatId, 30, undefined, targetId);
        if (response.success && response.data) {
          setMessages(response.data.messages);
          setHasMoreMessages(response.data.hasNext); // 과거 데이터 존재 여부

          // 딥링킹(targetId)의 경우, 가져온 데이터가 limit보다 많으면 '미래 데이터'가 더 있을 수 있음을 의미할 수도 있지만,
          // getMessages의 hasNext는 현재 쿼리 방향 기준임.
          // targetId 조회 시에는 ASC(과거->미래)로 조회하므로, hasNext가 true면 '더 미래의 데이터'가 있다는 뜻.
          // 일반 조회(DESC) 시에는 hasNext가 true면 '더 과거의 데이터'가 있다는 뜻.
          if (targetId) {
             setHasNewerMessages(response.data.hasNext);
             setHasMoreMessages(true); // 딥링킹 시, '더 과거'는 일단 있다고 가정하고 스크롤 시 확인 (Self-correction)
          } else {
             setHasNewerMessages(false); // 일반 최신 조회면 미래 데이터는 없음
          }

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

  // 추가 메시지 로드 (무한 스크롤)
  const loadMoreMessages = useCallback(async (): Promise<number> => {
    const chatId = currentChatId.current;
    if (!chatId || !hasMoreMessages || isMessageLoadingRef.current || messages.length === 0) return 0;

    isMessageLoadingRef.current = true;
    try {
      // 가장 오래된 메시지의 시간(created_at)을 커서로 사용
      const oldesetMessage = messages[0];
      const beforeAt = oldesetMessage.created_at;

      const response = await getMessages(chatId, 30, beforeAt);
      
      if (response.success && response.data) {
        const { messages: olderMessages, hasNext } = response.data;
        
        if (olderMessages.length > 0) {
          // 기존 메시지 앞에 추가
          setMessages(prev => [...olderMessages, ...prev]);
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

  // 더 최신 메시지 로드 (정방향 무한 스크롤)
  const loadNewerMessages = useCallback(async (): Promise<number> => {
    const chatId = currentChatId.current;
    if (!chatId || !hasNewerMessages || isMessageLoadingRef.current || messages.length === 0) return 0;

    isMessageLoadingRef.current = true;
    try {
        // 가장 최신 메시지의 시간을 커서로 사용
        const latestMessage = messages[messages.length - 1];
        const afterAt = latestMessage.created_at;
        
        // 정방향 조회
        const response = await getMessages(chatId, 30, undefined, undefined, afterAt);

        if (response.success && response.data) {
            const { messages: newerMessages, hasNext } = response.data;

            if (newerMessages.length > 0) {
                // 기존 메시지 뒤에 추가
                setMessages(prev => [...prev, ...newerMessages]);
            }

            setHasNewerMessages(hasNext); // 더 미래의 데이터가 있는지 업데이트
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

  const sendMessage = useCallback(async (messageData: CreateMessageData) => {
    // 1. 낙관적 업데이트 (Optimistic Update)
    // 서버 응답을 기다리지 않고 즉시 UI에 반영하여 체감 딜레이 제거
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    
    // 내 프로필 정보 가져오기 (캐시 또는 user 객체 활용)
    const myProfile = user ? await fetchProfileByAuthId(user.id) : null;

    const optimisticMessage: DirectMessage = {
      id: tempId,
      chat_id: messageData.chat_id,
      sender_id: user?.id || '',
      content: messageData.content,
      created_at: now,
      is_read: false,
      sender: myProfile || {
        id: user?.id || '',
        nickname: '나',
        avatar_url: null,
        email: '' 
      }
    };

    // 메시지 목록에 즉시 추가
    if (currentChatId.current === messageData.chat_id) {
      setMessages(prev => [...prev, optimisticMessage]);
    }

    // 채팅 목록 미리보기 즉시 업데이트
    setChats(prev =>
      prev.map(chat =>
        chat.id === messageData.chat_id
          ? {
              ...chat,
              last_message: {
                content: messageData.content,
                created_at: now,
                sender_nickname: myProfile?.nickname || '',
                sender_id: user?.id || '',
              },
              last_message_at: now,
            }
          : chat,
      ),
    );

    try {
      // 2. 실제 전송 요청
      const response = await sendMessageService(messageData);
      
      if (response.success && response.data) {
        const sent = response.data;

        // 3. 성공 시: 임시 메시지를 실제 메시지로 교체 (ID 교체 등)
        if (currentChatId.current === messageData.chat_id) {
          setMessages(prev => prev.map(msg => msg.id === tempId ? sent : msg));
        }
        
        // 채팅 목록은 이미 위에서 업데이트 했으나, 정확한 데이터(서버 시간 등)로 보정
         setChats(prev =>
          prev.map(chat =>
            chat.id === messageData.chat_id
              ? {
                  ...chat,
                  last_message: {
                    content: sent.content,
                    created_at: sent.created_at,
                    sender_nickname: sent.sender?.nickname || '',
                    sender_id: sent.sender_id,
                  },
                  last_message_at: sent.created_at,
                }
              : chat,
          ),
        );
        return true;
      } else {
        // 실패 시: 임시 메시지 제거 및 에러 알림
        if (currentChatId.current === messageData.chat_id) {
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
        }
        handleError(response.error || '메시지 전송에 실패했습니다.');
        return false;
      }
    } catch (err) {
      // 에러 발생 시 롤백
      if (currentChatId.current === messageData.chat_id) {
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
      }
      handleError('메시지 전송 중 오류가 발생했습니다.');
      return false;
    }
  }, [user, fetchProfileByAuthId]);

  const [historySearchResults, setHistorySearchResults] = useState<{
    users: ChatListItem[];
    messages: DirectMessage[];
  }>({ users: [], messages: [] });
  const [isHistorySearching, setIsHistorySearching] = useState(false);

  const searchChatHistory = useCallback(async (query: string) => {
    if (!query.trim()) {
      setHistorySearchResults({ users: [], messages: [] });
      return;
    }
    
    setIsHistorySearching(true);
    try {
      // 1. 내 채팅방 목록(chats)에서 상대방 닉네임 매칭 검색 (메모리 내 필터링)
      // chats는 이미 로드되어 있다고 가정 (DirectChatPage 진입 시 loadChats 됨)
      // 대소문자 구분 없이 검색
      const lowerQuery = query.toLowerCase();
      const matchedChats = chats.filter(chat => 
        chat.other_user?.nickname?.toLowerCase().includes(lowerQuery)
      );

      // 2. 메시지 내용 검색 (서버 요청)
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
  }, [chats]); // chats가 변경되면 검색 로직도 최신 상태 반영해야 함

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

  /* 2) 인증 세션 이벤트가 바뀌어도 안전하게 초기화 - 제거 (useEffect [currentUserId]로 충분함) */
  // useEffect(() => {
  //   const { data: sub } = supabase.auth.onAuthStateChange(() => {
  //      ...
  //   });
  //   return () => sub.subscription.unsubscribe();
  // }, []);

  /* 3) messages 배열에 sender가 비어 있는 항목을 자동 보정(아바타 즉시 표시) */
  // ... (Keep existing logic or optimize later if service layer is fixed)

  // Realtime: 단일 채널로 통합 (Optimized)
  useEffect(() => {
    if (!currentUserId) return;

    // INSERT: direct_messages (새 메시지 도착)
    const handleNewMessage = async (payload: any) => {
      const newMessage = payload.new;
      const chatId = newMessage.chat_id;
      
      // 1. 현재 보고 있는 채팅방이면 메시지 추가
      if (currentChatId.current === chatId) {
        // sender 정보 채우기 (Optimistic fill)
        let senderProfile: ChatUser | null = null;
        try {
           senderProfile = await fetchProfileByAuthId(newMessage.sender_id);
        } catch (e) {
           console.error('sender fetch failed', e);
        }

        const msgWithSender = {
            ...newMessage,
            sender: senderProfile // null이어도 일단 넣음 (보정 로직이 돌 수도 있음)
        };

        setMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) return prev;
          return [...prev, msgWithSender].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
        });

        // 내가 보낸게 아니면 읽음 처리
        if (newMessage.sender_id !== currentUserId) {
            // 비동기로 처리 (UI 블로킹 방지)
            supabase
              .from('direct_messages')
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq('id', newMessage.id)
              .then(); 
        }
      }

      // 2. 채팅 목록 업데이트 (Optimistic Update)
      setChats(prevChats => {
        const existingChatIndex = prevChats.findIndex(chat => chat.id === chatId);
        
        // 목록에 있는 채팅방이면 -> 맨 위로 이동 + 마지막 메시지 업데이트
        if (existingChatIndex !== -1) {
          const updatedChat = { ...prevChats[existingChatIndex] };
          
          updatedChat.last_message = {
            content: newMessage.content,
            created_at: newMessage.created_at,
            sender_id: newMessage.sender_id,
            // 닉네임은 기존 chat 정보나 payload에서 유추 불가하면 비워둠(표시단에서 처리)
             sender_nickname: '', 
          };
          updatedChat.last_message_at = newMessage.created_at;
          
          // 내가 보낸게 아니고, 현재 보고있는 방이 아니면 안읽음 + 1
          if (newMessage.sender_id !== currentUserId && currentChatId.current !== chatId) {
            updatedChat.unread_count = (updatedChat.unread_count || 0) + 1;
            updatedChat.is_new_chat = true; // 시각적 배지
          }

          // 배열에서 제거 후 맨 앞에 추가
          const newChats = [...prevChats];
          newChats.splice(existingChatIndex, 1);
          return [updatedChat, ...newChats];
        } else {
          // 목록에 없던 새로운 채팅방이면 -> 서버에서 목록 다시 로드 (드문 케이스)
          loadChats(); 
          return prevChats;
        }
      });
    };

    const channel = supabase
      .channel(`direct_chat_unified_${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        handleNewMessage
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadChats, fetchProfileByAuthId]);

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

  const clearSearchResults = useCallback(() => {
    setUsers([]);
  }, []);

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
      clearSearchResults, // 추가
      createDirectChat,
      exitDirectChat: exitDirectChatHandler,
      restoreDirectChat: restoreDirectChatHandler,
      getUserProfile: getUserProfileHandler,
      clearNewChatNotification: clearNewChatNotificationHandler,
      clearError,
      resetCurrentChat,
      searchChatHistory,
      historySearchResults,
      isHistorySearching,
      hasMoreMessages,
      loadMoreMessages,
      hasNewerMessages,
      loadNewerMessages,
      searchMessagesInChat,
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
      clearSearchResults, // 추가
      createDirectChat,
      exitDirectChatHandler,
      restoreDirectChatHandler,
      getUserProfileHandler,
      clearNewChatNotificationHandler,
      clearError,
      resetCurrentChat,
      searchChatHistory,
      historySearchResults,
      isHistorySearching,
      hasMoreMessages,
      loadMoreMessages,
      hasNewerMessages,
      loadNewerMessages,
    ],
  );

  // Moved fetchProfileByAuthId to top

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

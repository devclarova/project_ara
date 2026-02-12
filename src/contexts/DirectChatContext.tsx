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
import { usePresence } from './PresenceContext';

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
  const { updateDbStatus } = usePresence();

  // 프로필 캐시 & 조회용 Ref
  const profileCache = useRef<Map<string, ChatUser>>(new Map());
  const currentUserProfileRef = useRef<ChatUser | null>(null);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  // 차단 목록 로드
  const loadBlockedUsers = useCallback(async () => {
    if (!currentUserId) return;
    let myProfId = '';
    if (currentUserProfileRef.current) {
      myProfId = currentUserProfileRef.current.id;
    } else {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUserId)
        .maybeSingle();
      if (pData) myProfId = pData.id;
    }

    if (!myProfId) return;

    const { data } = await supabase
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', myProfId)
      .is('ended_at', null);

    if (data) {
      setBlockedUserIds(new Set(data.map(b => b.blocked_id)));
    }
  }, [currentUserId]);

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
          setChats(response.data);
          const unreadChatsCount = response.data.filter(chat => {
            if (blockedUserIds.has(chat.other_user.id)) return false;
            return (chat.unread_count || 0) > 0;
          }).length;
          setUnreadCount(unreadChatsCount);
          
          response.data.forEach(chat => {
            if (chat.other_user?.id && chat.other_user.is_online !== undefined) {
              updateDbStatus(chat.other_user.id, chat.other_user.is_online);
            }
          });
        } else {
          handleError(response.error || '채팅방 목록을 불러올 수 없습니다.');
        }
      } catch (err: any) {
        if (err.message === '사용자가 로그인되지 않았습니다.') return;
        handleError('채팅방 목록 로드 중 오류가 발생했습니다.');
      } finally {
        isLoadingChatsRef.current = false;
      }
    }, 200);
  }, [blockedUserIds, setUnreadCount, handleError, updateDbStatus]);

  // 차단/해제 시 상태 갱신 리스너
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
  }, [loadBlockedUsers, loadChats]);

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

      const { data } = await supabase
        .from('profiles')
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

      if (userInfo.id && userInfo.is_online !== undefined) {
        updateDbStatus(userInfo.id, userInfo.is_online);
      }

      return userInfo;
    },
    [user, updateDbStatus],
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

  const loadMessages = useCallback(
    async (chatId: string, targetId?: string) => {
      try {
        currentChatId.current = chatId;
        setError(null);
        setMessages([]);
        setHasMoreMessages(false);

        let chatInfo = chatsRef.current.find(chat => chat.id === chatId) || null;

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
          if (chatInfo.other_user?.id && chatInfo.other_user.is_online !== undefined) {
            updateDbStatus(chatInfo.other_user.id, chatInfo.other_user.is_online);
          }
        }

        const response = await getMessages(chatId, 30, undefined, targetId);
        if (response.success && response.data) {
          const incoming = response.data.messages;
          const filteredIncoming = incoming.filter(m => !blockedUserIds.has(m.sender_id));
          const sorted = targetId ? filteredIncoming : [...filteredIncoming].reverse();

          const unique = Array.from(new Map(sorted.map(m => [m.id, m])).values());
          unique.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          setMessages(unique);
          setHasMoreMessages(response.data.hasNext);

          if (targetId) {
            setHasNewerMessages(response.data.hasNext);
            setHasMoreMessages(true);
          } else {
            setHasNewerMessages(false);
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
    [clearNewChatNotificationHandler, blockedUserIds, handleError, updateDbStatus],
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
            const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
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
            const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
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

      setChats(prev =>
        prev.map(chat =>
          chat.id === messageData.chat_id
            ? {
                ...chat,
                last_message: {
                  content: messageData.content ?? '',
                  created_at: now,
                  sender_nickname: myProfile?.nickname || '',
                  sender_id: user?.id || '',
                  attachments: previewAttachments,
                },
                last_message_at: now,
              }
            : chat,
        ),
      );

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
              prev.map(msg => {
                if (msg.id !== tempId) return msg;
                return {
                  ...sent,
                  sender: (sent.sender || msg.sender || myProfile || undefined) as ChatUser,
                  attachments: sent.attachments && sent.attachments.length > 0 ? sent.attachments : msg.attachments,
                };
              }),
            );
          }

          setChats(prev =>
            prev.map(chat =>
              chat.id === messageData.chat_id
                ? {
                    ...chat,
                    last_message: {
                      content: sent.content ?? '',
                      created_at: sent.created_at,
                      sender_nickname: sent.sender?.nickname || '',
                      sender_id: sent.sender_id,
                      attachments: sent.attachments ?? [],
                    },
                    last_message_at: sent.created_at,
                  }
                : chat,
            ),
          );
          return true;
        } else {
          if (currentChatId.current === messageData.chat_id) {
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
          }
          handleError(response.error || '메시지 전송에 실패했습니다.');
          return false;
        }
      } catch (err) {
        if (currentChatId.current === messageData.chat_id) {
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
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
        const matchedChats = chats.filter(chat =>
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
        const targetChat = chatsRef.current.find(c => c.id === chatId);
        const otherProfileId = targetChat?.other_user?.id;
        const myProfileId = currentUserProfileRef.current?.id;

        const response = await exitDirectChat(chatId);

        if (response.success) {
          await supabase
            .from('direct_messages')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('chat_id', chatId)
            .neq('sender_id', currentUserId)
            .eq('is_read', false);

          if (otherProfileId && myProfileId) {
            await supabase
              .from('notifications')
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
    } catch (err: any) {
      if (err.message === '사용자가 로그인되지 않았습니다.') return;
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

  // Realtime 메시지 처리
  useEffect(() => {
    if (!currentUserId) return;

    const handleNewMessage = async (payload: any) => {
      let newMessage = payload.new;
      const chatId = newMessage.chat_id;
      
      if (blockedUserIds.has(newMessage.sender_id)) return;

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      for (let i = 0; i < 3; i++) {
        try {
          const { data: fullMessage } = await supabase
            .from('direct_messages')
            .select(`*, attachments:direct_message_attachments(*)`)
            .eq('id', newMessage.id)
            .maybeSingle();

          if (fullMessage) {
            newMessage = fullMessage;
            if (fullMessage.attachments && fullMessage.attachments.length > 0) break;
          }
        } catch (e) {}
        if (i < 2) await delay(500);
      }

      if (currentChatId.current === chatId) {
        let senderProfile = await fetchProfileByAuthId(newMessage.sender_id);
        const msgWithSender = { ...newMessage, sender: senderProfile };

        setMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) return prev;
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

          return [...prev, { ...newMessage, sender: senderProfile, attachments: newMessage.attachments ?? [] }];
        });

        if (newMessage.sender_id !== currentUserId) {
          supabase.from('direct_messages').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', newMessage.id).then();
        }
      }

      if (newMessage.sender_id !== currentUserId) {
        setChats(prevChats => {
          const existingChatIndex = prevChats.findIndex(chat => chat.id === chatId);
          if (existingChatIndex !== -1) {
            const updatedChat = { ...prevChats[existingChatIndex] };
            updatedChat.last_message = {
              content: newMessage.content ?? '',
              created_at: newMessage.created_at,
              sender_id: newMessage.sender_id,
              sender_nickname: '',
              attachments: newMessage.attachments ?? [],
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
      }
    };

    const channel = supabase
      .channel(`direct_chat_unified_${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, payload => {
        if (payload.eventType === 'INSERT') {
          handleNewMessage(payload);
        } else if (payload.eventType === 'UPDATE') {
          const updatedMsg = payload.new;
          const chatId = updatedMsg.chat_id;
          const isDeleted = !!updatedMsg.deleted_at || (updatedMsg.content && updatedMsg.content.includes('관리자에 의해 삭제된 메시지입니다'));

          if (currentChatId.current === chatId) {
            setMessages(prev => prev.map(msg => msg.id === updatedMsg.id ? { ...msg, content: updatedMsg.content, deleted_at: isDeleted ? updatedMsg.deleted_at || new Date().toISOString() : updatedMsg.deleted_at, attachments: isDeleted ? [] : msg.attachments } : msg));
          }

          setChats(prev => prev.map(chat => {
            if (chat.id === chatId && chat.last_message && (chat.last_message.created_at === updatedMsg.created_at || (chat.last_message as any).id === updatedMsg.id)) {
              return { ...chat, last_message: { ...chat.last_message, content: updatedMsg.content, attachments: isDeleted ? [] : chat.last_message.attachments } };
            }
            return chat;
          }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, loadChats, fetchProfileByAuthId, blockedUserIds]);

  const hasNewChatNotification = useMemo(
    () => chats.some(chat => !blockedUserIds.has(chat.other_user.id) && (chat.unread_count || 0) > 0),
    [chats, blockedUserIds],
  );

  useEffect(() => {
    const channel = supabase
      .channel('global-profile-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        const updated = payload.new as any;
        if (!updated) return;
        const authId = updated.user_id;
        if (authId && profileCache.current.has(authId)) {
          const existing = profileCache.current.get(authId)!;
          profileCache.current.set(authId, { ...existing, nickname: updated.nickname ?? existing.nickname, avatar_url: updated.avatar_url ?? existing.avatar_url, banned_until: updated.banned_until });
        }
        setChats(prev => prev.map(chat => chat.other_user?.id === updated.id ? { ...chat, other_user: { ...chat.other_user, nickname: updated.nickname ?? chat.other_user.nickname, avatar_url: updated.avatar_url ?? chat.other_user.avatar_url, banned_until: updated.banned_until } } : chat));
        setCurrentChat(prev => (prev && prev.other_user?.id === updated.id) ? { ...prev, other_user: { ...prev.other_user, nickname: updated.nickname ?? prev.other_user.nickname, avatar_url: updated.avatar_url ?? prev.other_user.avatar_url, banned_until: updated.banned_until } } : prev);
        setMessages(prev => prev.map(msg => (msg.sender?.id === updated.id || msg.sender_id === updated.user_id) ? { ...msg, sender: { ...(msg.sender || {}), nickname: updated.nickname ?? msg.sender?.nickname, avatar_url: updated.avatar_url ?? msg.sender?.avatar_url, banned_until: updated.banned_until } as ChatUser } : msg));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const needFill = messages.filter(m => !m.sender && m.sender_id);
    if (needFill.length === 0) return;
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(needFill.map(async m => {
        try { const s = await fetchProfileByAuthId(m.sender_id as string); return { id: m.id, sender: s }; } catch { return null; }
      }));
      if (cancelled) return;
      const map = new Map<string, ChatUser>();
      pairs.filter(Boolean).forEach(p => map.set((p as any).id, (p as any).sender));
      setMessages(prev => prev.map(m => (m.sender || !map.has(m.id)) ? m : { ...m, sender: map.get(m.id)! }));
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
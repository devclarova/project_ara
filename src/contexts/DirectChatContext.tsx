/**
 * 1 : 1 채팅 Context Provider
 *  - 1 : 1 채팅 기능 전역 상태 관리
 *  - 채팅방, 메시지, 사용자 검색 등의 상태와 액션 제공
 *
 * 주요 기능
 *  - 채팅방 목록 관리
 *  - 메시지 전송 및 조회
 *  - 사용자 검색
 *  - 에러 처리
 *  - 로딩 상태 관리
 *  - 추후 실시간 채팅 업데이트 필요
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

/**
 * DirectChatContext 의  Context 타입 정의
 * state 의 모양
 * action 의 모양
 */
interface DirectChatContextType {
  // state ========================
  chats: ChatListItem[]; // 채팅방 여러개 관리
  inactiveChats: ChatListItem[]; // 비활성화된 채팅방 목록
  messages: DirectMessage[]; // 여러 메시지를 관리
  users: ChatUser[]; // 검색된 여러 사용자
  currentChat: ChatListItem | null; // 현재 선택된 채팅방 정보
  loading: boolean; // 로딩 상태 관리
  userSearchLoading: boolean; // 사용자 검색 로딩 상태 (별도 관리)
  error: string | null;
  hasNewChatNotification: boolean; // 새 채팅방 알림 여부
  // action ========================
  loadChats: () => Promise<void>; // 채팅 목록 로딩 상태관리
  loadInactiveChats: () => Promise<void>; // 비활성화된 채팅방 목록 로딩
  loadMessages: (chatId: string) => Promise<void>; // 특정 채팅방의 메시지 조회
  // 메시지가 제대로 전송되었는지 아닌지 체크를 위해서 boolean 리턴 타입
  sendMessage: (messageData: CreateMessageData) => Promise<boolean>; // 메시지 전송
  searchUsers: (searchTerm: string) => Promise<void>; // 검색어(닉네임)롤 사용자 검색
  createDirectChat: (participantId: string) => Promise<string | null>; // 채팅방 생성 또는 접근
  exitDirectChat: (chatId: string) => Promise<boolean>; // 채팅방 나가기
  restoreDirectChat: (chatId: string) => Promise<boolean>; // 채팅방 복구
  getUserProfile: (userId: string) => Promise<ChatUser | null>; // 사용자 프로필 조회 (디버깅용)
  clearNewChatNotification: (chatId: string) => Promise<boolean>; // 새 채팅방 알림 해제
  clearError: () => void; // 에러 상태만 초기화 하기
}
// 컨테스트 생성
const DirectChatContext = createContext<DirectChatContextType | null>(null);

// Provide 의 Props
interface DirectChatProiderProps {
  children: React.ReactNode;
}
// Provider 생성
export const DirectChatProider: React.FC<DirectChatProiderProps> = ({ children }) => {
  // 상태관리
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [inactiveChats, setInactiveChats] = useState<ChatListItem[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [userSearchLoading, setUserSearchLoading] = useState(false); // 사용자 검색 전용 로딩 상태
  const [error, setError] = useState<string | null>(null);
  const [hasNewChatNotification, setHasNewChatNotification] = useState(false);

  // 사용자가 선택해서 활성화한 채팅방의 ID 를 보관함.
  // 리랜더링이 되어서 값이 갱신되거나, 화면에 보여줄 필요는 없음.
  const currentChatId = useRef<string | null>(null);

  // 현재 사용자 정보
  const { user } = useAuth();
  const currentUserId = user?.id;

  // 새 채팅 알림 Context
  const { setHasNewChat } = useNewChatNotification();

  // 공통 기능 함수
  // 에러 메시지 전용 함수
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  // 액션들
  // 채팅방 목록 가져오기 : 내가 참여한 목록
  const loadChats = useCallback(async () => {
    try {
      // 채팅방 목록 로드 시에는 전역 로딩 상태를 사용하지 않음 (사용자 경험 개선)
      const response = await getChatList();
      if (response.success && response.data) {
        setChats(response.data); // 목록담기

        // 새 채팅방 알림 상태 업데이트
        const hasNewChat = response.data.some(chat => chat.is_new_chat);
        setHasNewChatNotification(hasNewChat);
      } else {
        handleError(response.error || '채팅방 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      handleError('채팅방 목록 로드 중 오류가 발생했습니다.');
    }
  }, [handleError]);

  // 새 채팅방 알림 해제 핸들러
  const clearNewChatNotificationHandler = useCallback(
    async (chatId: string): Promise<boolean> => {
      try {
        const response = await clearNewChatNotification(chatId);
        if (response.success) {
          // 채팅방 목록 새로고침
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

  // 선택된 채팅방의 모든 메시지 가져오기
  const loadMessages = useCallback(
    async (chatId: string) => {
      try {
        // 메시지 로드 시에는 전역 로딩 상태를 사용하지 않음 (사용자 경험 개선)

        // 현재 활성화된 채팅방 ID 보관
        currentChatId.current = chatId;

        // 현재 채팅방 정보 찾기
        const chatInfo = chats.find(chat => chat.id === chatId);
        if (chatInfo) {
          setCurrentChat(chatInfo);

          // 새 채팅방 알림이 있으면 해제
          if (chatInfo.is_new_chat) {
            await clearNewChatNotificationHandler(chatId);
          }
        }

        const response = await getMessages(chatId);
        if (response.success && response.data) {
          setMessages(response.data);

          // 채팅방에 처음 입장할 때는 시스템 메시지를 생성하지 않음
          // (본인이 들어간 것은 시스템 메시지로 표시하지 않음)
        } else {
          handleError(response.error || '메시지를 불러올 수 없습니다.');
        }
      } catch (err) {
        handleError('메시지 로드 중 오류가 발생했습니다.');
      }
    },
    [handleError, chats, clearNewChatNotificationHandler],
  );

  const sendMessage = useCallback(
    async (messageData: CreateMessageData) => {
      try {
        // 메시지 전송 시에는 전역 로딩 상태를 사용하지 않음 (사용자 경험 개선)
        const response = await sendMessageService(messageData);
        if (response.success && response.data) {
          // 메시지 전송 성공 후 즉시 로컬 상태에 메시지 추가 (자연스러운 UX)
          setMessages(prev => [...prev, response.data!]);

          // 채팅방 목록만 업데이트 (메시지는 Realtime으로 처리)
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

  // 검색어로 사용자 목록 출력
  const searchUsers = useCallback(
    async (searchTerm: string) => {
      try {
        setUserSearchLoading(true); // 사용자 검색 전용 로딩 상태 사용
        const response = await searchUsersService(searchTerm);
        if (response.success && response.data) {
          setUsers(response.data);
        } else {
          handleError(response.error || '사용자 검색에 실패했습니다.');
        }
      } catch (err) {
        handleError('사용자 검색 중 오류가 발생했습니다.');
      } finally {
        setUserSearchLoading(false); // 사용자 검색 전용 로딩 상태 해제
      }
    },
    [handleError],
  );

  // 채팅방 생성 또는 있으면 선택
  const createDirectChat = useCallback(
    async (participantId: string): Promise<string | null> => {
      try {
        setLoading(true);
        const response = await findOrCreateDirectChat(participantId);

        if (response.success && response.data) {
          // 채팅방 새로 고침으로 목록 갱신
          await loadChats();
          return response.data.id; // 새 채팅ID 를 전달한 이유는 즉시 채팅방 참여
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

  // 채팅방 나가기
  const exitDirectChatHandler = useCallback(
    async (chatId: string): Promise<boolean> => {
      try {
        setLoading(true);
        const response = await exitDirectChat(chatId);
        if (response.success) {
          // 채팅방 목록에서 제거
          setChats(prev => prev.filter(chat => chat.id !== chatId));
          // 현재 채팅방이 나간 채팅방이면 초기화
          if (currentChatId.current === chatId) {
            currentChatId.current = null;
            setCurrentChat(null);
            setMessages([]);
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
    [handleError],
  );

  // 비활성화된 채팅방 목록 로딩
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

  // 채팅방 복구
  const restoreDirectChatHandler = useCallback(
    async (chatId: string): Promise<boolean> => {
      try {
        setLoading(true);
        const response = await restoreDirectChat(chatId);
        if (response.success) {
          // 비활성화된 채팅방 목록에서 제거
          setInactiveChats(prev => prev.filter(chat => chat.id !== chatId));
          // 활성화된 채팅방 목록 새로고침
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

  // 사용자 프로필 조회 (디버깅용)
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

  // 에러메시지 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Realtime 구독 설정
  useEffect(() => {
    if (!currentUserId) return;

    // 간단한 Realtime 테스트
    // const testChannel = supabase
    //   .channel('test_channel')
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*',
    //       schema: 'public',
    //       table: 'direct_chats',
    //     },
    //     payload => {
    //       // 테스트 Realtime 수신
    //     },
    //   )
    //   .subscribe(status => {
    //     // 테스트 Realtime 상태
    //   });

    // 통합 채널로 모든 변경사항 감지
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
          // 현재 사용자가 참여자인지 확인
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
          // 현재 사용자가 참여자였는지 확인
          if (payload.old.user1_id === currentUserId || payload.old.user2_id === currentUserId) {
            loadChats();
            // 현재 채팅방이 삭제된 채팅방이면 초기화
            if (currentChatId.current === payload.old.id) {
              currentChatId.current = null;
              setCurrentChat(null);
              setMessages([]);
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
          // 현재 사용자가 참여자였는지 확인
          if (payload.new.user1_id === currentUserId || payload.new.user2_id === currentUserId) {
            // 사용자별 active 상태 변경 감지
            const isCurrentUserUser1 = payload.new.user1_id === currentUserId;
            const oldActive = isCurrentUserUser1
              ? payload.old.user1_active
              : payload.old.user2_active;
            const newActive = isCurrentUserUser1
              ? payload.new.user1_active
              : payload.new.user2_active;
            const otherUserActive = isCurrentUserUser1
              ? payload.new.user2_active
              : payload.new.user1_active;

            // 현재 사용자가 나간 경우
            if (oldActive === true && newActive === false) {
              loadChats(); // 채팅방 목록에서 제거

              // 현재 채팅방이면 초기화
              if (currentChatId.current === payload.new.id) {
                currentChatId.current = null;
                setCurrentChat(null);
                setMessages([]);
              }
            }
            // 현재 사용자가 다시 들어온 경우
            else if (oldActive === false && newActive === true) {
              loadChats(); // 채팅방 목록에 다시 표시
            }
            // 상대방이 나간 경우
            else if (oldActive === true && newActive === true && otherUserActive === false) {
              // 상대방이 나간 시스템 메시지 생성
              const otherUserId = isCurrentUserUser1 ? payload.new.user2_id : payload.new.user1_id;
              const systemMessage = `상대방이 채팅방을 나갔습니다.`;

              // 상대방의 auth.users.id 조회
              supabase
                .from('profiles')
                .select('user_id')
                .eq('id', otherUserId)
                .single()
                .then(({ data: otherUserProfile, error: profileError }) => {
                  if (profileError || !otherUserProfile) {
                    console.error('상대방 프로필 조회 실패:', profileError);
                    return;
                  }

                  // 시스템 메시지 전송
                  supabase
                    .from('direct_messages')
                    .insert({
                      chat_id: payload.new.id,
                      sender_id: otherUserProfile.user_id, // auth.users.id 사용
                      content: systemMessage,
                      is_read: false,
                      is_system_message: true,
                    })
                    .then(({ error }) => {
                      if (error) {
                        console.error('상대방 나가기 시스템 메시지 전송 실패:', error);
                      }
                    });
                });

              // 현재 채팅방이면 초기화 (상대방이 나갔으므로)
              if (currentChatId.current === payload.new.id) {
                currentChatId.current = null;
                setCurrentChat(null);
                setMessages([]);
              }
              // 채팅방 목록은 새로고침하지 않음 (현재 사용자는 여전히 참여 중)
            }
            // 상대방이 다시 들어온 경우
            else if (oldActive === true && newActive === true && otherUserActive === true) {
              // 채팅방 목록은 새로고침하지 않음 (현재 사용자는 이미 목록에 있음)
            }
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
        payload => {
          // 시스템 메시지인지 내용으로 판단 (나가기 메시지만)
          const isSystemMessage =
            payload.new.content && payload.new.content.includes('님이 채팅방을 나갔습니다');

          // 디버깅 로그
          console.log('새 메시지 도착:', {
            chatId: payload.new.chat_id,
            currentChatId: currentChatId.current,
            senderId: payload.new.sender_id,
            currentUserId: currentUserId,
            isSystemMessage,
            isCurrentChat: currentChatId.current === payload.new.chat_id,
            isMyMessage: payload.new.sender_id === currentUserId,
          });

          if (isSystemMessage) {
            // 시스템 메시지인 경우 특별 처리
            if (currentChatId.current === payload.new.chat_id) {
              setMessages(prev => {
                // 중복 메시지 방지: 같은 ID의 메시지가 이미 있는지 확인
                const messageExists = prev.some(msg => msg.id === payload.new.id);
                if (messageExists) {
                  return prev;
                }
                return [...prev, payload.new as DirectMessage];
              });
            }
          } else {
            // 일반 메시지인 경우
            if (currentChatId.current === payload.new.chat_id) {
              // 현재 채팅방에서 메시지 도착 - 알림 없음 (채팅 중이므로)
              setMessages(prev => {
                // 중복 메시지 방지: 같은 ID의 메시지가 이미 있는지 확인
                const messageExists = prev.some(msg => msg.id === payload.new.id);
                if (messageExists) {
                  return prev;
                }
                return [...prev, payload.new as DirectMessage];
              });
            } else {
              // 다른 채팅방에서 메시지 도착 - 알림 설정
              // 본인이 보낸 메시지가 아닌 경우에만 알림 설정
              if (payload.new.sender_id !== currentUserId) {
                console.log('알림 설정:', payload.new.chat_id);
                setHasNewChat(true);
              } else {
                console.log('본인 메시지 - 알림 없음');
              }
            }
          }
          // 채팅방 목록도 업데이트 (마지막 메시지 시간 변경)
          // 단, 본인이 보낸 메시지인 경우에는 알림을 설정하지 않음
          if (payload.new.sender_id !== currentUserId) {
            loadChats();
          }
        },
      )
      .subscribe(status => {
        // Realtime 구독 상태 확인
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime 구독 실패!');
        } else if (status === 'TIMED_OUT') {
          console.error('Realtime 구독 시간 초과!');
        } else if (status === 'CLOSED') {
          // console.error('Realtime 구독 연결 종료!');
          console.log('Realtime 구독 정상 종료');
        }
      });

    return () => {
      channel.unsubscribe();
      // testChannel.unsubscribe();
    };
  }, [currentUserId, loadChats]);

  // Context 의 value
  const value: DirectChatContextType = {
    // 상태(state)
    chats,
    inactiveChats,
    messages,
    users,
    currentChat,
    loading,
    userSearchLoading, // 사용자 검색 전용 로딩 상태 추가
    error,
    hasNewChatNotification,
    // 액션 (action) : 샹태관리 업데이트 함수
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
  };
  return <DirectChatContext.Provider value={value}>{children}</DirectChatContext.Provider>;
};

// 커스텀 훅
export const useDirectChat = () => {
  const context = useContext(DirectChatContext);
  if (!context) {
    throw new Error('채팅 컨텐스트가 생성되지 않았습니다.');
  }
  return context;
};

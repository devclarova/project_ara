import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

interface NewChatNotificationContextType {
  // 읽지 않은 "채팅방" 개수
  unreadCount: number;

  // 하나라도 있으면 true (편의용)
  hasNewChat: boolean;

  // DirectChatContext 에서 unreadCount를 갱신해줄 때 사용
  setUnreadCount: (count: number) => void;

  // 필요하면 전체 읽음 처리용 (지금은 안 써도 됨)
  markChatAsRead: () => void;
}

const NewChatNotificationContext = createContext<NewChatNotificationContextType | null>(null);

/**
 * 메시지 배지 및 유입 알림 전송 브릿지(Chat Notification Bridge):
 * - 목적(Why): 실시간 채팅 유입 시 헤더 및 내비게이션 배지 상태를 전역적으로 동기화하며 읽음 처리 전파를 담당함
 * - 방법(How): UI 반응성 확보를 위해 캐시된 미읽음 카운트의 인메모리 정규화를 수행함
 */
export const NewChatNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // 편의용 boolean
  const hasNewChat = unreadCount > 0;

  // 전체 읽음 처리 (안 쓰면 안 써도 됨)
  const markChatAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const value = useMemo(() => ({
    unreadCount,
    hasNewChat,
    setUnreadCount,
    markChatAsRead,
  }), [unreadCount, hasNewChat, markChatAsRead]);

  return (
    <NewChatNotificationContext.Provider value={value}>
      {children}
    </NewChatNotificationContext.Provider>
  );
};

export const useNewChatNotification = () => {
  const ctx = useContext(NewChatNotificationContext);
  if (!ctx) {
    throw new Error('NewChatNotificationContext가 생성되지 않았습니다.');
  }
  return ctx;
};

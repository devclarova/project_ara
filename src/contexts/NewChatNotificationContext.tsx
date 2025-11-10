import React, { createContext, useContext, useState } from 'react';

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

export const NewChatNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // 편의용 boolean
  const hasNewChat = unreadCount > 0;

  // 전체 읽음 처리 (안 쓰면 안 써도 됨)
  const markChatAsRead = () => {
    setUnreadCount(0);
  };

  const value: NewChatNotificationContextType = {
    unreadCount,
    hasNewChat,
    setUnreadCount,
    markChatAsRead,
  };

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

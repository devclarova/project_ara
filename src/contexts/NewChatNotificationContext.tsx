import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface NewChatNotificationContextType {
  hasNewChat: boolean;
  setHasNewChat: (hasNew: boolean) => void;
  markChatAsRead: () => void;
}

const NewChatNotificationContext = createContext<NewChatNotificationContextType | undefined>(
  undefined,
);

export function NewChatNotificationProvider({ children }: { children: ReactNode }) {
  const [hasNewChat, setHasNewChat] = useState(false);

  const markChatAsRead = () => {
    setHasNewChat(false);
  };

  return (
    <NewChatNotificationContext.Provider value={{ hasNewChat, setHasNewChat, markChatAsRead }}>
      {children}
    </NewChatNotificationContext.Provider>
  );
}

export function useNewChatNotification() {
  const context = useContext(NewChatNotificationContext);
  if (context === undefined) {
    throw new Error('useNewChatNotification must be used within a NewChatNotificationProvider');
  }
  return context;
}

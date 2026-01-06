import React from 'react';
import { usePresence } from '@/contexts/PresenceContext';
import { useTranslation } from 'react-i18next';

interface OnlineIndicatorProps {
  userId: string | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isOnlineOverride?: boolean; // Prop to use database status directly if available
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({ 
  userId, 
  size = 'md',
  className = '',
  isOnlineOverride
}) => {
  const { t } = useTranslation();
  const { onlineUsers, dbOnlineUsers } = usePresence();
  
  // 1. 직접 전달된 상태(isOnlineOverride) 우선
  // 2. 그 다음 DB 실시간 상태(dbOnlineUsers)
  // 3. 마지막으로 휘발성 Presence 상태(onlineUsers)
  const isOnline = isOnlineOverride !== undefined 
    ? isOnlineOverride 
    : (userId ? (dbOnlineUsers[userId] ?? onlineUsers.has(userId)) : false);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  return (
    <div 
      className={`
        rounded-full transition-all duration-300
        ${isOnline 
          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
          : 'bg-zinc-300 dark:bg-zinc-600'}
        ${sizeClasses[size]}
        ${className}
      `}
      title={isOnline ? t('common.online') : t('common.offline')}
    />
  );
};

/**
 * 실시간 접속 상태 시각화 유닛(Real-time Presence Indicator Unit):
 * - 목적(Why): 특정 사용자의 현재 활성 상태를 직관적으로 표시하여 실시간 소통 가능 여부를 전달함
 * - 방법(How): PresenceContext의 실시간 엔진 데이터와 DB 기반의 프로필 상태를 결합하여 상태별 색상(Emerald/Zinc) 및 글로우 효과를 동적으로 렌더링함
 */
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
  const { isUserOnline } = usePresence();
  
  // Availability Heuristics: Determines online status by prioritizing explicit profile overrides and real-time presence engine data.
  const isOnline = isOnlineOverride !== undefined
    ? isOnlineOverride
    : isUserOnline(userId);

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

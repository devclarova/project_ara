/**
 * PlanBadge — 플랜별 아바타 래퍼 컴포넌트
 * - free: 기본 (배지 없음)
 * - basic: 인디고 그라데이션 보더 + Zap 아이콘
 * - premium: 틸 글로우 그라데이션 보더 + SeagullIcon + 애니메이션
 */
import React from 'react';
import SeagullIcon from '@/components/common/SeagullIcon';

interface PlanBadgeProps {
  plan: string | null | undefined;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function PlanBadge({ plan, children, size = 'md' }: PlanBadgeProps) {
  const iconSize = size === 'sm' ? 9 : size === 'lg' ? 13 : 11;
  const badgeWH = size === 'sm' ? 'w-[12px] h-[12px]' : size === 'lg' ? 'w-[17px] h-[17px]' : 'w-[14px] h-[14px]';
  const badgePos = size === 'sm' ? '-top-0.5 -left-0.5' : '-top-1 -left-1';

  if (plan === 'premium') {
    return (
      <div className="relative flex-shrink-0 rounded-full p-[3px] bg-[#00BFA5] shadow-[0_0_12px_rgba(0,191,165,0.6),0_2px_8px_rgba(0,191,165,0.4)]">
        {children}
        <div className={`absolute ${badgePos} z-10 p-[2px] bg-white dark:bg-secondary rounded-full shadow-[0_2px_8px_rgba(0,191,165,0.4)]`}>
          <div className={`bg-gradient-to-br from-[#00E5FF] via-[#00BFA5] to-[#00796B] ${badgeWH} rounded-full flex items-center justify-center shadow-[inset_0_1px_3px_rgba(255,255,255,0.5)]`}>
            <SeagullIcon size={iconSize} className="text-white drop-shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (plan === 'basic') {
    return (
      <div className="relative flex-shrink-0 rounded-full p-[2px] bg-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.5),0_2px_8px_rgba(99,102,241,0.3)]">
        {children}
      </div>
    );
  }

  return <div className="relative flex-shrink-0">{children}</div>;
}

/**
 * 계정 상태 제재 시각화 유닛(Account Sanction Status Visualization Unit):
 * - 목적(Why): 이용 제한(Ban) 조치된 사용자의 상태를 직관적으로 노출하여 커뮤니티 투명성을 높이고 정책 준수를 유도함
 * - 방법(How): 잔여 시간(date-fns)을 계산하여 영구/기간제 배지를 동적으로 생성하며, 툴팁을 통해 구체적인 제한 정보를 서빙함
 */
import React from 'react';
import { addYears, differenceInCalendarDays } from 'date-fns';
import { Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BanBadgeProps {
  bannedUntil?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const BanBadge: React.FC<BanBadgeProps> = ({ 
  bannedUntil, 
  className,
  size = 'md'
}) => {
  if (!bannedUntil) return null;

  const endDate = new Date(bannedUntil);
  const now = new Date();

  if (endDate <= now) return null;

  // Permanent Sanction Detection: Identifies ban periods exceeding 50 years to classify as indefinite account restriction.
  const permanentThreshold = addYears(now, 50);
  const isPermanent = endDate > permanentThreshold;

  // Geometric Scaling: Defines predefined dimension tokens for round badge variants to maintain layout consistency.
  const sizeStyles = {
    xs: "w-4 h-4 text-[9px]",     // Back to 16px
    sm: "w-5 h-5 text-[10px]",    // Back to 20px
    md: "w-6 h-6 text-[11px]",    // Back to 24px
    lg: "w-8 h-8 text-sm"         // Back to 32px
  };

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20
  };

  if (isPermanent) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <span className={cn(
              "inline-flex items-center justify-center rounded-full select-none cursor-help",
              sizeStyles[size],
              "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 p-0.5",
              className
            )}>
              <Ban size={iconSizes[size]} strokeWidth={2.5} />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-red-600 text-white border-none">
            <p>영구 이용제한 계정</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Temporal Delta Calculation: Computes the calendar day difference between the ban expiration and current timestamp.
  const diff = differenceInCalendarDays(endDate, now);
  // Lower-bound Normalization: Ensures a minimum visible value of 1 day for accounts expiring within the current 24H window.
  const daysLeft = diff <= 0 ? 1 : diff; 
  const displayDays = daysLeft > 99 ? '99+' : daysLeft.toString();

  // Prohibition UI Synthesis: Implements a composite visual symbol using layered CSS overlays to merge icons with residual counters.
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={cn(
            "relative inline-flex items-center justify-center rounded-full select-none cursor-help font-bold font-mono overflow-hidden",
            sizeStyles[size],
            "text-orange-700 dark:text-orange-300 border border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/20",
            className
          )}>
            {/* Data Layer: Renders residual days. Positioned via origin-centering for optimal legibility beneath the slash overlay. */}
            <span className="z-0 leading-none pt-[0.5px] scale-95 origin-center">{displayDays}</span>
            
            {/* Geometric Prohibition Slash: 45-degree rotated overlay to complete the universal ban icon semantics. */}
            <span className="absolute top-1/2 left-1/2 w-[140%] h-[1.5px] bg-orange-500/50 dark:bg-orange-400/50 -translate-x-1/2 -translate-y-1/2 rotate-45 z-10 pointer-events-none" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs bg-orange-500 text-white border-none">
          <p>이용제한 계정 ({daysLeft}일 남음)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

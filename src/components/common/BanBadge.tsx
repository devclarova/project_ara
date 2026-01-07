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

  // Check for Permanent Ban (> 50 years from now)
  const permanentThreshold = addYears(now, 50);
  const isPermanent = endDate > permanentThreshold;

  // Sizes for icon-only badges (square/circle aspect)
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

  // Calculate remaining days for temporary ban
  const diff = differenceInCalendarDays(endDate, now);
  // 최소 1일 표시 (오늘 풀리더라도 "1" 또는 "D-Day"이겠지만 공간상 숫자만)
  // 99일 초과시 99+
  const daysLeft = diff <= 0 ? 1 : diff; 
  const displayDays = daysLeft > 99 ? '99+' : daysLeft.toString();

  // Custom "Prohibition Sign" CSS implementation
  // Container: Bordered Circle
  // Child 1: Centered Text
  // Child 2: Diagonal Line (Slash)
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
            {/* The Text - z-index ensures it's readable, slash is semi-transparent over it */}
            <span className="z-0 leading-none pt-[0.5px] scale-95 origin-center">{displayDays}</span>
            
            {/* The Slash (Diagonal Line) - Thinner and centered */}
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

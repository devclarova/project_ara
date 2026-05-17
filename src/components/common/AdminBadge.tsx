import type { ReactNode } from 'react';

type AdminBadgeSize = 'xs' | 'sm' | 'md' | 'lg';

type AdminAvatarBadgeProps = {
  isAdmin?: boolean | null;
  size?: AdminBadgeSize;
  animated?: boolean;
  children: ReactNode;
  className?: string;
  showPin?: boolean;
};

type AdminTextBadgeProps = {
  isAdmin?: boolean | null;
  size?: 'xs' | 'sm' | 'md';
  label?: string;
  className?: string;
};

const sizeMap: Record<
  AdminBadgeSize,
  {
    padding: string;
    maskInset: string;
    ringInset: string;
    iconBox: string;
    iconSvg: string;
    iconOffset: string;
    shadow: string;
  }
> = {
  xs: {
    padding: 'p-[2px]',
    maskInset: 'inset-[2px]',
    ringInset: 'inset-0',
    iconBox: 'h-3.5 w-3.5',
    iconSvg: 'h-2.5 w-2.5',
    iconOffset: '-left-0.5 -top-0.5',
    shadow: '',
  },
  sm: {
    padding: 'p-[2.5px]',
    maskInset: 'inset-[2.5px]',
    ringInset: 'inset-0',
    iconBox: 'h-[18px] w-[18px]',
    iconSvg: 'h-[18px] w-[18px]',
    iconOffset: '-left-0.5 -top-0.5',
    shadow: '',
  },
  md: {
    padding: 'p-[3px]',
    maskInset: 'inset-[3px]',
    ringInset: 'inset-0',
    iconBox: 'h-[22px] w-[22px]',
    iconSvg: 'h-[22px] w-[22px]',
    iconOffset: '-left-1 -top-1',
    shadow: '',
  },
  lg: {
    padding: 'p-[4px]',
    maskInset: 'inset-[4px]',
    ringInset: 'inset-0',
    iconBox: 'h-[26px] w-[26px]',
    iconSvg: 'h-[26px] w-[26px]',
    iconOffset: '-left-1 -top-1',
    shadow: '',
  },
};

const animSpeedFwd = {
  xs: 'animate-[spin_24s_linear_infinite]',
  sm: 'animate-[spin_20s_linear_infinite]',
  md: 'animate-[spin_16s_linear_infinite]',
  lg: 'animate-[spin_12s_linear_infinite]',
} as const;

const animSpeedRev = {
  xs: 'animate-[spin_24s_linear_infinite_reverse]',
  sm: 'animate-[spin_20s_linear_infinite_reverse]',
  md: 'animate-[spin_16s_linear_infinite_reverse]',
  lg: 'animate-[spin_12s_linear_infinite_reverse]',
} as const;

const textSizeMap = {
  xs: 'h-5 px-2 text-[10px] gap-1',
  sm: 'h-6 px-2.5 text-[11px] gap-1.5',
  md: 'h-7 px-3 text-xs gap-1.5',
} as const;

const haloGradientLight =
  'conic-gradient(from 35deg, #0F766E 0deg, #0F766E 80deg, #9BA4B5 100deg, #9BA4B5 170deg, #4338CA 190deg, #4338CA 260deg, #C9A95E 280deg, #C9A95E 360deg)';

const haloGradientDark =
  'conic-gradient(from 35deg, #0F766E 0deg, #0F766E 80deg, #D7E4F5 100deg, #D7E4F5 170deg, #4338CA 190deg, #4338CA 260deg, #D7B86A 280deg, #D7B86A 360deg)';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function AdminSigilIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M12 2.9 19.7 7.35v9.3L12 21.1 4.3 16.65v-9.3L12 2.9Z"
        fill="url(#adminSigilBg)"
        stroke="rgba(215,228,245,0.72)"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <path
        d="M12.05 6.15 16.9 17.95h-2.18l-.82-2.2H10.1l-.82 2.2H7.15l4.9-11.8Zm-1.28 7.74h2.46l-1.2-3.45-1.26 3.45Z"
        fill="#F6DFA5"
      />
      <path
        d="M7.35 12.4c1.72-1.55 3.3-2.32 4.72-2.32 1.43 0 2.96.77 4.58 2.32"
        stroke="#C7D7F2"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.86"
      />
      <defs>
        <linearGradient
          id="adminSigilBg"
          x1="5"
          y1="4"
          x2="19"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#111827" />
          <stop offset="0.38" stopColor="#312E81" />
          <stop offset="0.72" stopColor="#0F766E" />
          <stop offset="1" stopColor="#0B1020" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AdminIconPin({
  size,
}: {
  size: AdminBadgeSize;
}) {
  const config = sizeMap[size];

  return (
    <span
      className={cx(
        'absolute z-20 inline-flex items-center justify-center rounded-full border',
        'border-[#D7E4F5]/45 bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4A3F2C]',
        'shadow-sm',
        config.iconBox,
        config.iconOffset
      )}
    >
      <AdminSigilIcon className={config.iconSvg} />
    </span>
  );
}

export function AdminAvatarBadge({
  isAdmin,
  size = 'md',
  animated = false,
  children,
  className,
  showPin = true,
}: AdminAvatarBadgeProps) {
  if (!isAdmin) return <>{children}</>;

  const config = sizeMap[size];
  const shouldAnimate = animated; // Allow animation for all sizes

  return (
    <span
      className={cx(
        'relative inline-flex shrink-0 items-center justify-center overflow-visible rounded-full',
        config.padding,
        config.shadow,
        className
      )}
    >
      {/* Light Mode Halo */}
      <span
        aria-hidden="true"
        className={cx(
          'absolute rounded-full dark:hidden',
          config.ringInset,
          shouldAnimate && animSpeedFwd[size],
          shouldAnimate && 'motion-reduce:animate-none'
        )}
        style={{
          background: haloGradientLight,
        }}
      />
      {/* Dark Mode Halo */}
      <span
        aria-hidden="true"
        className={cx(
          'absolute rounded-full hidden dark:block',
          config.ringInset,
          shouldAnimate && animSpeedFwd[size],
          shouldAnimate && 'motion-reduce:animate-none'
        )}
        style={{
          background: haloGradientDark,
        }}
      />

      {/* Mask Layer */}
      <span
        aria-hidden="true"
        className={cx('absolute rounded-full bg-white dark:bg-[#080B14]', config.maskInset)}
      />

      <span className="relative z-10 inline-flex shrink-0 overflow-hidden rounded-full">
        {children}
      </span>

      {showPin && <AdminIconPin size={size} />}
    </span>
  );
}

export function AdminTextBadge({
  isAdmin,
  size = 'sm',
  label = 'ARA Admin',
  className,
}: AdminTextBadgeProps) {
  if (!isAdmin) return null;

  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center rounded-full border font-bold tracking-[0.01em]',
        'border-violet-200 bg-white/90 text-violet-800 shadow-[0_4px_12px_rgba(139,92,246,0.15)]',
        'dark:border-[#D7B86A]/35 dark:bg-[#0B1020]/90 dark:text-[#F6DFA5]',
        'dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_6px_16px_rgba(0,0,0,0.18)]',
        textSizeMap[size],
        className
      )}
    >
      <span
        className={cx(
          'inline-flex items-center justify-center rounded-full border',
          'border-[#D7E4F5]/45 bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4A3F2C]',
          size === 'xs' ? 'h-3.5 w-3.5' : size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'
        )}
      >
        <AdminSigilIcon
          className={size === 'xs' ? 'h-2.5 w-2.5' : size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'}
        />
      </span>
      <span>{label}</span>
    </span>
  );
}

export default AdminAvatarBadge;

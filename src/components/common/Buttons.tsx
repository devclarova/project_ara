import React from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  onSave?: () => void;
  onClose?: () => void;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  onSave,
  onClose,
  onClick,
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    onSave?.();
    onClose?.();
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      className={clsx(
        'rounded-xl font-medium transition active:translate-y-[1px] focus:outline-none',
        {
          // 사이즈 옵션
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-5 py-3 text-base': size === 'lg',

          // variant별 색상
          'bg-primary/80 text-white hover:bg-primary': variant === 'primary',
          'bg-gray-100 text-gray-800 hover:bg-gray-200': variant === 'secondary',
          'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
          'bg-transparent text-gray-700 hover:bg-gray-100': variant === 'ghost',

          // 전체 폭 버튼
          'w-full': fullWidth,
        },
        className,
      )}
    >
      {children}
    </button>
  );
}

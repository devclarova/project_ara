/**
 * 범용 디자인 시스템 버튼 유닛(Universal Design System Button Unit):
 * - 목적(Why): 서비스 전반의 클릭 가능한 요소에 대해 일관된 시각적 피드백과 접근성을 제공함
 * - 방법(How): 프리셋된 변종(Variant)과 크기(Size) 토큰을 clsx를 통해 동적으로 합성하여 테마 및 상태에 최적화된 버튼을 렌더링함
 */
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
          // Dimensional Scaling: Maps sm/md/lg specifications to precise padding and font-size tokens for cross-component consistency.
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-5 py-3 text-base': size === 'lg',

          // Semantic Color Mapping: Defines background and text color hierarchies based on functional intent (Primary / Danger / Ghost).
          'bg-primary/80 text-white hover:bg-primary': variant === 'primary',
          'bg-gray-100 text-gray-800 hover:bg-gray-200': variant === 'secondary',
          'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
          'bg-transparent text-gray-700 hover:bg-gray-100': variant === 'ghost',

          // Layout Extensibility: Toggles block-level display to fill parent container width in responsive contexts.
          'w-full': fullWidth,
        },
        className,
      )}
    >
      {children}
    </button>
  );
}

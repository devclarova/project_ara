/**
 * 포털 기반 범용 모달 시스템(Portal-based Universal Modal System):
 * - 목적(Why): 상위 컴포넌트의 DOM 계층 및 스타일 간섭을 탈피하여 독립적인 오버레이 레이어를 렌더링함
 * - 방법(How): React Portal을 활용하여 Document Body에 직접 주입하고, Body Scroll Lock 및 Keyboard A11y 가드를 적용함
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string; // Container style override: Allows parent components to control modal dimensions and positioning
  contentClassName?: string; // Body area style override: Controls scroll behavior and padding for the internal content region
  headerClassName?: string; // Header area style override: For custom branding or specific transparency effects
}
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className,
  contentClassName,
  headerClassName,
}: ModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // 스크롤 락 — 모달 활성화 시 배경 레이어 스크롤 차단 및 레이아웃 시프트(Scroll Jump) 방지. 전역 훅(useBodyScrollLock) 연동.
  useBodyScrollLock(isOpen);
  useEffect(() => {
    setMounted(true);
  }, []);
  // Keyboard Interaction: Listens for Escape key presses to dismiss the modal, ensuring compliance with accessibility (a11y) standards.
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      // 접근성 제스처 — 키보드 Escape 입력 가로채기를 통한 모달 폐쇄 처리
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeOnEsc, onClose]);
  // 뷰포트 레이어 분리 — DOM 계층 간섭 방지를 위한 Document Body 기반 포털 렌더링
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const isMouseDownOnBackdrop = useRef(false);

  if (!mounted || !isOpen || !modalRoot) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
      onMouseDown={e => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          isMouseDownOnBackdrop.current = true;
        }
      }}
      onMouseUp={e => {
        if (closeOnBackdrop && e.target === e.currentTarget && isMouseDownOnBackdrop.current) {
          onClose();
        }
        isMouseDownOnBackdrop.current = false;
      }}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Modal'}
    >
      <div
        ref={modalContentRef}
        className={`relative w-full bg-white dark:bg-secondary rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-200 ${className || 'max-w-3xl h-[80vh]'}`}
        style={{
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Region: Contains title and primary dismissal action. Uses backdrop-blur for glassmorphism effects. */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white/50 dark:bg-secondary/50 backdrop-blur-sm ${headerClassName || ''}`}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Internal Content Region: Implements independent scroll container with overscroll-contain to prevent scroll chaining. */}
        <div
          className={`flex-1 overflow-y-auto block relative overscroll-contain ${contentClassName || ''}`}
          data-scroll-lock-scrollable=""
        >
          {children}
        </div>
      </div>
    </div>,
    modalRoot,
  );
}

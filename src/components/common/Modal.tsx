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
  className?: string; // 모달 컨테이너(카드) 스타일 커스텀
  contentClassName?: string; // 내부 컨텐츠 영역 스타일 커스텀
  headerClassName?: string; // 헤더 영역 스타일 커스텀
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
  // Hook으로 스크롤 잠금 처리 (Scroll Jump 방지). Main 브랜치의 수동 로직 대신 Hook 사용.
  useBodyScrollLock(isOpen);
  useEffect(() => {
    setMounted(true);
  }, []);
  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeOnEsc, onClose]);
  // Portal target setting
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  if (!mounted || !isOpen || !modalRoot) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
      onMouseDown={e => e.stopPropagation()} // 부모의 '외부 클릭 감지' 방지 (Portal 사용 시 필수)
      onClick={closeOnBackdrop ? onClose : undefined}
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
        {/* Header */}
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

        {/* Content Wrapper */}
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

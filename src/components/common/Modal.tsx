import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string; // ✅ 모달 컨테이너(카드) 스타일 커스텀
  contentClassName?: string; // ✅ 내부 컨텐츠 영역 스타일 커스텀
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
}: ModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const originalOverflow = body.style.overflow;
    
    // 단순 overflow hidden으로 변경
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div 
        ref={modalContentRef}
        className={`relative w-full bg-white dark:bg-secondary rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-200 ${className || 'max-w-3xl h-[80vh]'}`}
        style={{
             maxHeight: '90vh'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white/50 dark:bg-secondary/50 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>
        
        {/* Content Wrapper */}
        <div className={`flex-1 overflow-y-auto block relative ${contentClassName || 'px-6 py-4'}`}>
          {children}
        </div>
      </div>
    </div>,
    modalRoot,
  );
}


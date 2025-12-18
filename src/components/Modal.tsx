import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, isOpen, onClose, children }: ModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);

  // 모달 열릴 때 body 스크롤 완전 잠금 (PC + 모바일)
  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const originalOverflow = body.style.overflow;
    const originalTouchAction = (body.style as any).touchAction;

    // body 스크롤만 막고, 모달 내부는 자유롭게 스크롤 가능하도록
    body.style.overflow = 'hidden';
    (body.style as any).touchAction = 'none';

    return () => {
      body.style.overflow = originalOverflow || '';
      (body.style as any).touchAction = originalTouchAction || '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const modalRoot = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;
  if (!modalRoot) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 md:pt-16 bg-black/40 dark:bg-black/60 min-h-screen transition-colors"
      onClick={onClose}
    >
      <div 
        ref={modalContentRef}
        className="relative w-full max-w-4xl mx-4 md:mx-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 flex flex-col max-h-[80vh] transition-colors duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="w-6" />
          <h2 className="text-base md:text-lg font-bold truncate">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-gray-900">{children}</div>
      </div>
    </div>,
    modalRoot,
  );
}

export default Modal;

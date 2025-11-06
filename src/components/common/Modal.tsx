import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  closeOnBackdrop = true,
  closeOnEsc = true,
}: ModalProps) {
  // ✅ 훅은 항상 실행
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeOnEsc, onClose]);

  const modalRoot =
    typeof document !== 'undefined'
      ? (document.getElementById('modal-root') ?? document.body)
      : null;

  if (!isOpen || !modalRoot) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 md:pt-16 
                 bg-black/40 dark:bg-black/60 min-h-screen transition-colors"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative w-full max-w-4xl mx-4 md:mx-6 
                   rounded-2xl shadow-2xl overflow-hidden 
                   bg-white dark:bg-secondary 
                   border border-gray-200 dark:border-gray-700
                   text-gray-900 dark:text-gray-100
                   flex flex-col min-h-[60vh] md:min-h-[68vh] max-h-[80vh]"
        onClick={e => e.stopPropagation()} // 내부 클릭 시 닫힘 방지
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="뒤로가기"
          >
            <img
              src="/images/back.svg"
              alt="뒤로가기"
              className="w-6 h-6 invert-0 dark:invert transition"
            />
          </button>
          <h2 className="text-base md:text-lg font-bold truncate">{title}</h2>
          <div className="w-6" /> {/* 우측 정렬용 공간 */}
        </div>

        {/* Body: children 쪽에서 스크롤/여백 관리 */}
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </div>,
    modalRoot,
  );
}

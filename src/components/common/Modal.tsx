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
  if (!isOpen) return null;

  // ESC로 닫기
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeOnEsc, onClose]);

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40 dark:bg-black/60 min-h-screen transition-colors"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-xl mx-4 rounded-2xl shadow-xl overflow-hidden min-h-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
        onClick={e => e.stopPropagation()} // 내부 클릭 시 닫힘 방지
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="뒤로가기"
          >
            <img
              src="/back.svg"
              alt="뒤로가기"
              className="w-6 h-6 invert-0 dark:invert transition"
            />
          </button>
          <h2 className="text-lg font-bold">{title}</h2>
          <div className="w-6" /> {/* 우측 정렬용 공간 */}
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    modalRoot,
  );
}

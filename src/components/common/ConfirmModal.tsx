import { useEffect } from 'react';

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title = '정말 진행하시겠습니까?',
  description,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-xl text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 text-xl font-bold text-gray-900 dark:text-white">{title}</div>

        {description && (
          <div className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {description}
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl ring-1 ring-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

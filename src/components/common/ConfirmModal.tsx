/**
 * 범용 의사결정 확인 모달(Universal Decision Confirmation Modal):
 * - 목적(Why): 파괴적인 작업(삭제, 로그아웃 등) 전 사용자에게 한 단계 더 높은 주의를 환기하여 오조작을 방지함
 * - 방법(How): 포탈 레이어 위에서 키보드(Escape) 인지 및 백드롭 클릭 이벤트를 관리하여 직관적인 하이-피델리티 인터랙션을 구현함
 */
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
      // Accessibility Interaction: Listens for the Escape key to trigger the cancellation callback, ensuring modal dismissibility.
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

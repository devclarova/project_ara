import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface BlockButtonProps {
  isBlocked: boolean;
  username: string;
  onToggle: () => void; // 차단 ↔ 차단해제 전환
  onClose: () => void;
}

export default function BlockButton({ isBlocked, username, onToggle, onClose }: BlockButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      onClick={e => {
        e.stopPropagation();

        if (!isBlocked) {
          toast.success(t('common.block_success', { name: username }));
        } else {
          toast.success(t('common.unblock_success', { name: username }));
        }

        onToggle(); // 상태 변경
        onClose(); // 메뉴 닫기
      }}
      className="w-full text-left px-4 py-3 hover:bg-gray-100 
        dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200"
    >
      <i className="ri-forbid-line" />
      {isBlocked ? t('common.unblock') : t('common.block')}
    </button>
  );
}

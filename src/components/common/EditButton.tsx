import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface EditButtonProps {
  onAlign?: () => void; // Optional alignment or other logic
  onEdit?: () => void;
  onClose: () => void;
}

export default function EditButton({ onEdit, onClose }: EditButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        if (onEdit) {
           onEdit();
        } else {
           toast(t('common.edit_mode'));
        }
        onClose();
      }}
      className="w-full text-left px-4 py-3 hover:bg-gray-100 
        dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200"
    >
      <i className="ri-edit-line" />
      {t('common.edit')}
    </button>
  );
}

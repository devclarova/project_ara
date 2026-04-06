/**
 * 콘텐츠 수정 진입 유닛(Content Edition Entry Unit):
 * - 목적(Why): 사용자가 자신이 작성한 콘텐츠를 수정할 수 있는 표준화된 경로를 제공함
 * - 방법(How): 드롭다운 메뉴나 컨텍스트 메뉴 내에서 수정 모드(Editing Mode)를 활성화하고 관련 모달을 호출하는 브릿지 역할을 수행함
 */
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface EditButtonProps {
  onAlign?: () => void; // Layout Alignment Dispatcher: Optional callback to trigger coordinate recalibration or custom sorting logic.
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

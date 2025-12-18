import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ReportButtonProps {
  onClose: () => void;
}

export default function ReportButton({ onClose }: ReportButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        toast.success(t('common.success_report'));
        onClose();
      }}
      className="w-full text-left px-4 py-3 hover:bg-gray-100 
        dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200"
    >
      <i className="ri-flag-line" />
      {t('common.report')}
    </button>
  );
}

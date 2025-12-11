import { toast } from 'sonner';

interface ReportButtonProps {
  onClose: () => void;
}

export default function ReportButton({ onClose }: ReportButtonProps) {
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        toast.success('신고가 접수되었습니다.');
        onClose();
      }}
      className="w-full text-left px-4 py-3 hover:bg-gray-100 
        dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200"
    >
      <i className="ri-flag-line" />
      신고하기
    </button>
  );
}

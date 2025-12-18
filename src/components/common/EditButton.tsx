import { toast } from 'sonner';

interface EditButtonProps {
  onClose: () => void;
}

export default function EditButton({ onClose }: EditButtonProps) {
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        toast('수정 모드로 전환됩니다.');
        onClose();
      }}
      className="w-full text-left px-4 py-3 hover:bg-gray-100 
        dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200"
    >
      <i className="ri-edit-line" />
      수정하기
    </button>
  );
}

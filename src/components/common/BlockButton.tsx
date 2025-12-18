import { toast } from 'sonner';

interface BlockButtonProps {
  isBlocked: boolean;
  username: string;
  onToggle: () => void; // 차단 ↔ 차단해제 전환
  onClose: () => void;
}

export default function BlockButton({ isBlocked, username, onToggle, onClose }: BlockButtonProps) {
  return (
    <button
      onClick={e => {
        e.stopPropagation();

        if (!isBlocked) {
          toast.success(`${username}님을 차단했습니다.`);
        } else {
          toast.success(`${username}님 차단을 해제했습니다.`);
        }

        onToggle(); // 상태 변경
        onClose(); // 메뉴 닫기
      }}
      className="w-full text-left px-4 py-3 hover:bg-gray-100 
        dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200"
    >
      <i className="ri-forbid-line" />
      {isBlocked ? '차단해제' : '차단하기'}
    </button>
  );
}

import { useState } from 'react';
import Switch from './Switch';


interface PrivacySettingsProps {
  onBackToMenu?: () => void; // ← 부모에서 전달받는 콜백 (선택)
}

export default function AlarmSettings({ onBackToMenu }: PrivacySettingsProps) {
  const [commentPush, setCommentPush] = useState(true);
  const [likePush, setLikePush] = useState(true);
  const [followPush, setFollowPush] = useState(true);

  return (
    <div className="space-y-6">
      {/* 헤더 + 모바일 화살표 */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex md:hidden items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="뒤로가기"
        >
          <i className="ri-arrow-left-line text-lg" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">알림 설정</h3>
      </div>

      <div className="space-y-1">
        <Switch
          checked={commentPush}
          onChange={setCommentPush}
          label="댓글 알림"
          description="내 게시물에 댓글이 달리면 알림"
        />
        <Switch
          checked={likePush}
          onChange={setLikePush}
          label="좋아요 알림"
          description="내 게시물에 좋아요가 눌리면 알림"
        />
        <Switch
          checked={followPush}
          onChange={setFollowPush}
          label="새 팔로워"
          description="누군가 나를 팔로우하면 알림"
        />
      </div>
    </div>
  );
}

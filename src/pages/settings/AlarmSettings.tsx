// 알림 설정 페이지

import { useState } from 'react';
import Switch from './Switch';

export default function AlarmSettings() {
  const [commentPush, setCommentPush] = useState(true);
  const [likePush, setLikePush] = useState(true);
  const [followPush, setFollowPush] = useState(true);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">알림 설정</h3>

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

/**
 * 차단 사용자 관리 및 해제 리스트(Blocked Users Management & Unblock List):
 * - 목적(Why): 사용자가 이전에 차단한 계정 목록을 확인하고, 필요 시 차단을 해제하여 소통 가능한 상태로 복구함
 * - 방법(How): useBlockedUsers 커스텀 훅을 통해 실시간 차단 목록을 페칭하고, Avatar 컴포넌트와 unblockMutation을 연동하여 즉각적인 UI 업데이트 및 데이터 정합성을 유지함
 */
import { useTranslation } from 'react-i18next';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function BlockedUsersList() {
  const { t } = useTranslation();
  const { blockedUsers, isLoading, unblockMutation } = useBlockedUsers();

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">{t('common.loading', '로딩 중...')}</div>;
  }

  if (blockedUsers.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t('settings.no_blocked_users', '차단한 사용자가 없습니다.')}
      </div>
    );
  }

  const handleUnblock = (id: string) => {
    if (confirm(t('settings.confirm_unblock', '정말 차단을 해제하시겠습니까?'))) {
        unblockMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      {blockedUsers.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || '/default-avatar.svg'} alt={user.nickname || 'User'} />
              <AvatarFallback>{(user.nickname || 'U').substring(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user.nickname || 'Unknown User'}</p>
              <p className="text-xs text-muted-foreground">@{user.user_id}</p>
            </div>
          </div>
          <button
            onClick={() => handleUnblock(user.id)}
            className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            {t('common.unblock', '차단 해제')}
          </button>
        </div>
      ))}
    </div>
  );
}

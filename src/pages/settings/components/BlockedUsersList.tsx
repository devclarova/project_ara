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

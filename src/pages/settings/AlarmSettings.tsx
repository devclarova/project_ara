import { useState } from 'react';
import Switch from './Switch';

interface PrivacySettingsProps {
  onBackToMenu?: () => void; // ← 부모에서 전달받는 콜백 (선택)
}

import { useTranslation } from 'react-i18next';

export default function AlarmSettings({ onBackToMenu }: PrivacySettingsProps) {
  const { t } = useTranslation();
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
          aria-label={t('common.back', 'Back')}
        >
          <i className="ri-arrow-left-line text-lg" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.notifications')}</h3>
      </div>

      <div className="space-y-1">
        <Switch
          checked={commentPush}
          onChange={setCommentPush}
          label={t('settings.alarm_comment')}
          description={t('settings.alarm_comment_desc')}
        />
        <Switch
          checked={likePush}
          onChange={setLikePush}
          label={t('settings.alarm_like')}
          description={t('settings.alarm_like_desc')}
        />
        <Switch
          checked={followPush}
          onChange={setFollowPush}
          label={t('settings.alarm_follow')}
          description={t('settings.alarm_follow_desc')}
        />
      </div>
    </div>
  );
}

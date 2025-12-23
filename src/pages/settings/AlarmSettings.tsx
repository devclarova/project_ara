import { useState, useEffect } from 'react';
import Switch from './Switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PrivacySettingsProps {
  onBackToMenu?: () => void;
  searchQuery?: string;
}

import { useTranslation } from 'react-i18next';

export default function AlarmSettings({ onBackToMenu, searchQuery }: PrivacySettingsProps) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // DB 컬럼과 매핑되는 상태들
  const [settings, setSettings] = useState({
    notify_comment: true,
    notify_like: true,
    notify_follow: true,
    notify_chat: true,
  });

  // 초기 설정 로딩
  useEffect(() => {
    async function loadSettings() {
      if (!session?.user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('notify_comment, notify_like, notify_follow, notify_chat')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;

        if (data) {
          setSettings({
            notify_comment: data.notify_comment ?? true,
            notify_like: data.notify_like ?? true,
            notify_follow: data.notify_follow ?? true,
            notify_chat: data.notify_chat ?? true,
          });
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
        toast.error(t('common.error_occurred'));
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [session]);

  // 설정 변경 핸들러
  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    // 1. Optimistic UI Update
    setSettings(prev => ({ ...prev, [key]: value }));

    if (!session?.user?.id) return;

    try {
      // 2. DB Update
      const { error } = await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('user_id', session.user.id);

      if (error) throw error;
      
      // 성공 피드백 알림
      toast.success(t('settings.saved', '설정이 저장되었습니다.'));
    } catch (error) {
      console.error('Failed to update setting:', error);
      // 실패 시 롤백 & 에러 알림
      setSettings(prev => ({ ...prev, [key]: !value }));
      toast.error(t('common.error_occurred'));
    }
  };

  if (loading) {
     return (
        <div className="space-y-4 animate-pulse">
           {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
           ))}
        </div>
     );
  }

  return (
    <div>
      {/* 헤더 + 모바일 화살표 */}
      <div className="flex items-center gap-2 mb-4">
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

      <div className="space-y-2">
        <Switch
          checked={settings.notify_comment}
          onChange={(v) => handleToggle('notify_comment', v)}
          label={t('settings.alarm_comment')}
          description={t('settings.alarm_comment_desc')}
          searchQuery={searchQuery}
        />
        <Switch
          checked={settings.notify_like}
          onChange={(v) => handleToggle('notify_like', v)}
          label={t('settings.alarm_like')}
          description={t('settings.alarm_like_desc')}
          searchQuery={searchQuery}
        />
        <Switch
          checked={settings.notify_follow}
          onChange={(v) => handleToggle('notify_follow', v)}
          label={t('settings.alarm_follow')}
          description={t('settings.alarm_follow_desc')}
          searchQuery={searchQuery}
        />
        <Switch
          checked={settings.notify_chat}
          onChange={(v) => handleToggle('notify_chat', v)}
          label={t('settings.alarm_chat')}
          description={t('settings.alarm_chat_desc')}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}

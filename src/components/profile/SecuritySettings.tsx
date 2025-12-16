import type { MenuId, SidebarItem } from '@/types/settings';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsLayout from './SettingsLayout';
import SettingsSidebar from './SettingsSidebar';
import SettingsContent from './SettingsContent';

export default function SecuritySettingsPage() {
  const { t } = useTranslation();
  const items: SidebarItem[] = [
    { id: 'security', label: t('settings.security_title') },
    { id: 'sessions', label: t('settings.session_management') },
  ];
  const [active, setActive] = useState<MenuId>('security');
  const sidebarWidth = 'md:w-[28rem]'; // 이 페이지만 28rem로 더 넓게

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-10">
      <SettingsLayout
        left={
          <SettingsSidebar
            title="보안"
            items={items}
            activeId={active}
            onChange={setActive}
            className={sidebarWidth}
          />
        }
        right={
          active === 'security' ? (
            <SettingsContent className="flex-1">보안 설정 내용</SettingsContent>
          ) : (
            <SettingsContent className={sidebarWidth}>세션 관리</SettingsContent>
          )
        }
      />
    </main>
  );
}

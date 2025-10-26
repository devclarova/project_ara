import type { MenuId, SidebarItem } from '@/types/settings';
import { useState } from 'react';
import SettingsLayout from './SettingsLayout';
import SettingsSidebar from './SettingsSidebar';
import SettingsContent from './SettingsContent';

const items: SidebarItem[] = [
  { id: 'security', label: '보안 설정' },
  { id: 'sessions', label: '세션 관리' },
];

export default function SecuritySettingsPage() {
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

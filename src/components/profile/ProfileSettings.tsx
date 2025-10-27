// settings 왼쪽 메뉴 + 오른쪽 내용 전체를 감싸는 레이아웃

import { useState } from 'react';

import AlarmSettings from '@/pages/settings/AlarmSettings';
import PrivacySettings from '@/pages/settings/PrivacySettings';
import SupportPolicy from '@/pages/settings/SupportPolicy';
import type { MenuId, SidebarItem } from '@/types/settings';
import SettingsContent from './SettingsContent';
import SidebarLeft from '../layout/SidebarLeft';
import SettingsLayout from './SettingsLayout';
import SettingsSidebar from './SettingsSidebar';

const items: SidebarItem[] = [
  { id: 'alarm', label: '알림 설정' },
  { id: 'privacy', label: '개인정보 설정' },
  { id: 'policy', label: '지원 및 정책' },
];

export default function ProfileSettings() {
  const [activeId, setActiveId] = useState<MenuId>('alarm');
  const handleChange = (id: MenuId) => setActiveId(id);
  const sidebarWidth = 'md:w-96'; // 공통 폭

  const rightPanel =
    activeId === 'alarm' ? (
      // 넓은 패널
      <SettingsContent className="flex-1">
        <AlarmSettings />
      </SettingsContent>
    ) : activeId === 'privacy' ? (
      // 사이드바와 같은 폭의 두번째 카드
      <SettingsContent className={sidebarWidth}>
        <PrivacySettings />
      </SettingsContent>
    ) : (
      <SettingsContent className={sidebarWidth}>
        <SupportPolicy />
      </SettingsContent>
    );

  return (
    <div className="min-h-screen flex max-w-7xl mx-auto">
      <SidebarLeft />
      <main className="p-6 md:p-10 text-[17px] md:text-[18px] w-full">
        <SettingsLayout
          left={
            <SettingsSidebar
              title="계정 설정"
              items={items}
              activeId={activeId}
              onChange={handleChange}
              className={sidebarWidth}
            />
          }
          right={rightPanel}
        />
      </main>
    </div>
  );
}

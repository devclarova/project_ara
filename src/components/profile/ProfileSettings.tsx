// settings 왼쪽 메뉴 + 오른쪽 내용 전체를 감싸는 레이아웃

import { useState } from 'react';
import AlarmSettings from '@/pages/settings/AlarmSettings';
import PrivacySettings from '@/pages/settings/PrivacySettings';
import SupportPolicy from '@/pages/settings/SupportPolicy';
import SystemSettings from '@/pages/settings/SystemSettings';
import type { MenuId, SidebarItem } from '@/types/settings';
import SidebarLeft from '../layout/SidebarLeft';
import SettingsContent from './SettingsContent';
import SettingsLayout from './SettingsLayout';
import SettingsSidebar from './SettingsSidebar';
import SearchBar from '../ui/SearchBar';
import Sidebar from '@/pages/homes/feature/Sidebar';
import Input from '../Input';

const items: SidebarItem[] = [
  { id: 'alarm', label: '알림 설정' },
  { id: 'privacy', label: '개인정보 설정' },
  { id: 'system', label: '시스템 설정' },
  { id: 'policy', label: '지원 및 정책' },
];

export default function ProfileSettings() {
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [activeId, setActiveId] = useState<MenuId>('alarm');
  const handleChange = (id: MenuId) => setActiveId(id);
  const sidebarWidth = 'sm:w-72 md:w-auto flex-1'; // 공통 폭

  const rightPanel =
    activeId === 'alarm' ? (
      <SettingsContent className={sidebarWidth}>
        <AlarmSettings />
      </SettingsContent>
    ) : activeId === 'privacy' ? (
      <SettingsContent className={sidebarWidth}>
        <PrivacySettings />
      </SettingsContent>
    ) : activeId === 'system' ? (
      <SettingsContent className={sidebarWidth}>
        <SystemSettings />
      </SettingsContent>
    ) : (
      <SettingsContent className={sidebarWidth}>
        <SupportPolicy />
      </SettingsContent>
    );

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Centered Container for all three sections */}
      <div className="flex justify-center min-h-screen">
        <div className="flex w-full max-w-7xl">
          {/* Left Sidebar - Now part of centered layout */}
          <div className="w-20 lg:w-64 flex-shrink-0">
            <div className="fixed w-20 lg:w-64 h-full z-10">
              <Sidebar onTweetClick={() => setShowTweetModal(true)} />
            </div>
          </div>

          {/* Central Content with spacing */}

          <main className="p-6 md:p-10 text-[17px] md:text-[18px] w-full">
            <input placeholder="검색어를 입력해주세요" />
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
      </div>
    </div>
  );
}

import Sidebar from '@/pages/homes/feature/Sidebar';
import AlarmSettings from '@/pages/settings/AlarmSettings';
import PrivacySettings from '@/pages/settings/PrivacySettings';
import SupportPolicy from '@/pages/settings/SupportPolicy';
import SystemSettings from '@/pages/settings/SystemSettings';
import type { MenuId, SidebarItem } from '@/types/settings';
import { useEffect, useState } from 'react';
import Input from '../Input';
import SettingsContent from './SettingsContent';
import SettingsLayout from './SettingsLayout';
import SettingsSidebar from './SettingsSidebar';

const items: SidebarItem[] = [
  { id: 'alarm', label: '알림 설정' },
  { id: 'privacy', label: '개인정보 설정' },
  { id: 'system', label: '시스템 설정' },
  { id: 'policy', label: '지원 및 정책' },
];

export default function ProfileSettings() {
  const [showTweetModal, setShowTweetModal] = useState(false);
  const [activeId, setActiveId] = useState<MenuId>('alarm');

  // 데스크톱/모바일 판별 + 모바일에서 어느 화면 보여줄지
  const [isMobile, setIsMobile] = useState(false);
  const [showMenuOnMobile, setShowMenuOnMobile] = useState(true);

  const sidebarWidth = 'md:w-auto flex-1'; // 데스크톱용 공통 폭

  // 화면 크기에 따라 모바일 여부 판단 (채팅 페이지랑 동일한 패턴)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768; // md 브레이크포인트 기준
      setIsMobile(mobile);

      if (!mobile) {
        // 데스크톱으로 돌아오면 항상 양쪽 다 보이게
        setShowMenuOnMobile(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 메뉴 변경 시
  const handleChange = (id: MenuId) => {
    setActiveId(id);
    // 모바일이면 메뉴 클릭 후 오른쪽 내용 화면으로 전환
    if (isMobile) {
      setShowMenuOnMobile(false);
    }
  };

  const rightPanel =
    activeId === 'alarm' ? (
      <SettingsContent className={sidebarWidth}>
        <AlarmSettings onBackToMenu={() => setShowMenuOnMobile(true)} />
      </SettingsContent>
    ) : activeId === 'privacy' ? (
      <SettingsContent className={sidebarWidth}>
        <PrivacySettings onBackToMenu={() => setShowMenuOnMobile(true)} />
      </SettingsContent>
    ) : activeId === 'system' ? (
      <SettingsContent className={sidebarWidth}>
        <SystemSettings onBackToMenu={() => setShowMenuOnMobile(true)} />
      </SettingsContent>
    ) : (
      <SettingsContent className={sidebarWidth}>
        <SupportPolicy onBackToMenu={() => setShowMenuOnMobile(true)} />
      </SettingsContent>
    );

  return (
    <div className="min-h-screen bg-white dark:bg-background overflow-x-hidden">
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
          <main className="p-6 md:p-10 text-[17px] md:text-[18px] w-full bg-white dark:bg-background text-gray-900 dark:text-gray-100 transition-colors">
            <Input placeholder="검색어를 입력해주세요" />

            {/* ✅ 반응형: 데스크톱(양쪽) vs 모바일(한 화면씩) */}
            {!isMobile ? (
              // 🔹 데스크톱 / 태블릿(>=768px): 기존처럼 좌/우 모두 보이기
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
            ) : showMenuOnMobile ? (
              // 🔹 모바일: 메뉴 화면
              <div className="mt-4">
                <SettingsSidebar
                  title="계정 설정"
                  items={items}
                  activeId={activeId}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>
            ) : (
              // 🔹 모바일: 설정 내용 화면 (화살표 ❌ 완전 제거)
              <div className="mt-4">{rightPanel}</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="flex justify-center">
        {/* 가운데 설정 컬럼 (프로필 페이지와 동일한 폭/보더 톤) */}
        <div className="w-full max-w-2xl lg:max-w-3xl dark:border-gray-700 dark:bg-background">
          <main className="px-4 sm:px-6 md:px-8 py-6 md:py-8 text-[17px] md:text-[18px] text-gray-900 dark:text-gray-100 transition-colors">
            {/* 상단 검색 인풋 여백 */}
            <div className="mb-4 md:mb-6">
              <Input placeholder="검색어를 입력해주세요" />
            </div>

            {/* 반응형: 데스크톱(양쪽) vs 모바일(한 화면씩) */}
            {!isMobile ? (
              // 데스크톱 / 태블릿(>=768px): 좌/우 모두 보이기
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
              // 모바일: 메뉴 화면
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
              // 모바일: 설정 내용 화면
              <div className="mt-4">{rightPanel}</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

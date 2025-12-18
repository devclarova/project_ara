import AlarmSettings from '@/pages/settings/AlarmSettings';
import PrivacySettings from '@/pages/settings/PrivacySettings';
import SupportPolicy from '@/pages/settings/SupportPolicy';
import SystemSettings from '@/pages/settings/SystemSettings';
import type { MenuId, SidebarItem } from '@/types/settings';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../Input';
import SettingsContent from './SettingsContent';
import SettingsLayout from './SettingsLayout';
import SettingsSidebar from './SettingsSidebar';

export default function ProfileSettings() {
  const { t } = useTranslation();
  
  const items: SidebarItem[] = [
    { 
      id: 'alarm', 
      label: t('settings.notifications'),
      keywords: [t('settings.alarm_push', '푸시 알림'), t('settings.alarm_email', '이메일 알림')]
    },
    { 
      id: 'privacy', 
      label: t('settings.privacy'),
      keywords: [
        t('settings.change_password', '비밀번호 변경'), 
        t('settings.connect_sns', 'SNS 연결'), 
        t('settings.withdraw', '탈퇴하기')
      ]
    },
    { 
      id: 'system', 
      label: t('settings.system'),
      keywords: [
        t('settings.language', '언어 설정'), 
        t('settings.theme', '테마 설정'), 
        t('settings.theme_dark', '다크 모드')
      ]
    },
    { 
      id: 'policy', 
      label: t('settings.support_policy'),
      keywords: [
        t('settings.terms', '이용약관'), 
        t('settings.privacy_policy', '개인정보 처리방침'), 
        t('settings.marketing_consent', '마케팅 정보 수신 동의'),
        t('settings.help_center', '고객센터')
      ]
    },
  ];

  const [activeId, setActiveId] = useState<MenuId>('alarm');

  // 데스크톱/모바일 판별 + 모바일에서 어느 화면 보여줄지
  const [isMobile, setIsMobile] = useState(false);
  const [showMenuOnMobile, setShowMenuOnMobile] = useState(true);

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

  const [searchQuery, setSearchQuery] = useState('');

  // 검색어에 따른 아이템 필터링 (라벨 + 키워드 검색)
  const getFilteredItems = (query: string) => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(item => {
      const labelMatch = item.label.toLowerCase().includes(lowerQuery);
      const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
      return labelMatch || keywordMatch;
    });
  };

  const filteredItems = getFilteredItems(searchQuery);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    const newFilteredItems = getFilteredItems(query);
    
    // 검색 결과가 존재하고, 현재 활성화된 탭이 결과에 포함되지 않을 경우
    // 결과 중 첫 번째 항목으로 자동 이동하여 오른쪽 화면 갱신
    if (newFilteredItems.length > 0) {
      const isCurrentActive = newFilteredItems.some(item => item.id === activeId);
      if (!isCurrentActive) {
        setActiveId(newFilteredItems[0].id);
      }
    }
  };

  const rightPanel =
    activeId === 'alarm' ? (
      <SettingsContent>
        <AlarmSettings onBackToMenu={() => setShowMenuOnMobile(true)} />
      </SettingsContent>
    ) : activeId === 'privacy' ? (
      <SettingsContent>
        <PrivacySettings onBackToMenu={() => setShowMenuOnMobile(true)} />
      </SettingsContent>
    ) : activeId === 'system' ? (
      <SettingsContent>
        <SystemSettings onBackToMenu={() => setShowMenuOnMobile(true)} />
      </SettingsContent>
    ) : (
      <SettingsContent>
        <SupportPolicy onBackToMenu={() => setShowMenuOnMobile(true)} />
      </SettingsContent>
    );

  return (
    <div className="bg-white dark:bg-background">
      <div className="flex justify-center">
        {/* 가운데 설정 컬럼 (프로필 페이지와 동일한 폭/보더 톤) */}
        <div className="w-full max-w-2xl lg:max-w-3xl dark:border-gray-700 dark:bg-background">
          <main className="px-4 sm:px-6 md:px-8 py-6 md:py-8 text-[17px] md:text-[18px] text-gray-900 dark:text-gray-100 transition-colors">
            {/* 상단 검색 인풋 여백 */}
            <div className="mb-4 md:mb-6">
              <Input 
                placeholder={t('common.search_placeholder', 'Search...')} 
                onChange={handleSearch}
              />
            </div>

            {/* 반응형: 데스크톱(양쪽) vs 모바일(한 화면씩) */}
            {!isMobile ? (
              // 데스크톱 / 태블릿(>=768px): 좌/우 모두 보이기
              <SettingsLayout
                left={
                  <SettingsSidebar
                    title={t('settings.account_settings')}
                    items={filteredItems}
                    activeId={activeId}
                    onChange={handleChange}
                    searchQuery={searchQuery}
                    className="flex-1" // 1:1 비율을 위해 flex-1 적용 (기존 고정폭 md:w-96 제거됨)
                  />
                }
                right={rightPanel}
              />
            ) : showMenuOnMobile ? (
              // 모바일: 메뉴 화면
              <div className="mt-4">
                <SettingsSidebar
                  title={t('settings.account_settings')}
                  items={filteredItems}
                  activeId={activeId}
                  onChange={handleChange}
                  className="w-full"
                  searchQuery={searchQuery}
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

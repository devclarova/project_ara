/**
 * 고밀도 계정 보안 및 세션 관리 콘솔(High-Density Account Security & Session Management Console):
 * - 목적(Why): 비밀번호 변경, 2단계 인증, 세션 추적 등 계정의 직접적인 보안 정책을 설정하고 관리함
 * - 방법(How): 확장된 사이드바 규격(28rem) 기반의 전용 레이아웃을 구성하여 고밀도 보안 설정을 시각적으로 구조화함
 */
import type { MenuId, SidebarItem } from '@/types/settings';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SettingsLayout from './SettingsLayout';
import SettingsSidebar from './SettingsSidebar';
import SettingsContent from './SettingsContent';

// 보안 설정 엔진(Security Policy Interface) — 비밀번호 변경, 2단계 인증 등 계정 보호 수단의 접근 제어 및 설정 분기 관리
export default function SecuritySettingsPage() {
  const { t } = useTranslation();
  const items: SidebarItem[] = [
    { id: 'security', label: t('settings.security_title') },
    { id: 'sessions', label: t('settings.session_management') },
  ];
  const [active, setActive] = useState<MenuId>('security');
  const sidebarWidth = 'md:w-[28rem]'; // 이 페이지만 28rem로 더 넓게

  // 보안 정책 인터페이스 — 비밀번호 변경, 2단계 인증 등 계정 보호 수단 설정 엔드포인트 구성
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

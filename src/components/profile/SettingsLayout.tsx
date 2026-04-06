// 설정 레이아웃 프레임워크 — 사이드바와 메인 콘텐츠 영역의 수평 배치를 정의하는 컨테이너 규격

/**
 * 컴포지션 기반 설정 프레임워크 그리너리(Composition-based Settings Framework Greenery):
 * - 목적(Why): 설정 사이드바와 본문 영역 간의 수평 대칭 및 일관된 간격(Gap) 체계를 정의함
 * - 방법(How): 유연한 Flexbox 그리드 시스템을 활용하여 좌우 레이어의 가중치를 균형 있게 분산하고 반응형 간격 토큰을 적용함
 */
import React from 'react';

// 그리드 배치 시스템(Grid Layout System) — 사이드바와 메인 콘텐츠 영역의 수평 배치를 정의하는 레이아웃 프레임워크
export default function SettingsLayout({
  left,
  right,
  gapClass = 'gap-6 md:gap-8',
}: {
  left: React.ReactNode; // 내비게이션 사이드바 컴포넌트
  right: React.ReactNode; // 메인 콘텐츠 영역 컴포넌트
  gapClass?: string; // 레이아웃 간격 조정을 위한 Tailwind CSS 클래스
}) {
  return (
    <div className={`flex ${gapClass}`}>
      <div className="flex-1 min-w-0">{left}</div>
      <div className="flex-1 min-w-0">{right}</div>
    </div>
  );
}

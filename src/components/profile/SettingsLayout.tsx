// 왼쪽 메뉴 + 오른쪽 내용 전체를 감싸는 레이아웃

import React from 'react';

export default function SettingsLayout({
  left,
  right,
  gapClass = 'gap-6 md:gap-10',
}: {
  left: React.ReactNode; // 공용 사이드바 등
  right: React.ReactNode; // 오른쪽 내용(넓은 패널 or 고정폭 패널)
  gapClass?: string;
}) {
  return (
    <div className={`flex ${gapClass}`}>
      {left}
      {right}
    </div>
  );
}

// 오른쪽 내용 (동적으로 바뀌는 부분)

import React from 'react';

export default function SettingsContent({
  children,
  className = 'flex-1', // 기본은 넓게; 고정폭 패널은 사용처에서 w-96 등으로 덮어쓰기
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] min-h-[420px] ${className}`}
    >
      {children}
    </section>
  );
}

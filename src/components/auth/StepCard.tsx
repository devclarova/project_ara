import type { PropsWithChildren } from 'react';

// 가입 단계 레이아웃 컨테이너 — 각 회원가입 스텝의 독립성을 보장하고 일관된 시각적 카드 스타일링 적용
export default function StepCard({ children }: PropsWithChildren) {
  return (
    <div
      className="
      rounded-2xl xs:rounded-xl bg-white dark:bg-secondary shadow-md
      ring-1 ring-gray-200/80 dark:ring-neutral-800 p-4 xs:p-3 sm:p-6 md:p-8
    "
    >
      {children}
    </div>
  );
}

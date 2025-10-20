import React from 'react';

type Step = 1 | 2 | 3;

export default function SignUpStepper({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: '동의' },
    { n: 2, label: '정보 입력' },
    { n: 3, label: '프로필' },
  ] as const;

  return (
    <ol className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6" aria-label="회원가입 단계">
      {steps.map((s, i) => {
        const isActive = current === s.n;
        const isDone = current > s.n;

        return (
          <li key={s.n} className="flex items-center gap-2">
            {/* 인덱스 동그라미 */}
            <span
              className={[
                'w-7 h-7 rounded-full grid place-items-center font-bold text-sm transition-colors',
                isActive
                  ? 'bg-[var(--ara-primary)] text-white ring-2 ring-[var(--ara-ring)]'
                  : isDone
                    ? 'bg-[var(--ara-primary)]/90 text-white'
                    : 'bg-gray-200 text-gray-600',
              ].join(' ')}
              aria-current={isActive ? 'step' : undefined}
            >
              {s.n}
            </span>

            {/* 라벨 */}
            <span
              className={[
                'font-semibold text-sm sm:text-base transition-colors',
                isActive || isDone ? 'text-gray-900' : 'text-gray-500',
              ].join(' ')}
            >
              {s.label}
            </span>

            {/* 구분선 */}
            {i < steps.length - 1 && (
              <span
                className={[
                  'mx-2 h-0.5 rounded transition-colors',
                  isDone ? 'bg-[var(--ara-primary)] w-10 sm:w-12' : 'bg-gray-200 w-8 sm:w-10',
                ].join(' ')}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

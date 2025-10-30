import type { PropsWithChildren } from 'react';

export default function StepCard({ children }: PropsWithChildren) {
  return (
    <div
      className="
      rounded-2xl bg-white dark:bg-neutral-900 shadow-md
      ring-1 ring-gray-200/80 dark:ring-neutral-800 p-4 sm:p-6 md:p-8
    "
    >
      {children}
    </div>
  );
}

import React from 'react';
import { CONTENT } from '../auth/consent/consentContent';

interface PrivacyPolicyViewProps {
  onClose?: () => void;
}

function PrivacyPolicyView({ onClose }: PrivacyPolicyViewProps) {
  const toc = CONTENT.privacy;

  if (!toc) {
    return (
      <div className="p-4 text-sm text-red-500">
        개인정보처리방침 문서를 찾을 수 없습니다. CONTENT.privacy 정의를 확인해주세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="grid grid-cols-1 md:grid-cols-[220px,minmax(0,1fr)] flex-1 min-h-0">
        {/* 좌측 목차 */}
        <nav className="hidden md:block border-r px-4 py-4 flex-none border-gray-200 dark:border-gray-700 dark:bg-secondary">
          <ul className="space-y-2 text-sm">
            {toc.sections.map(s => (
              <li key={s.id}>
                <button
                  className="text-left w-full text-gray-700 hover:text-[var(--ara-primary)] hover:underline 
                             dark:text-gray-200 dark:hover:text-[var(--ara-primary)]"
                  onClick={e => {
                    e.preventDefault();
                    const target = document.getElementById(s.id);
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  {s.h}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 본문 */}
        <div className="px-4 md:px-6 py-4 md:py-6 overflow-auto bg-white dark:bg-secondary">
          <div className="max-w-3xl mx-auto space-y-6 text-sm md:text-[15px] leading-relaxed text-gray-800 dark:text-gray-100">
            {toc.sections.map(s => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h4 className="text-base md:text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {s.h}
                </h4>
                <div className="text-[13px] md:text-[14px]">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {onClose && (
        <div className="flex justify-end gap-2 px-4 md:px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50
                       dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 text-xs md:text-sm"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}

export default PrivacyPolicyView;

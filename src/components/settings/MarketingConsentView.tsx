import { getContent } from '../auth/consent/consentContent';
import { useTranslation } from 'react-i18next';

interface MarketingConsentViewProps {
  onClose?: () => void;
}

export function MarketingConsentView({ onClose }: MarketingConsentViewProps) {
  const { t } = useTranslation();
  const toc = getContent(t).marketing;

  return (
    <div className="absolute inset-0 flex flex-col w-full h-full">
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* 좌측 목차 - 독립 스크롤 */}
        <nav className="hidden md:block w-56 flex-none border-r border-gray-200 dark:border-gray-700 overflow-y-auto custom-scrollbar">
          <ul className="space-y-2 text-sm p-4">
            {toc.sections.map(s => (
              <li key={s.id}>
                <button
                  className="text-left w-full text-gray-600 hover:text-[var(--ara-primary)] hover:underline 
                             dark:text-gray-300 dark:hover:text-[var(--ara-primary)] break-words"
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

        {/* 본문 - 독립 스크롤 */}
        <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar p-6">
          <div className="space-y-6 text-sm md:text-[15px] leading-relaxed text-gray-800 dark:text-gray-100">
            {toc.sections.map(s => (
              <section key={s.id} id={s.id} className="scroll-mt-6">
                <h4 className="text-base md:text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {s.h}
                </h4>
                <div className="text-[13px] md:text-[14px] whitespace-pre-wrap">{s.body}</div>
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
            {t('policy.close')}
          </button>
        </div>
      )}
    </div>
  );
}

export default MarketingConsentView;

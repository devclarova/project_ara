import { useTranslation } from 'react-i18next';

interface CustomerCenterViewProps {
  onClose?: () => void;
}

export function CustomerCenterView({ onClose }: CustomerCenterViewProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 flex flex-col w-full h-full">
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 custom-scrollbar">
        <div className="space-y-5 text-sm md:text-[15px] leading-relaxed text-gray-800 dark:text-gray-100">
          <p className="text-xs md:text-[13px] text-gray-400 dark:text-gray-500">
            {t('policy.help_center.intro')}
          </p>

          <section>
            <h4 className="text-base md:text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t('policy.help_center.email_title')}
            </h4>
            <p>
              <span className="font-medium">{t('policy.help_center.email_address')}</span>
              <br />
              {t('policy.help_center.email_hours')}
            </p>
          </section>

          <section>
            <h4 className="text-base md:text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t('policy.help_center.app_report_title')}
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-[13px] md:text-[14px]">
              <li>{t('policy.help_center.app_report_post')}</li>
              <li>{t('policy.help_center.app_report_dm')}</li>
            </ul>
          </section>

          <section>
            <h4 className="text-base md:text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t('policy.help_center.faq_title')}
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-[13px] md:text-[14px]">
              <li>{t('policy.help_center.faq_account')}</li>
              <li>{t('policy.help_center.faq_report')}</li>
              <li>{t('policy.help_center.faq_privacy')}</li>
            </ul>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('policy.help_center.faq_note')}
            </p>
          </section>
        </div>
      </div>

      {onClose && (
        <div className="flex-none flex justify-end gap-2 px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 text-xs md:text-sm"
          >
            {t('policy.close')}
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomerCenterView;

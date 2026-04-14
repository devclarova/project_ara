/**
 * 고객 지원 및 FAQ 가이드 인터페이스(Customer Support & FAQ Guide Interface):
 * - 목적(Why): 서비스 이용 중 발생하는 문제 해결을 위한 안내 및 1:1 상담 채널 정보를 제공함
 * - 방법(How): 카테고리별(계정/결제/보안) FAQ 요약 카드와 직접 문의 채널(Email/Call)을 구조화하여 사용자 접근성을 강화함
 */
import { useTranslation } from 'react-i18next';

// 고객센터 뷰
export default function CustomerCenterView() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <i className="ri-question-line text-xl"></i>
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-gray-100">{t('settings.customer_center.faq_title')}</p>
          <p className="text-gray-600 dark:text-gray-400">{t('settings.customer_center.faq_desc')}</p>
        </div>
      </div>

      <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <i className="ri-customer-service-2-line text-xl"></i>
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-gray-100">{t('settings.customer_center.contact_1on1_title')}</p>
          <p className="text-gray-600 dark:text-gray-400">{t('settings.customer_center.contact_1on1_desc')}</p>
        </div>
      </div>
    </div>
  );
}

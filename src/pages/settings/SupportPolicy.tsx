import Modal from '@/components/common/Modal';
import CustomerCenterView from '@/components/settings/CustomerCenterView';
import MarketingConsentView from '@/components/settings/MarketingConsentView';
import PrivacyPolicyView from '@/components/settings/PrivacyPolicyView';
import { Row } from '@/components/settings/Row';
import TermsView from '@/components/settings/TermsView';
import type { ActiveKey } from '@/types/settings';
import { getPolicyTitle } from '@/utils/getTitle';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PrivacySettingsProps {
  onBackToMenu?: () => void; // ← 부모에서 전달받는 콜백 (선택)
}

export default function SupportPolicy({ onBackToMenu }: PrivacySettingsProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState<ActiveKey>(null);
  const open = (key: ActiveKey) => setActive(key);
  const close = () => setActive(null);

  return (
    <div className="relative">
      {/* 카드 박스 스타일 */}
      <div className={`${active ? 'pointer-events-none blur-[2px]' : ''}`}>
        {/* 상단 헤더 + 모바일 화살표 */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={onBackToMenu}
            className="inline-flex md:hidden items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('common.back')}
          >
            <i className="ri-arrow-left-line text-lg" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.support_policy')}</h3>
        </div>

        <div className="space-y-2">
          <Row label={t('settings.terms')} onClick={() => open('terms')} />
          <Row label={t('settings.privacy_policy')} onClick={() => open('privacy')} />
          <Row label={t('settings.marketing_consent')} onClick={() => open('marketing')} />
          <Row label={t('settings.help_center')} onClick={() => open('support')} />
        </div>

        {/* 하단 여백 */}

      </div>

      {/* 모달: active 가 있을 때만 렌더링 */}
      <Modal 
        isOpen={!!active} 
        onClose={close} 
        title={t(getPolicyTitle(active))}
        contentClassName="flex-1 min-h-0 bg-white dark:bg-secondary overflow-hidden relative flex flex-col"
      >
        {active === 'terms' && <TermsView onClose={close} />}
        {active === 'privacy' && <PrivacyPolicyView onClose={close} />}
        {active === 'marketing' && <MarketingConsentView onClose={close} />}
        {active === 'support' && <CustomerCenterView onClose={close} />}
      </Modal>
    </div>
  );
}

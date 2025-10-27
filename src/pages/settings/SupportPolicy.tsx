// 지원 및 정책 페이지

import Modal from '@/components/common/Modal';
import { Row } from '@/components/settings/Row';
import type { ActiveKey } from '@/types/settings';
import { getPolicyTitle } from '@/untils/getTitle';
import { useState } from 'react';
import { TermsView } from './TermsView';
import { PrivacyPolicyView } from './PrivacyPolicyView';
import { MarketingConsentView } from './MarketingConsentView';
import { CustomerCenterView } from './CustomerCenterView';

export default function SupportPolicy() {
  const [active, setActive] = useState<ActiveKey>(null);
  const open = (key: ActiveKey) => setActive(key);
  const close = () => setActive(null);

  return (
    <div className="relative">
      {/* 카드 박스 스타일 */}
      <div className={`${active ? 'pointer-events-none blur-[2px]' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">지원 및 정책</h3>

        <div className="space-y-2">
          <Row label="이용약관" onClick={() => open('terms')} />
          <Row label="개인정보처리방침" onClick={() => open('privacy')} />
          <Row label="마케팅 정보 수신" onClick={() => open('marketing')} />
          <Row label="고객센터" onClick={() => open('support')} />
        </div>

        {/* 하단 여백 */}
        <div className="h-24" />
      </div>

      {/* 모달: active 가 있을 때만 렌더링 */}
      <Modal isOpen={!!active} onClose={close} title={getPolicyTitle(active)}>
        {active === 'terms' && <TermsView onClose={close} />}
        {active === 'privacy' && <PrivacyPolicyView onClose={close} />}
        {active === 'marketing' && <MarketingConsentView onClose={close} />}
        {active === 'support' && <CustomerCenterView />}
      </Modal>
    </div>
  );
}

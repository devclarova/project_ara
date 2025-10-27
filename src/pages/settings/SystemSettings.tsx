import Modal from '@/components/common/Modal';
import { Row } from '@/components/settings/Row';
import type { ActiveSystem } from '@/types/settings';
import { getSystemTitle } from '@/untils/getTitle';
import { useState } from 'react';
import LanguageSelect from './LanguageSelect';
import ThemeSelect from './ThemeSelect';

function SystemSettings() {
  const [active, setActive] = useState<ActiveSystem>(null);
  const open = (key: ActiveSystem) => setActive(key);
  const close = () => setActive(null);

  return (
    <div className="relative">
      {/* 카드 박스 스타일 */}
      <div className={`${active ? 'pointer-events-none blur-[2px]' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">지원 및 정책</h3>

        <div className="space-y-2">
          <Row label="언어선택" onClick={() => open('language')} />
          <Row label="테마선택" onClick={() => open('theme')} />
        </div>

        {/* 하단 여백 */}
        <div className="h-24" />
      </div>

      {/* 모달: active 가 있을 때만 렌더링 */}
      <Modal isOpen={!!active} onClose={close} title={getSystemTitle(active)}>
        {active === 'language' && <LanguageSelect onClose={close} />}
        {active === 'theme' && <ThemeSelect />}
      </Modal>
    </div>
  );
}

export default SystemSettings;

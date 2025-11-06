import Modal from '@/components/common/Modal';
import { Row } from '@/components/settings/Row';
import type { ActiveSystem } from '@/types/settings';
import { getSystemTitle } from '@/untils/getTitle';
import { useState } from 'react';
import LanguageSelect from './LanguageSelect';
import ThemeSelect from './ThemeSelect';

interface PrivacySettingsProps {
  onBackToMenu?: () => void; // ← 부모에서 전달받는 콜백 (선택)
}

function SystemSettings({ onBackToMenu }: PrivacySettingsProps) {
  const [active, setActive] = useState<ActiveSystem>(null);
  const open = (key: ActiveSystem) => setActive(key);
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
            aria-label="뒤로가기"
          >
            <i className="ri-arrow-left-line text-lg" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">지원 및 정책</h3>
        </div>

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
        {active === 'theme' && <ThemeSelect onClose={close} />}
      </Modal>
    </div>
  );
}

export default SystemSettings;

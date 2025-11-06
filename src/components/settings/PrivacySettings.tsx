import Modal from '@/components/common/Modal';
import type { ActiveSetting } from '@/types/settings';
import { getSettingsTitle } from '@/untils/getTitle';
import { useState } from 'react';
import { Row } from './Row';
import PasswordChange from './PasswordChange';
import SNSConnect from './SNSConnect';

interface PrivacySettingsProps {
  onBackToMenu?: () => void;
}

export default function PrivacySettings({ onBackToMenu }: PrivacySettingsProps) {
  const [active, setActive] = useState<ActiveSetting>(null);
  const open = (key: ActiveSetting) => setActive(key);
  const close = () => setActive(null);

  return (
    <div className="relative">
      {/* 메인 목록 */}
      <div className={`${active ? 'pointer-events-none blur-[2px]' : ''}`}>
        {/* 헤더 + 모바일 화살표 */}
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={onBackToMenu}
            className="inline-flex md:hidden items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="뒤로가기"
          >
            <i className="ri-arrow-left-line text-lg" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">개인정보 설정</h3>
        </div>

        <div className="space-y-2">
          <Row label="비밀번호 변경" onClick={() => open('password')} />
          <Row label="SNS 계정 연결" onClick={() => open('sns')} />
        </div>

        <div className="mt-8 text-right">
          <button className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            탈퇴하기
          </button>
        </div>

        {/* 하단 여백 */}
        <div className="h-24" />
      </div>

      {/* 모달: active 가 있을 때만 렌더링 */}
      <Modal isOpen={!!active} onClose={close} title={getSettingsTitle(active)}>
        {active === 'password' && (
          <PasswordChange
            onDone={close} // 저장 성공 후 닫기
            onClose={close} // 취소 버튼 또는 X 버튼 눌렀을 때 닫기
          />
        )}
        {active === 'sns' && <SNSConnect onClose={close} />}
      </Modal>
    </div>
  );
}

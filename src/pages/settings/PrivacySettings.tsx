// 개인정보 설정 페이지 - 모달 버전
// - 각 버튼을 누르면 모달이 뜨고, 모달 내 "뒤로가기"를 누르면 목록으로 복귀
// - 바깥영역 클릭으로도 닫히도록 처리

import Modal from '@/components/common/Modal';
import type { ActiveSetting } from '@/types/settings';
import { getSettingsTitle } from '@/untils/getTitle';
import { useState } from 'react';
import { Row } from '../../components/settings/Row';
import PasswordChange from './PasswordChange';
import SNSConnect from './SNSConnect';

export default function PrivacySettings() {
  const [active, setActive] = useState<ActiveSetting>(null);
  const open = (key: ActiveSetting) => setActive(key);
  const close = () => setActive(null);

  return (
    <div className="relative">
      {/* 메인 목록 */}
      <div className={`${active ? 'pointer-events-none blur-[2px]' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">개인정보 설정</h3>

        <div className="space-y-2">
          <Row label="비밀번호 변경" onClick={() => open('password')} />
          <Row label="SNS 계정 연결" onClick={() => open('sns')} />
        </div>

        <div className="mt-8 text-right">
          <button className="text-[11px] text-gray-400 hover:text-gray-600 transition">
            탈퇴하기
          </button>
        </div>
        {/* 하단 여백 */}
        <div className="h-24" />
      </div>

      {/* 모달: active 가 있을 때만 렌더링 */}
      <Modal isOpen={!!active} onClose={close} title={getSettingsTitle(active)}>
        {active === 'password' && <PasswordChange onDone={close} onClose={close} />}
        {active === 'sns' && <SNSConnect onClose={close} />}
      </Modal>
    </div>
  );
}

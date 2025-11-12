import Modal from '@/components/common/Modal';
import { Row } from '@/components/settings/Row';
import type { ActiveSystem, Lang, Mode } from '@/types/settings';
import { getSystemTitle } from '@/utils/getTitle';
import { useState } from 'react';
import LanguageSelect from './LanguageSelect';
import ThemeSelect from './ThemeSelect';

interface PrivacySettingsProps {
  onBackToMenu?: () => void; // ← 부모에서 전달받는 콜백 (선택)
}

function SystemSettings({ onBackToMenu }: PrivacySettingsProps) {
  const [active, setActive] = useState<ActiveSystem>(null);

  // ✅ 실제로 앱에 적용된 현재값(저장된 값)
  const [committedLanguage, setCommittedLanguage] = useState<Lang>('ko');
  const [committedTheme, setCommittedTheme] = useState<Mode>('system');

  // ✅ 모달에서만 사용하는 임시값(초안)
  const [draftLanguage, setDraftLanguage] = useState<Lang>(committedLanguage);
  const [draftTheme, setDraftTheme] = useState<Mode>(committedTheme);

  // 미리보기/글로벌 적용 훅
  const applyLanguage = (l: Lang) => {
    // i18n 사용 시: i18n.changeLanguage(l);
    document.documentElement.dataset.lang = l; // 미리보기용 fallback
  };

  const applyTheme = (m: Mode) => {
    (window as any).__setTheme?.(m); // 전역 테마 스위처가 있으면 사용
    document.documentElement.dataset.themeMode = m; // 미리보기용 fallback
  };

  // 모달 열기: 현재 저장된 값을 임시값으로 초기화
  const open = (key: ActiveSystem) => {
    if (key === 'language') {
      setDraftLanguage(committedLanguage);
      applyLanguage(committedLanguage); // 열자마자 원래값 기준 미리보기 정합
    }
    if (key === 'theme') {
      setDraftTheme(committedTheme);
      applyTheme(committedTheme);
    }
    setActive(key);
  };

  // 모달 닫기
  const close = () => setActive(null);

  // ✅ 저장: 임시값을 실제값으로 승격 + 전역 적용
  const handleSave = () => {
    if (active === 'language') {
      setCommittedLanguage(draftLanguage);
      applyLanguage(draftLanguage);
      // i18n.changeLanguage(draftLanguage);
    }
    if (active === 'theme') {
      setCommittedTheme(draftTheme);
      applyTheme(draftTheme);
      (window as any).__setTheme?.(draftTheme);
    }
    close();
  };

  // ✅ 취소: 임시값 버리고, 실제(저장된)값으로 화면 복구
  const handleCancel = () => {
    applyLanguage(committedLanguage);
    applyTheme(committedTheme);

    setDraftLanguage(committedLanguage);
    setDraftTheme(committedTheme);

    close();
  };

  // 모달 안에서 변경할 때: 미리보기 즉시 반영(저장은 아님)
  const handleChangeLanguage = (l: Lang) => {
    setDraftLanguage(l);
    applyLanguage(l); // 저장 전 미리보기 즉시 적용
  };

  const handleChangeTheme = (m: Mode) => {
    setDraftTheme(m);
    applyTheme(m); // 저장 전 미리보기 즉시 적용
  };

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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">시스템 설정</h3>
        </div>

        <div className="space-y-2">
          <Row label="언어선택" onClick={() => open('language')} />
          <Row label="테마선택" onClick={() => open('theme')} />
        </div>

        <div className="h-24" />
      </div>

      {/* 모달 */}
      <Modal isOpen={!!active} onClose={handleCancel} title={getSystemTitle(active)}>
        {active === 'language' && (
          <LanguageSelect
            value={draftLanguage} // 🔁 임시값 바인딩
            onChange={handleChangeLanguage}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
        {active === 'theme' && (
          <ThemeSelect
            value={draftTheme} // 🔁 임시값 바인딩
            onChange={handleChangeTheme}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Modal>
    </div>
  );
}

export default SystemSettings;

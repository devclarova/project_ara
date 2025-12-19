import Modal from '@/components/common/Modal';
import { Row } from '@/components/settings/Row';
import type { ActiveSystem, Lang, Mode } from '@/types/settings';
import { getSystemTitle } from '@/utils/getTitle';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelect from './LanguageSelect';
import ThemeSelect from './ThemeSelect';

interface PrivacySettingsProps {
  onBackToMenu?: () => void;
  searchQuery?: string;
}

function SystemSettings({ onBackToMenu, searchQuery }: PrivacySettingsProps) {
  const { t, i18n } = useTranslation();
  const [active, setActive] = useState<ActiveSystem>(null);

  // ✅ 실제로 앱에 적용된 현재값(저장된 값)
  const [committedLanguage, setCommittedLanguage] = useState<Lang>((i18n.language as Lang) || 'ko');
  const [committedTheme, setCommittedTheme] = useState<Mode>('system');

  // ✅ 모달에서만 사용하는 임시값(초안)
  const [draftLanguage, setDraftLanguage] = useState<Lang>(committedLanguage);
  const [draftTheme, setDraftTheme] = useState<Mode>(committedTheme);

  // 미리보기/글로벌 적용 훅
  const applyLanguage = (l: Lang) => {
    i18n.changeLanguage(l);
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
      i18n.changeLanguage(draftLanguage);
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
            aria-label={t('common.back')}
          >
            <i className="ri-arrow-left-line text-lg" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.system')}</h3>
        </div>

        <div className="space-y-2">
          <Row label={t('settings.language')} onClick={() => open('language')} searchQuery={searchQuery} />
          <Row label={t('settings.theme')} onClick={() => open('theme')} searchQuery={searchQuery} />
        </div>


      </div>

      {/* 모달: active 가 있을 때만 렌더링 */}
      <Modal isOpen={!!active} onClose={close} title={t(getSystemTitle(active))}>
        {active === 'language' && (
          <LanguageSelect
            value={draftLanguage}
            onChange={handleChangeLanguage}
            onClose={close}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
        {active === 'theme' && (
          <ThemeSelect
            value={draftTheme}
            onChange={handleChangeTheme}
            onClose={close}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </Modal>
    </div>
  );
}

export default SystemSettings;

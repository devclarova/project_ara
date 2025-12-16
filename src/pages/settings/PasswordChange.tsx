import Button from '@/components/common/Buttons';
import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

interface PasswordChangeProps {
  onDone?: () => void;
  onClose?: () => void;
}

function PasswordChange({ onDone, onClose }: PasswordChangeProps) {
  const { t } = useTranslation();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pw3, setPw3] = useState('');
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const passwordsMatch = pw2 === pw3;
  const canSubmit = pw.length >= 8 && pw2.length >= 8 && passwordsMatch;

  // 새 비밀번호 일치 여부 검사
  useEffect(() => {
    if (pw2 && pw3 && !passwordsMatch) {
      setErr(t('settings.pw_mismatch'));
    } else {
      setErr(null);
    }
  }, [pw2, pw3, passwordsMatch, t]);

  const submit = () => {
    if (!canSubmit) {
      setErr(t('settings.pw_check_req'));
      return;
    }
    // TODO: 실제 비밀번호 변경 API 호출
    onDone?.();
    onClose?.(); // 저장 후 모달 닫기
  };

  const inputBase =
    'mt-1 w-full rounded-xl border px-4 py-2.5 text-sm md:text-base ' +
    'outline-none transition-colors ' +
    'bg-white dark:bg-secondary ' +
    'text-gray-900 dark:text-gray-100 ' +
    'placeholder-gray-400 dark:placeholder-gray-500 ' +
    'border-gray-300 dark:border-gray-700 ' +
    'focus:border-[var(--ara-primary)] focus:ring-2 focus:ring-[var(--ara-primary)]/40';

  const labelBase = 'mb-1 block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200';

  return (
    <div className="flex flex-col h-full">
      {/* 내용 */}
      <div className="flex-1 min-h-0 px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5 bg-white dark:bg-secondary">
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-1">
          {t('settings.pw_change_guide')}
        </p>

        <div>
          <label className={labelBase}>{t('settings.current_pw')}</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder={t('settings.current_pw_placeholder')}
              className={inputBase}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] md:text-xs text-gray-500 dark:text-gray-400"
            >
              {show ? t('settings.hide') : t('settings.show')}
            </button>
          </div>
        </div>

        <div>
          <label className={labelBase}>{t('settings.new_pw')}</label>
          <div className="relative">
            <input
              type={show2 ? 'text' : 'password'}
              value={pw2}
              onChange={e => setPw2(e.target.value)}
              placeholder={t('settings.new_pw_placeholder')}
              className={inputBase}
            />
            <button
              type="button"
              onClick={() => setShow2(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] md:text-xs text-gray-500 dark:text-gray-400"
            >
              {show2 ? t('settings.hide') : t('settings.show')}
            </button>
          </div>
        </div>

        <div>
          <label className={labelBase}>{t('settings.confirm_new_pw')}</label>
          <div className="relative">
            <input
              type={show3 ? 'text' : 'password'}
              value={pw3}
              onChange={e => setPw3(e.target.value)}
              placeholder={t('settings.confirm_new_pw_placeholder')}
              className={inputBase}
            />
            <button
              type="button"
              onClick={() => setShow3(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] md:text-xs text-gray-500 dark:text-gray-400"
            >
              {show3 ? t('settings.hide') : t('settings.show')}
            </button>
          </div>
        </div>

        {err && <p className="text-xs md:text-sm text-red-500 pt-1">{err}</p>}
      </div>

      {/* 푸터 */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary px-4 md:px-6 py-3.5 md:py-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="md" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="button" variant="primary" size="md" onClick={submit} disabled={!canSubmit}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}

export default PasswordChange;

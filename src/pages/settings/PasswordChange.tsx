import Button from '@/components/common/Buttons';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PasswordChangeProps {
  onDone?: () => void;
  onClose?: () => void;
}

function PasswordChange({ onDone, onClose }: PasswordChangeProps) {
  const { t } = useTranslation();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSocialUser, setIsSocialUser] = useState(false);

  // Check if user is social login user
  useEffect(() => {
    const checkUserType = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const provider = (user?.app_metadata?.provider as string) ?? 'email';
      setIsSocialUser(provider !== 'email');
    };
    checkUserType();
  }, []);

  const passwordsMatch = newPw === confirmPw;
  const canSubmit = isSocialUser 
    ? newPw.length >= 8 && passwordsMatch 
    : currentPw.length >= 8 && newPw.length >= 8 && passwordsMatch;

  // 새 비밀번호 일치 여부 검사
  useEffect(() => {
    if (newPw && confirmPw && !passwordsMatch) {
      setErr(t('settings.pw_mismatch'));
    } else {
      setErr(null);
    }
  }, [newPw, confirmPw, passwordsMatch, t]);

  const submit = async () => {
    if (!canSubmit) {
      setErr(t('settings.pw_check_req'));
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        setErr(t('settings.email_info_missing', '이메일 정보를 찾을 수 없습니다.'));
        setLoading(false);
        return;
      }

      // 1. 이메일 사용자인 경우 현재 비밀번호 검증
      if (!isSocialUser) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPw,
        });

        if (signInError) {
          setErr(t('settings.current_pw_incorrect', '현재 비밀번호가 올바르지 않습니다.'));
          setLoading(false);
          return;
        }
      }

      // 2. 비밀번호 업데이트 (이메일 사용자: 변경, 소셜 사용자: 설정)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPw,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        setErr(t('settings.pw_change_error', '비밀번호 변경 중 오류가 발생했습니다.'));
        setLoading(false);
        return;
      }

      // 3. 성공
      const successMessage = isSocialUser 
        ? t('settings.pw_set_success', '비밀번호가 성공적으로 설정되었습니다.')
        : t('settings.pw_change_success', '비밀번호가 성공적으로 변경되었습니다.');
      
      toast.success(successMessage);
      onDone?.();
      onClose?.();
    } catch (error) {
      console.error('Unexpected error:', error);
      setErr(t('settings.pw_change_error', '비밀번호 변경 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    'mt-1 w-full rounded-xl border px-4 py-2.5 text-sm md:text-base ' +
    'outline-none transition-colors ' +
    'bg-white dark:bg-secondary ' +
    'text-gray-900 dark:text-gray-100 ' +
    'placeholder-gray-400 dark:placeholder-gray-500 ' +
    'border-gray-300 dark:border-gray-700 ' +
    'ara-focus';

  const labelBase = 'mb-1 block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200';

  return (
    <div className="flex flex-col h-full">
      {/* 내용 */}
      <div className="flex-1 min-h-0 px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5 bg-white dark:bg-secondary">
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-1">
          {isSocialUser 
            ? t('settings.pw_set_guide', '소셜 로그인 계정에 비밀번호를 설정하여 이메일로도 로그인할 수 있습니다.')
            : t('settings.pw_change_guide')}
        </p>

        {/* 이메일 사용자만 현재 비밀번호 입력 */}
        {!isSocialUser && (
          <div>
            <label className={labelBase}>{t('settings.current_pw')}</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder={t('settings.current_pw_placeholder')}
                className={inputBase}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:opacity-80 transition-opacity"
                aria-label={show ? t('settings.hide') : t('settings.show')}
              >
                <i className={show ? 'ri-eye-off-line text-lg' : 'ri-eye-line text-lg'} />
              </button>
            </div>
          </div>
        )}

        <div>
          <label className={labelBase}>{t('settings.new_pw')}</label>
          <div className="relative">
            <input
              type={show2 ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder={t('settings.new_pw_placeholder')}
              className={inputBase}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShow2(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:opacity-80 transition-opacity"
              aria-label={show2 ? t('settings.hide') : t('settings.show')}
            >
              <i className={show2 ? 'ri-eye-off-line text-lg' : 'ri-eye-line text-lg'} />
            </button>
          </div>
        </div>

        <div>
          <label className={labelBase}>{t('settings.confirm_new_pw')}</label>
          <div className="relative">
            <input
              type={show3 ? 'text' : 'password'}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder={t('settings.confirm_new_pw_placeholder')}
              className={inputBase}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShow3(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:opacity-80 transition-opacity"
              aria-label={show3 ? t('settings.hide') : t('settings.show')}
            >
              <i className={show3 ? 'ri-eye-off-line text-lg' : 'ri-eye-line text-lg'} />
            </button>
          </div>
        </div>

        {err && <p className="text-xs md:text-sm text-red-500 pt-1">{err}</p>}
      </div>

      {/* 푸터 */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary px-4 md:px-6 py-3.5 md:py-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button type="button" variant="primary" size="md" onClick={submit} disabled={!canSubmit || loading}>
          {loading ? t('common.saving', '저장 중...') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}

export default PasswordChange;

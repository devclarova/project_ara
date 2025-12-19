import Modal from '@/components/common/Modal';
import InputField from '@/components/auth/InputField';
import type { ActiveSetting } from '@/types/settings';
import { getSettingsTitle } from '@/utils/getTitle';
import { useState } from 'react';
import { Row } from '../../components/settings/Row';
import PasswordChange from './PasswordChange';
import SNSConnect from './SNSConnect';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface PrivacySettingsProps {
  onBackToMenu?: () => void;
  searchQuery?: string;
}

import Select, { components, type SingleValue, type StylesConfig } from 'react-select';
import { ChevronDown, ChevronUp } from 'lucide-react';

// --- React Select Custom Components & Styles ---
const CustomDropdownIndicator = (props: any) => {
  const { selectProps } = props;
  const isOpen = selectProps.menuIsOpen;
  return (
    <components.DropdownIndicator {...props}>
      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </components.DropdownIndicator>
  );
};

import { useTranslation } from 'react-i18next';

// const CONFIRM_PHRASE = '탈퇴하겠습니다.'; // Moved inside component

export default function PrivacySettings({ onBackToMenu, searchQuery }: PrivacySettingsProps) {
  const { t } = useTranslation();
  const CONFIRM_PHRASE = t('settings.withdraw_phrase');

  const [active, setActive] = useState<ActiveSetting>(null);
  const open = (key: ActiveSetting) => setActive(key);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  // Floating Label State for Select
  const [isReasonFocused, setIsReasonFocused] = useState(false);

  // Options for Withdrawal Reason
  const reasonOptions = [
    { value: 'low_usage', label: t('settings.reason_low_usage') },
    { value: 'rejoin', label: t('settings.reason_rejoin') },
    { value: 'privacy', label: t('settings.reason_privacy') },
    { value: 'feature', label: t('settings.reason_feature') },
    { value: 'other', label: t('settings.reason_other') },
  ];

  const selectedReasonOption = reasonOptions.find(o => o.value === reason) || null;

  // Dark Mode Check & React Select Styles
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const customSelectStyles: StylesConfig<any, false> = {
    control: (provided, state) => {
        // Match InputField border logic: always gray-300 (#D1D5DB) unless focused/error
        const baseBorder = state.isFocused
          ? 'var(--ara-primary)'
          : isDark
            ? '#D1D5DB' // Force light gray border in dark mode to match InputField
            : '#D1D5DB';

        return {
        ...provided,
        minHeight: 48,
        height: 48,
        paddingLeft: 6, 
        borderRadius: 14,
        border: `1px solid ${baseBorder}`,
        borderColor: baseBorder,
        boxShadow: state.isFocused ? '0 0 0 3px var(--ara-ring)' : 'none',
        backgroundColor: isDark ? 'hsl(var(--secondary))' : '#FFFFFF',
        color: isDark ? 'hsl(var(--secondary-foreground))' : '#111827',
        outline: 'none',
        '&:hover': {
            borderColor: state.isFocused ? 'var(--ara-primary)' : '#D1D5DB'
        }
      };
    },
    valueContainer: provided => ({
      ...provided,
      height: 48,
      padding: '0 8px',
      display: 'flex',
      alignItems: 'center',
    }),
    input: provided => ({
      ...provided,
      margin: 0,
      padding: 0,
      color: isDark ? '#9CA3AF' : '#111827',
    }),
    singleValue: provided => ({
      ...provided,
      color: isDark ? '#F3F4F6' : '#111827',
    }),
    menu: provided => ({
      ...provided,
      backgroundColor: isDark ? 'hsl(var(--secondary))' : '#FFFFFF',
      border: `1px solid ${isDark ? '#D1D5DB' : '#E5E7EB'}`,
      borderRadius: 12,
      overflow: 'hidden',
      zIndex: 50,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? isDark
          ? 'hsl(var(--primary) / 0.22)'
          : 'rgba(59,130,246,0.12)'
        : state.isFocused
          ? isDark
            ? 'hsl(var(--primary) / 0.12)'
            : 'rgba(59,130,246,0.08)'
          : 'transparent',
      color: isDark ? 'hsl(var(--secondary-foreground))' : '#111827',
      cursor: 'pointer',
    }),
    dropdownIndicator: provided => ({
        ...provided,
        color: isDark ? '#9CA3AF' : '#9CA3AF',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
  };

  const close = () => {
    setActive(null);
    setWithdrawError(null);
    setPassword('');
    setConfirmText('');
    setReason('');
    setDetail('');
    setIsReasonFocused(false);
  };

  const handleWithdraw = async () => {
    if (!user) return;

    // 1) 확인 문구 검사
    if (confirmText.trim() !== CONFIRM_PHRASE) {
      setWithdrawError(t('settings.withdraw_verify_placeholder', { phrase: CONFIRM_PHRASE }));
      return;
    }

    setWithdrawing(true);
    setWithdrawError(null);

    const provider = (user.app_metadata?.provider as string | undefined) ?? 'email';

    // 2) 자격 증명 재확인
    if (provider === 'email') {
      const email = user.email;
      if (!email) {
        setWithdrawError(t('settings.email_info_missing', '이메일 정보를 찾을 수 없습니다. 고객센터로 문의해주세요.'));
        setWithdrawing(false);
        return;
      }
      const { error: pwError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (pwError) {
        console.error('withdraw reauth error:', pwError);
        setWithdrawError(t('settings.password_incorrect', '비밀번호가 올바르지 않습니다.'));
        setWithdrawing(false);
        return;
      }
    } else {
      // 소셜 로그인: 입력한 이메일이 본인 이메일과 일치하는지 확인
      if (password !== user.email) {
        setWithdrawError(t('settings.email_mismatch_error', '입력하신 이메일 주소가 올바르지 않습니다.'));
        setWithdrawing(false);
        return;
      }
    }

    // 3) 탈퇴 사유 저장 (관리자 전용) - New Feature
    try {
      if (reason) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) {
            await supabase.from('withdrawal_feedbacks' as any).insert({
              user_id: profile.id,
              reason,
              detail: reason === 'other' ? detail : null,
            });
        }
      }
    } catch (err) {
      console.error('Feedback save failed:', err);
      // Fail silently to proceed with withdrawal
    }

    // 4) Soft Delete 처리 (profiles.deleted_at 기록)
    // 실제 데이터 삭제는 하지 않음 (7일 유예)
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (profileErr) {
      console.error('withdraw profile error:', profileErr);
      setWithdrawError(t('settings.withdraw_error', '탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
      setWithdrawing(false);
      return;
    }

    // 5) 로그아웃 + 메인 페이지 이동
    await signOut();
    navigate('/', { replace: true });
  };

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
            aria-label={t('common.back')}
          >
            <i className="ri-arrow-left-line text-lg" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.privacy')}</h3>
        </div>

        <div className="space-y-2">
          <Row label={t('settings.change_password')} onClick={() => open('password')} searchQuery={searchQuery} />
          <Row label={t('settings.connect_sns')} onClick={() => open('sns')} searchQuery={searchQuery} />
        </div>

        {/* 하단 탈퇴 버튼 */}
        <div className="mt-8 text-right">
          <button
            type="button"
            onClick={() => open('withdraw')}
            className="text-[11px] text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
          >
            {t('settings.withdraw')}
          </button>
        </div>

        {/* 하단 여백 */}

      </div>

      {/* 모달: active 가 있을 때만 렌더링 */}
      <Modal isOpen={!!active} onClose={close} title={t(getSettingsTitle(active))}>
        {active === 'password' && <PasswordChange onDone={close} onClose={close} />}

        {active === 'sns' && <SNSConnect onClose={close} />}

        {/* 탈퇴 모달 */}
        {active === 'withdraw' && (
          <div className="space-y-5">
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              <p className="font-semibold mb-1">{t('settings.withdraw_modal_title')}</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>{t('settings.withdraw_grace_period_1', '탈퇴 신청 시 7일간 유예 기간이 적용됩니다.')}</li>
                <li>{t('settings.withdraw_grace_period_2', '7일 이내 로그인 시 계정을 즉시 복구할 수 있습니다.')}</li>
                <li>{t('settings.withdraw_grace_period_3', '7일이 지나면 계정 복구가 불가능하며, 30일 후 데이터가 완전히 삭제됩니다.')}</li>
                <li>{t('settings.withdraw_warning_4')}</li>
              </ul>
            </div>

            {/* 탈퇴 사유 (New) - React Select & Styled Textarea */}
            <div className="space-y-4 pt-2">
                 <div className="relative">
                   <Select
                       value={selectedReasonOption}
                       onChange={(opt) => {
                           setReason(opt?.value || '');
                           setIsReasonFocused(false);
                       }}
                       onFocus={() => setIsReasonFocused(true)}
                       onBlur={() => setIsReasonFocused(false)}
                       onMenuOpen={() => setIsReasonFocused(true)}
                       onMenuClose={() => {
                           setIsReasonFocused(false);
                           // Ensure blur logic if needed, but react-select handles focus well
                       }}
                       options={reasonOptions}
                       styles={customSelectStyles}
                       components={{ DropdownIndicator: CustomDropdownIndicator }}
                       placeholder=" "
                       classNamePrefix="react-select"
                       className="w-full"
                   />
                   <label
                       className={`
                           pointer-events-none absolute left-3 px-1 rounded transition-all duration-150 
                           bg-white dark:bg-secondary
                           ${
                             isReasonFocused || reason
                               ? '-top-2 text-xs text-primary'
                               : 'top-3 text-sm text-gray-400'
                           }
                       `}
                   >
                     {t('settings.withdraw_reason_label')}
                   </label>
                 </div>

                 {reason === 'other' && (
                     <div className="relative">
                         <textarea
                             id="withdraw-detail"
                             className="peer w-full p-4 border border-gray-300 rounded-[14px] bg-white dark:bg-secondary text-gray-900 dark:text-gray-100 text-sm ara-focus h-24 resize-none placeholder-transparent transition-all duration-120"
                             placeholder=" "
                             value={detail}
                             onChange={(e) => setDetail(e.target.value)}
                         />
                         <label 
                            htmlFor="withdraw-detail"
                            className={`
                               pointer-events-none absolute left-3 px-1 rounded transition-all duration-150 bg-white dark:bg-secondary text-gray-400
                               peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary
                               ${detail ? '-top-2 text-xs text-primary' : 'top-4 text-sm'}
                            `}
                         >
                            {t('settings.withdraw_detail_placeholder')}
                         </label>
                     </div>
                 )}
            </div>

            {/* 비밀번호 확인 (이메일 가입자만) */}
            {((user?.app_metadata?.provider as string) ?? 'email') === 'email' ? (
              <div className="space-y-1">
                <InputField
                  id="confirm-password"
                  type="password"
                  label={t('settings.confirm_password')}
                  value={password}
                  onChange={setPassword}
                  inputProps={{
                    placeholder: ' ', // 플레이스홀더 비움 (라벨 겹침 방지 + Floating 유도)
                  }}
                />
                {/* 설명 문구를 인풋 아래로 배치 */}
                <p className="text-sm text-gray-400 dark:text-gray-500 pl-1 mt-1">
                  {t('settings.confirm_password_desc')}
                </p>
              </div>
            ) : (
              // 소셜 로그인 사용자: 이메일 입력 확인
              <div className="space-y-1">
                <InputField
                  id="confirm-email"
                  type="text"
                  label={t('settings.confirm_email', '이메일 주소 확인')}
                  value={password} // 재사용 (여기서는 이메일 입력값으로 사용)
                  onChange={setPassword}
                  inputProps={{
                    placeholder: ' ',
                  }}
                />
                <p className="text-sm text-gray-400 dark:text-gray-500 pl-1 mt-1">
                  {t('settings.confirm_email_desc', '본인 확인을 위해 이메일 주소를 정확히 입력해주세요.')}
                </p>
              </div>
            )}

            {/* 확인 문구 */}
            <div className="space-y-1">
              <InputField
                id="withdraw-verify"
                label={t('settings.withdraw_verify_label')}
                value={confirmText}
                onChange={setConfirmText}
                inputProps={{
                  placeholder: ' ',
                }}
              />
              <p className="text-sm text-gray-400 dark:text-gray-500 pl-1 mt-1">
                {t('settings.withdraw_verify_placeholder', { phrase: CONFIRM_PHRASE })}
              </p>
            </div>

            {withdrawError && <p className="text-xs text-red-500">{withdrawError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={close}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={withdrawing}
              >
                {t('settings.withdraw_btn_cancel')}
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="px-3 py-1.5 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {withdrawing ? t('settings.withdraw_btn_processing') : t('settings.withdraw_btn_confirm')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import BirthInput from './BirthInput';
import CountrySelect from './CountrySelect';
import GenderSelect from './GenderSelect';
import InputField from './InputField';
import { useTranslation } from 'react-i18next';
import { useNicknameValidator } from '@/hooks/useNicknameValidator';
import NicknameInputField from '@/components/common/NicknameInputField';
import { RECOVERY_QUESTIONS, type RecoveryQuestion } from '@/types/signup';
import SelectField from './SelectField';

const EMAIL_ASCII_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const NON_ASCII_RE = /[^\x00-\x7F]/;

function toYMDLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function validateEmailField(raw: string, t: (key: string) => string): string {
  const s = raw ?? '';
  if (!s.trim()) return t('validation.required_email');
  if (/\s/.test(s)) return t('validation.no_spaces');
  if (NON_ASCII_RE.test(s)) return t('validation.invalid_email');
  if (!EMAIL_ASCII_RE.test(s)) return t('validation.invalid_email');
  if (s.length > 254) return t('validation.invalid_email');
  const [local, domain] = s.split('@');
  if (!local || !domain) return t('validation.invalid_email');
  if (local.length > 64) return t('validation.invalid_email');
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..'))
    return t('validation.invalid_email');
  const labels = domain.split('.');
  if (labels.length < 2) return t('validation.invalid_email');
  for (const lab of labels) {
    if (!/^[A-Za-z0-9-]{1,63}$/.test(lab)) return t('validation.invalid_email');
    if (lab.startsWith('-') || lab.endsWith('-')) return t('validation.invalid_email');
  }
  const tld = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,63}$/.test(tld)) return t('validation.invalid_email');
  return '';
}

const PW_LETTER_RE = /[A-Za-z]/;
const PW_NUMBER_RE = /[0-9]/;
const PW_SPECIAL_RE = /[!@#$%^&*]/;

function validatePasswordField(pw: string, t: (key: string) => string): string {
  const v = pw ?? '';
  if (!v) return t('validation.required_password');
  if (/\s/.test(v)) return t('validation.no_spaces');
  if (v.length < 8) return t('validation.password_min_length');
  if (!PW_LETTER_RE.test(v) || !PW_NUMBER_RE.test(v) || !PW_SPECIAL_RE.test(v)) {
    return t('validation.password_requirements');
  }
  return '';
}

// === 만 14세 이상 여부 판단 ===
function isAge14Plus(dateLike?: Date | string | null) {
  if (!dateLike) return false;
  const birth = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const notHadBirthday = today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (notHadBirthday) age -= 1;
  return age >= 14;
}

type Props = {
  onNext: (data: FormData) => void;
  onBack: () => void;
  value?: FormData;
  onChange?: (data: FormData) => void;
  verified: { email: { value: string; ok: boolean }; nickname: { value: string; ok: boolean } };
  submitAttempted: boolean;
  onInvalidateByChange: (email: string, nickname: string) => void;
  onDupChecked: (which: 'email' | 'nickname', value: string, ok: boolean) => void;
  signupKind: 'email' | 'social';
};

export type FormData = {
  email: string;
  pw: string;
  confirmPw: string;
  nickname: string;
  gender: string;
  birth: Date | null;
  birthYmd?: string | null;
  country: string;
  // Recovery 정보 (필수)
  recoveryQuestion: RecoveryQuestion | '';
  recoveryAnswer: string;
  recoveryEmail: string; // 임시 이메일 (입력은 선택이지만 빈 문자열로라도 저장)
};

export default function SignUpStep2Form({
  onNext,
  onBack,
  value,
  onChange,
  verified,
  submitAttempted,
  onInvalidateByChange,
  onDupChecked,
  signupKind,
}: Props) {
  const { t } = useTranslation();
  
  // Use new hook
  const nickValidator = useNicknameValidator();
  
  const [email, setEmail] = useState(value?.email ?? '');
  const [pw, setPw] = useState(value?.pw ?? '');
  const [confirmPw, setConfirmPw] = useState(value?.confirmPw ?? '');
  const [nickname, setNickname] = useState(value?.nickname ?? '');
  const [gender, setGender] = useState(value?.gender ?? '');
  const [birth, setBirth] = useState<Date | null>(value?.birth ?? null);
  const [birthYmd, setBirthYmd] = useState<string | null>(
    value?.birth ? toYMDLocal(value.birth) : (value?.birthYmd ?? null),
  );
  const [country, setCountry] = useState(value?.country ?? '');
  const [recoveryQuestion, setRecoveryQuestion] = useState<RecoveryQuestion | ''>(value?.recoveryQuestion ?? '');
  const [recoveryAnswer, setRecoveryAnswer] = useState(value?.recoveryAnswer ?? '');
  const [recoveryEmail, setRecoveryEmail] = useState(value?.recoveryEmail ?? '');

  useEffect(() => {
    if (!value) return;
    setEmail(value.email ?? '');
    setPw(value.pw ?? '');
    setConfirmPw(value.confirmPw ?? '');
    setNickname(value.nickname ?? '');
    setGender(value.gender ?? '');
    setBirth(value.birth ?? null);
    setBirthYmd(value.birth ? toYMDLocal(value.birth) : (value.birthYmd ?? null));
    setCountry(value.country ?? '');
    setRecoveryQuestion(value.recoveryQuestion ?? '');
    setRecoveryAnswer(value.recoveryAnswer ?? '');
    setRecoveryEmail(value.recoveryEmail ?? '');
    
    // Initialize validator state for existing nickname
    if (value.nickname) {
       nickValidator.validateInput(value.nickname);
    }
  }, [value]);

  // 부모로 변경 통지
  const emit = (next: FormData) => onChange?.(next);

  // 소셜 모드: 이메일/비번 자동 세팅 & 비활성화
  useEffect(() => {
    if (signupKind !== 'social') return;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const socialEmail = data.session?.user?.email ?? '';

      setEmail(socialEmail);
      setPw('__SOCIAL__');
      setConfirmPw('__SOCIAL__');

      setErrors(prev => ({ ...prev, email: undefined, pw: undefined, confirmPw: undefined }));
      setEmailCheckResult('available');
      onDupChecked('email', socialEmail, true);

      emit({
        email: socialEmail,
        pw: '__SOCIAL__',
        confirmPw: '__SOCIAL__',
        nickname,
        gender,
        birth,
        birthYmd,
        country,
        recoveryQuestion,
        recoveryAnswer,
        recoveryEmail,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signupKind]);

  // 값 변경시 중복검사 캐시 무효화 판단
  useEffect(() => {
    onInvalidateByChange(email, nickname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, nickname]);

  // 외부 캐시 → 로컬 표시 동기화
  useEffect(() => {
    if (verified.email.ok && verified.email.value === email) {
      setEmailCheckResult('available');
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    // 닉네임: 외부 캐시가 OK면 훅의 상태도 OK로 동기화(가능한 선에서)
    if (verified.nickname.ok && verified.nickname.value === nickname) {
       // useNicknameValidator는 내부 상태가 있으므로 직접 제어는 어렵지만 에러만 제거
       nickValidator.setError(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified.email.value, verified.email.ok, verified.nickname.value, verified.nickname.ok]);

  // 제출 시도 → 전체 검증
  useEffect(() => {
    if (submitAttempted) validate(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitAttempted]);

  const snapshot: FormData = useMemo(
    () => ({ email, pw, confirmPw, nickname, gender, birth, birthYmd, country, recoveryQuestion, recoveryAnswer, recoveryEmail }),
    [email, pw, confirmPw, nickname, gender, birth, birthYmd, country, recoveryQuestion, recoveryAnswer, recoveryEmail],
  );

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<'available' | 'taken' | ''>('');
  const [recoveryEmailChecking, setRecoveryEmailChecking] = useState(false);
  const [recoveryEmailCheckResult, setRecoveryEmailCheckResult] = useState<'available' | 'taken' | '' | 'same_as_primary'>('');
  
  // Nickname checking and result are managed by hook basically, but we need to integrate with form submission flow logic

  const validate = (withDupHints = false): boolean => {
    const newErr: Partial<Record<keyof FormData, string>> = {};

    // 이메일/비번 검증은 이메일 가입에서만
    if (signupKind !== 'social') {
      const emailMsg = validateEmailField(email, t);
      if (emailMsg) newErr.email = emailMsg;

      const pwMsg = validatePasswordField(pw, t);
      if (pwMsg) newErr.pw = pwMsg;

      const confirmMsg =
        (confirmPw ?? '')
          ? confirmPw === pw
            ? ''
            : t('validation.password_mismatch')
          : t('validation.password_confirm_required');
      if (confirmMsg) newErr.confirmPw = confirmMsg;
    }

    // 공통 검증 (닉네임)
    const { error: nickMsg } = nickValidator.getFormatError(nickname);
    if (nickMsg) newErr.nickname = nickMsg;
    
    if (!gender) newErr.gender = t('validation.gender_select');
    if (!birth) newErr.birth = t('validation.required_birthday');
    // [추가] 생일이 들어왔다면, 오늘 기준 만 14세 이상인지 체크
    if (birth && !isAge14Plus(birth)) {
      newErr.birth = t('validation.age_restriction');
    }
    if (!country) newErr.country = t('validation.country_select');

    // Recovery 정보 검증
    if (!recoveryQuestion) newErr.recoveryQuestion = t('validation.recovery_question_required');
    if (!recoveryAnswer.trim()) {
      newErr.recoveryAnswer = t('validation.recovery_answer_required');
    } else if (recoveryAnswer.trim().length < 2) {
      newErr.recoveryAnswer = t('validation.recovery_answer_too_short');
    }
    // Recovery Email 검증 (필출)
    if (!recoveryEmail.trim()) {
      newErr.recoveryEmail = t('validation.recovery_email_invalid'); // 또는 새로운 required 키
    } else {
      const tempEmailMsg = validateEmailField(recoveryEmail, t);
      if (tempEmailMsg) newErr.recoveryEmail = t('validation.recovery_email_invalid');
      if (!tempEmailMsg && recoveryEmail === email) {
        newErr.recoveryEmail = t('validation.recovery_email_same_as_primary');
      }
    }

    if (withDupHints) {
      // 이메일 중복 힌트는 이메일 가입에서만
      if (signupKind !== 'social') {
        const emailVerifiedOk = verified.email.ok && verified.email.value === email;
        if (!newErr.email && !emailVerifiedOk && emailCheckResult !== 'available') {
          newErr.email =
            emailCheckResult === 'taken'
              ? t('validation.email_taken')
              : t('validation.email_check_required');
        }
      }
      // 닉네임 중복 힌트
      // verified.nickname.ok 가 true면 이미 검증된 것으로 간주
      const nickVerifiedOk = verified.nickname.ok && verified.nickname.value === nickname;
      
      // 훅의 checkResult가 available이면 통과
      const hookAvailable = nickValidator.checkResult === 'available' && nickValidator.lastCheckedNick === nickname;

      if (!newErr.nickname && !nickVerifiedOk && !hookAvailable) {
        newErr.nickname =
          nickValidator.checkResult === 'taken'
            ? t('validation.nickname_taken')
            : t('validation.nickname_check_required');
      }
    }

    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  // 이메일 중복 상태
  const emailDupStatus = async (): Promise<'available' | 'taken' | 'error'> => {
    if (signupKind === 'social') return 'available';
    const msg = validateEmailField(email, t);
    if (msg) {
      setErrors(prev => ({ ...prev, email: msg }));
      return 'error';
    }
    try {
      const { data, error } = await supabase.rpc('email_exists', { _email: email.trim() });
      if (error) return 'error';
      return data === true ? 'taken' : 'available';
    } catch {
      return 'error';
    }
  };

  // 이메일 체크 버튼
  const handleEmailCheck = async () => {
    const res = await emailDupStatus();
    if (res === 'taken') {
      setEmailCheckResult('taken');
      setErrors(prev => ({ ...prev, email: t('signup.error_email_taken') }));
    } else if (res === 'available') {
      setEmailCheckResult('available');
      setErrors(prev => ({ ...prev, email: undefined }));
      onDupChecked('email', email, true);
    } else {
      setEmailCheckResult('');
    }
  };

  // 닉네임 체크 버튼
  const handleNickCheck = async () => {
    const isAvailable = await nickValidator.checkAvailability(nickname);
    if (isAvailable) {
      onDupChecked('nickname', nickname, true);
    }
  };

  const checkRecoveryEmailStrict = async (): Promise<'available' | 'taken' | 'error' | 'same_as_primary'> => {
    // Basic format check
    const tempEmailMsg = validateEmailField(recoveryEmail, t);
    if (tempEmailMsg) {
       setErrors(prev => ({ ...prev, recoveryEmail: tempEmailMsg }));
       return 'error';
    }
    if (recoveryEmail === email) {
       setErrors(prev => ({ ...prev, recoveryEmail: t('validation.recovery_email_same_as_primary') }));
       return 'same_as_primary';
    }
    try {
      setRecoveryEmailChecking(true);
      const { data, error } = await supabase.rpc('check_email_exists_strict', { _email: recoveryEmail.trim() });
      setRecoveryEmailChecking(false);
      
      if (error) return 'error';
      return data === true ? 'taken' : 'available';
    } catch {
      setRecoveryEmailChecking(false);
      return 'error';
    }
  };

  const handleRecoveryEmailCheck = async () => {
    const res = await checkRecoveryEmailStrict();
    if (res === 'taken') {
       setRecoveryEmailCheckResult('taken');
       setErrors(prev => ({ ...prev, recoveryEmail: t('signup.error_email_taken') }));
    } else if (res === 'available') {
       setRecoveryEmailCheckResult('available');
       setErrors(prev => ({ ...prev, recoveryEmail: undefined }));
    } else {
       setRecoveryEmailCheckResult('');
    }
  };
  
  // Hook에서 에러 발생 시 Form 에러 업데이트
  useEffect(() => {
    if (nickValidator.error) {
       setErrors(prev => ({ ...prev, nickname: nickValidator.error }));
    } else {
       setErrors(prev => ({ ...prev, nickname: undefined }));
    }
  }, [nickValidator.error]);


  const handleNext = async () => {
    if (!validate(true)) return;

    const cachedEmailOK =
      signupKind === 'social' ? true : verified.email.ok && verified.email.value === email;
    const cachedNickOK = verified.nickname.ok && verified.nickname.value === nickname;
    const hookNickOK = nickValidator.checkResult === 'available' && nickValidator.lastCheckedNick === nickname;

    if (cachedEmailOK && (cachedNickOK || hookNickOK)) {
      onNext(snapshot);
      return;
    }

    setEmailChecking(signupKind !== 'social');
    // nickChecking is handled by hook
    
    try {
      const emailPromise = signupKind === 'social' ? Promise.resolve<'available'>('available') : emailDupStatus();
      // If nickname not verified yet, check it
      const nickPromise = (cachedNickOK || hookNickOK) ? Promise.resolve(true) : nickValidator.checkAvailability(nickname);
      
      const [eRes, nRes] = await Promise.all([emailPromise, nickPromise]);

      setEmailCheckResult(eRes === 'available' ? 'available' : eRes === 'taken' ? 'taken' : '');
      // nRes is boolean (true if available)

      // Recovery Email Dup Check (Strict: Check against both Primary and Recovery)
      let rEmailRes = recoveryEmailCheckResult;
      
      if (!rEmailRes && recoveryEmail.trim()) {
         const directRes = await checkRecoveryEmailStrict();
         if (directRes === 'taken') rEmailRes = 'taken';
         else if (directRes === 'same_as_primary') rEmailRes = 'same_as_primary';
         else if (directRes === 'available') rEmailRes = 'available';
      }

      if (eRes === 'taken') {
        setErrors(prev => ({ ...prev, email: t('signup.error_email_taken') }));
        return;
      }
      if (eRes === 'error') {
        setErrors(prev => ({ ...prev, email: t('signup.error_email_check_retry') }));
        return;
      }
      // NEW: Block if recovery email starts with existing primary email
      if (rEmailRes === 'taken') {
        setErrors(prev => ({ ...prev, recoveryEmail: t('validation.email_taken') }));
        return;
      }
      if (rEmailRes === 'same_as_primary') {
         // Error is already set by checkRecoveryEmailStrict
         return;
      }
      
      if (!nRes) {
        // Error is already set by hook
        return;
      }

      if (signupKind !== 'social') onDupChecked('email', email, true);
      onDupChecked('nickname', nickname, true);
      onNext(snapshot);
    } finally {
      setEmailChecking(false);
    }
  };

  return (
    <section className="bg-white p-4 xs:p-5 sm:p-6 md:p-8 shadow dark:bg-secondary rounded-2xl">
      <h2 
        className="text-xl xs:text-[19px] sm:text-2xl font-bold text-gray-800 mb-5 xs:mb-3 dark:text-gray-100"
        style={{ overflowWrap: 'break-word' }}
      >
        {t('signup.step2_title')}
      </h2>

      <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
        <InputField
          id="email"
          label={t('signup.label_email')}
          value={email}
          onChange={v => {
            if (signupKind === 'social') return; // 소셜은 고정
            setEmail(v);
            setErrors(prev => ({ ...prev, email: undefined }));
            setEmailCheckResult('');
            emit({ ...snapshot, email: v });
          }}
          error={errors.email}
          isChecking={emailChecking}
          checkResult={signupKind === 'social' ? '' : emailCheckResult}
          onCheck={signupKind === 'social' ? undefined : handleEmailCheck}
          className={signupKind === 'social' ? 'opacity-70 cursor-not-allowed' : ''}
          inputProps={
            signupKind === 'social'
              ? {
                  readOnly: true,
                  tabIndex: -1,
                  onFocus: e => e.currentTarget.blur(),
                  onMouseDown: e => e.preventDefault(),
                  onKeyDown: e => e.preventDefault(),
                  style: {
                    backgroundColor: 'rgb(243 244 246)',
                    color: 'rgb(107 114 128)',
                    outline: 'none',
                    cursor: 'default',
                  },
                }
              : { placeholder: ' ' }
          }
        />

        <InputField
          id="pw"
          label={t('signup.label_password')}
          type="password"
          value={pw}
          onChange={v => {
            if (signupKind === 'social') return;
            setPw(v);
            setErrors(prev => ({ ...prev, pw: undefined, confirmPw: undefined }));
            emit({ ...snapshot, pw: v });
          }}
          error={errors.pw}
          inputProps={
            signupKind === 'social'
              ? {
                  readOnly: true,
                  tabIndex: -1,
                  onFocus: e => e.currentTarget.blur(),
                  onMouseDown: e => e.preventDefault(),
                  onKeyDown: e => e.preventDefault(),
                  style: {
                    backgroundColor: 'rgb(243 244 246)',
                    color: 'rgb(107 114 128)',
                    outline: 'none',
                    cursor: 'default',
                  },
                }
              : { placeholder: ' ' }
          }
        />

        <InputField
          id="confirmPw"
          label={t('signup.label_password_confirm')}
          type="password"
          value={confirmPw}
          onChange={v => {
            if (signupKind === 'social') return;
            setConfirmPw(v);
            setErrors(prev => ({ ...prev, confirmPw: undefined }));
            emit({ ...snapshot, confirmPw: v });
          }}
          error={errors.confirmPw}
          inputProps={
            signupKind === 'social'
              ? {
                  readOnly: true,
                  tabIndex: -1,
                  onFocus: e => e.currentTarget.blur(),
                  onMouseDown: e => e.preventDefault(),
                  onKeyDown: e => e.preventDefault(),
                  style: {
                    backgroundColor: 'rgb(243 244 246)',
                    color: 'rgb(107 114 128)',
                    outline: 'none',
                    cursor: 'default',
                  },
                }
              : { placeholder: ' ' }
          }
        />

        <NicknameInputField
          value={nickname}
          onChange={v => {
            setNickname(v);
            // Real-time detection & State update
            nickValidator.validateInput(v);
            
            emit({ ...snapshot, nickname: v });
          }}
          error={errors.nickname} // We still control error display via form errors
          checkResult={nickValidator.checkResult}
          isChecking={nickValidator.checking}
          onCheck={handleNickCheck}
          detectedLang={nickValidator.detectedLang} 
          minLen={nickValidator.detectedLang ? nickValidator.minLen(nickValidator.detectedLang) : 0}
          maxLen={nickValidator.detectedLang ? nickValidator.maxLen(nickValidator.detectedLang) : 0}
        />
        
        {/*
           Original code had an inline <p> for hint. 
           NicknameInputField has it built-in.
           So I don't need to put it here.
           BUT, `nickValidator.detectedLang` is only updated when `checkAvailability` runs in my current hook design?
           Let me check hook code again.
           Yes, `setDetectedLang(lang)` is inside `checkAvailability`.
           This is a regression from original code which updated it on input change.
           
           I MUST fix the hook to update lang on change or expose a method to do so.
           I will update the `onChange` logic in the ReplacementContent to manually call a setter if I exposed it? No.
           I will modify `useNicknameValidator` to allow updating lang without full check.
           OR I can just pass `detectLang(nickname)` result to the component props directly, bypassing the hook state for display purposes.
           That seems safer and easier.
        */}

        <GenderSelect
          value={gender}
          onChange={v => {
            setGender(v);
            setErrors(prev => ({ ...prev, gender: undefined }));
            emit({ ...snapshot, gender: v });
          }}
          error={!!errors.gender}
        />

        <BirthInput
          value={birth}
          onChange={v => {
            setBirth(v);
            const ymd = v ? toYMDLocal(v) : null;
            setBirthYmd(ymd);
            setErrors(prev => ({ ...prev, birth: undefined }));
            emit({ ...snapshot, birth: v, birthYmd: ymd });
          }}
          error={!!errors.birth}
          errorMessage={errors.birth}
        />

        <CountrySelect
          value={country}
          onChange={v => {
            setCountry(v);
            setErrors(prev => ({ ...prev, country: undefined }));
            emit({ ...snapshot, country: v });
          }}
          error={!!errors.country}
        />

        {/* 이메일 찾기 섹션 */}
        <div className="mt-6 xs:mt-4 pt-6 xs:pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 
            className="text-lg xs:text-[17px] font-semibold text-gray-800 dark:text-gray-100 mb-1"
          >
            {t('recovery.section_title')}
          </h3>
          <p 
            className="text-sm xs:text-[13px] text-gray-500 dark:text-gray-400 mb-4 xs:mb-3"
            style={{ overflowWrap: 'break-word' }}
          >
            {t('recovery.section_description')}
          </p>

          <div className="flex flex-col gap-4 xs:gap-3">
            {/* 질문 선택 */}
            <SelectField
              id="recovery-question"
              label={t('recovery.question_label')}
              value={recoveryQuestion}
              onChange={v => {
                setRecoveryQuestion(v as RecoveryQuestion);
                setErrors(prev => ({ ...prev, recoveryQuestion: undefined }));
                emit({ ...snapshot, recoveryQuestion: v as RecoveryQuestion });
              }}
              options={RECOVERY_QUESTIONS.map(q => ({ value: q, label: t(q) }))}
              error={errors.recoveryQuestion}
            />

            {/* 답변 입력 */}
            <InputField
              id="recovery-answer"
              label={t('recovery.answer_label')}
              value={recoveryAnswer}
              onChange={v => {
                setRecoveryAnswer(v);
                setErrors(prev => ({ ...prev, recoveryAnswer: undefined }));
                emit({ ...snapshot, recoveryAnswer: v });
              }}
              error={errors.recoveryAnswer}
              inputProps={{
                placeholder: ' '
              }}
            />

            {/* 보조 이메일 */}
            <div>
              <InputField
                id="recovery-email"
                label={t('recovery.temp_email_label')}
                type="email"
                value={recoveryEmail}
                onChange={v => {
                  setRecoveryEmail(v);
                  setErrors(prev => ({ ...prev, recoveryEmail: undefined }));
                  setRecoveryEmailCheckResult('');
                  emit({ ...snapshot, recoveryEmail: v });
                }}
                isChecking={recoveryEmailChecking}
                checkResult={recoveryEmailCheckResult}
                onCheck={handleRecoveryEmailCheck}
                error={errors.recoveryEmail}
                inputProps={{
                  placeholder: ' '
                }}
              />
              <p className="mt-1.5 text-[11px] xs:text-[10.5px] text-gray-500 dark:text-gray-400 ml-3">
                {t('recovery.temp_email_description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between sm:justify-end gap-2 sm:gap-3 mt-6 xs:mt-4">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:opacity-80 transition-colors dark:bg-neutral-500 dark:text-gray-100 xs:text-[14px] xs:py-1.5"
        >
          {t('signup.btn_previous')}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={emailChecking || nickValidator.checking}
          className="bg-[var(--ara-primary)] text-white font-semibold py-2 px-4 rounded-lg hover:opacity-85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed xs:text-[14px] xs:py-1.5"
        >
          {t('signup.btn_next_step')}
        </button>
      </div>
    </section>
  );
}

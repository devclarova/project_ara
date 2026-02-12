import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import BirthInput from './BirthInput';
import CountrySelect from './CountrySelect';
import GenderSelect from './GenderSelect';
import InputField from './InputField';
import { useTranslation } from 'react-i18next';
import { useNicknameValidator } from '@/hooks/useNicknameValidator';
import NicknameInputField from '@/components/common/NicknameInputField';

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
    
    if (value.nickname) {
       nickValidator.validateInput(value.nickname);
    }
  }, [value]);

  const emit = (next: FormData) => onChange?.(next);

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
      });
    })();
  }, [signupKind]);

  useEffect(() => {
    onInvalidateByChange(email, nickname);
  }, [email, nickname]);

  useEffect(() => {
    if (verified.email.ok && verified.email.value === email) {
      setEmailCheckResult('available');
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    if (verified.nickname.ok && verified.nickname.value === nickname) {
       nickValidator.setError(undefined);
    }
  }, [verified.email.value, verified.email.ok, verified.nickname.value, verified.nickname.ok]);

  useEffect(() => {
    if (submitAttempted) validate(true);
  }, [submitAttempted]);

  const snapshot: FormData = useMemo(
    () => ({ email, pw, confirmPw, nickname, gender, birth, birthYmd, country }),
    [email, pw, confirmPw, nickname, gender, birth, birthYmd, country],
  );

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<'available' | 'taken' | ''>('');
  
  const validate = (withDupHints = false): boolean => {
    const newErr: Partial<Record<keyof FormData, string>> = {};

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

    const { error: nickMsg } = nickValidator.getFormatError(nickname);
    if (nickMsg) newErr.nickname = nickMsg;
    
    if (!gender) newErr.gender = t('validation.gender_select');
    if (!birth) newErr.birth = t('validation.required_birthday');
    if (birth && !isAge14Plus(birth)) {
      newErr.birth = t('validation.age_restriction');
    }
    if (!country) newErr.country = t('validation.country_select');

    if (withDupHints) {
      if (signupKind !== 'social') {
        const emailVerifiedOk = verified.email.ok && verified.email.value === email;
        if (!newErr.email && !emailVerifiedOk && emailCheckResult !== 'available') {
          newErr.email =
            emailCheckResult === 'taken'
              ? t('validation.email_taken')
              : t('validation.email_check_required');
        }
      }
      const nickVerifiedOk = verified.nickname.ok && verified.nickname.value === nickname;
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

  const handleNickCheck = async () => {
    const isAvailable = await nickValidator.checkAvailability(nickname);
    if (isAvailable) {
      onDupChecked('nickname', nickname, true);
      setErrors(prev => ({ ...prev, nickname: undefined }));
    }
  };

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
    
    try {
      const emailPromise = signupKind === 'social' ? Promise.resolve<'available'>('available') : emailDupStatus();
      const nickPromise = (cachedNickOK || hookNickOK) ? Promise.resolve(true) : nickValidator.checkAvailability(nickname);
      
      const [eRes, nRes] = await Promise.all([emailPromise, nickPromise]);

      setEmailCheckResult(eRes === 'available' ? 'available' : eRes === 'taken' ? 'taken' : '');

      if (eRes === 'taken') {
        setErrors(prev => ({ ...prev, email: t('signup.error_email_taken') }));
        return;
      }
      if (eRes === 'error') {
        setErrors(prev => ({ ...prev, email: t('signup.error_email_check_retry') }));
        return;
      }
      
      if (!nRes) return;

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
            if (signupKind === 'social') return;
            setEmail(v);
            setErrors(prev => ({ ...prev, email: undefined }));
            setEmailCheckResult('');
            emit({ ...snapshot, email: v });
          }}
          error={errors.email}
          isChecking={emailChecking}
          checkResult={signupKind === 'social' ? '' : emailCheckResult}
          onCheck={signupKind === 'social' ? undefined : handleEmailCheck}
          disabled={signupKind === 'social'}
        />

        {signupKind !== 'social' && (
          <>
            <InputField
              id="pw"
              label={t('signup.label_password')}
              type="password"
              value={pw}
              onChange={v => {
                setPw(v);
                setErrors(prev => ({ ...prev, pw: undefined, confirmPw: undefined }));
                emit({ ...snapshot, pw: v });
              }}
              error={errors.pw}
            />

            <InputField
              id="confirmPw"
              label={t('signup.label_password_confirm')}
              type="password"
              value={confirmPw}
              onChange={v => {
                setConfirmPw(v);
                setErrors(prev => ({ ...prev, confirmPw: undefined }));
                emit({ ...snapshot, confirmPw: v });
              }}
              error={errors.confirmPw}
            />
          </>
        )}

        <NicknameInputField
          value={nickname}
          onChange={v => {
            setNickname(v);
            nickValidator.validateInput(v);
            emit({ ...snapshot, nickname: v });
          }}
          error={errors.nickname}
          checkResult={nickValidator.checkResult}
          isChecking={nickValidator.checking}
          onCheck={handleNickCheck}
          detectedLang={nickValidator.detectedLang} 
          minLen={nickValidator.detectedLang ? nickValidator.minLen(nickValidator.detectedLang) : 0}
          maxLen={nickValidator.detectedLang ? nickValidator.maxLen(nickValidator.detectedLang) : 0}
        />

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

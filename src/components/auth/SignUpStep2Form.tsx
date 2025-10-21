import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import BirthInput from './BirthInput';
import CountrySelect from './CountrySelect';
import GenderSelect from './GenderSelect';
import InputField from './InputField';

const EMAIL_ASCII_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
// ASCII 전용(한글 등 비ASCII 포함 시 거르기)
const NON_ASCII_RE = /[^\x00-\x7F]/;

function validateEmailField(raw: string): string {
  const s = raw ?? '';

  if (!s.trim()) return '이메일을 입력해주세요.';

  // ✅ 공백 포함 즉시 차단 (맨 앞, 뒤, 중간 모두)
  if (/\s/.test(s)) return '이메일에 공백은 사용할 수 없습니다.';

  // ✅ 비ASCII(한글 등) 포함 즉시 차단
  if (NON_ASCII_RE.test(s)) return '이메일은 영문/숫자로만 입력해주세요.';

  // ✅ 1차 기본 형식(local@domain)
  if (!EMAIL_ASCII_RE.test(s)) return '올바르지 않은 이메일 형식입니다.';

  // ── 추가 안전검사 ──
  if (s.length > 254) return '올바르지 않은 이메일 형식입니다.';
  const [local, domain] = s.split('@');
  if (!local || !domain) return '올바르지 않은 이메일 형식입니다.';
  if (local.length > 64) return '올바르지 않은 이메일 형식입니다.';
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..'))
    return '올바르지 않은 이메일 형식입니다.';

  // ✅ 도메인 라벨 검증
  const labels = domain.split('.');
  if (labels.length < 2) return '올바르지 않은 이메일 형식입니다.';
  for (const lab of labels) {
    if (!/^[A-Za-z0-9-]{1,63}$/.test(lab)) return '올바르지 않은 이메일 형식입니다.';
    if (lab.startsWith('-') || lab.endsWith('-')) return '올바르지 않은 이메일 형식입니다.';
  }

  const tld = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,63}$/.test(tld)) return '올바르지 않은 이메일 형식입니다.';

  return '';
}

// ============================
// 비밀번호 검증 규칙
// ============================
const PW_LETTER_RE = /[A-Za-z]/;
const PW_NUMBER_RE = /[0-9]/;
const PW_SPECIAL_RE = /[!@#$%^&*]/;

function validatePasswordField(pw: string): string {
  const v = pw ?? '';
  if (!v) return '비밀번호를 입력해주세요.';
  if (/\s/.test(v)) return '비밀번호에 공백은 사용할 수 없습니다.';
  if (v.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
  if (!PW_LETTER_RE.test(v) || !PW_NUMBER_RE.test(v) || !PW_SPECIAL_RE.test(v)) {
    return '문자, 숫자, 특수문자(!/@/#/$/%/^/&/*)를 모두 포함하세요.';
  }
  return '';
}

function validateConfirmPwField(confirm: string, pw: string): string {
  const c = confirm ?? '';
  if (!c) return '비밀번호 확인을 입력해주세요.';
  if (c !== (pw ?? '')) return '비밀번호가 일치하지 않습니다.';
  return '';
}

type Props = {
  onNext: (data: FormData) => void;
  onBack: () => void;
  value?: FormData;
  onChange?: (data: FormData) => void;
};

export type FormData = {
  email: string;
  pw: string;
  confirmPw: string;
  nickname: string;
  gender: string;
  birth: Date | null;
  country: string;
};

export default function SignUpStep2Form({ onNext, onBack, value, onChange }: Props) {
  // 내부 상태 초기화 (부모 값 우선)
  const [email, setEmail] = useState(value?.email ?? '');
  const [pw, setPw] = useState(value?.pw ?? '');
  const [confirmPw, setConfirmPw] = useState(value?.confirmPw ?? '');
  const [nickname, setNickname] = useState(value?.nickname ?? '');
  const [gender, setGender] = useState(value?.gender ?? '');
  const [birth, setBirth] = useState<Date | null>(value?.birth ?? null);
  const [country, setCountry] = useState(value?.country ?? '');

  // 부모 값이 바뀌면 내부 상태도 동기화
  useEffect(() => {
    if (!value) return;
    setEmail(value.email ?? '');
    setPw(value.pw ?? '');
    setConfirmPw(value.confirmPw ?? '');
    setNickname(value.nickname ?? '');
    setGender(value.gender ?? '');
    setBirth(value.birth ?? null);
    setCountry(value.country ?? '');
  }, [value]);

  // 부모로 변경 통지 헬퍼
  const emit = (next: FormData) => onChange?.(next);

  const snapshot: FormData = useMemo(
    () => ({ email, pw, confirmPw, nickname, gender, birth, country }),
    [email, pw, confirmPw, nickname, gender, birth, country],
  );

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // 중복체크 버튼용 상태
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<'available' | 'taken' | ''>('');
  const [nickChecking, setNickChecking] = useState(false);
  const [nickCheckResult, setNickCheckResult] = useState<'available' | 'taken' | ''>('');

  const validate = (): boolean => {
    const newErr: Partial<Record<keyof FormData, string>> = {};

    // ✅ 이메일: 단일 소스 검증
    const emailMsg = validateEmailField(email);
    if (emailMsg) newErr.email = emailMsg;

    // ✅ 비밀번호/확인: 강화 검증
    const pwMsg = validatePasswordField(pw);
    if (pwMsg) newErr.pw = pwMsg;

    const confirmMsg = validateConfirmPwField(confirmPw, pw);
    if (confirmMsg) newErr.confirmPw = confirmMsg;

    if (!nickname) newErr.nickname = '닉네임을 입력해주세요.';
    if (!gender) newErr.gender = '성별을 선택해주세요.';
    if (!birth) newErr.birth = '생년월일을 입력해주세요.';
    if (!country) newErr.country = '국적을 선택해주세요.';

    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    onNext(snapshot);
  };

  // 이메일 중복체크
  const handleEmailCheck = async () => {
    const msg = validateEmailField(email);
    // 형식/ASCII 미통과면 서버 호출 안 함
    if (msg) {
      setEmailCheckResult('');
      setErrors(prev => ({ ...prev, email: msg }));
      return;
    }

    setEmailChecking(true);
    try {
      const v = email.trim();
      const { data, error } = await supabase.rpc('email_exists', { _email: v });
      if (error) {
        console.error('email_exists error:', error.message);
        setEmailCheckResult('');
        return;
      }
      // data === true → 이미 존재(사용 불가)
      if (data === true) {
        setEmailCheckResult('taken');
        setErrors(prev => ({ ...prev, email: '해당 이메일은 이미 사용 중입니다.' }));
      } else {
        setEmailCheckResult('available');
        setErrors(prev => ({ ...prev, email: undefined }));
      }
    } finally {
      setEmailChecking(false);
    }
  };

  // 닉네임 중복체크 버튼(지금은 버튼만 동작, 로직은 나중에)
  const handleNickCheck = async () => {
    setNickChecking(true);
    try {
      setNickCheckResult('');
    } finally {
      setNickChecking(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">회원 정보 입력</h2>

      <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
        <InputField
          id="email"
          label="이메일"
          value={email}
          onChange={v => {
            setEmail(v);
            // 입력 시 이메일 관련 에러/체크 결과 리셋
            setErrors(prev => ({ ...prev, email: undefined }));
            setEmailCheckResult('');
            emit({ ...snapshot, email: v });
          }}
          onBlur={() => {
            // 포커스 해제 시 1차 형식/ASCII 검증
            const msg = validateEmailField(email);
            setErrors(prev => ({ ...prev, email: msg || undefined }));
          }}
          error={errors.email}
          onCheck={handleEmailCheck}
          isChecking={emailChecking}
          checkResult={emailCheckResult}
        />

        <InputField
          id="pw"
          label="비밀번호"
          type="password"
          value={pw}
          onChange={v => {
            setPw(v);
            // 입력 중엔 비밀번호/확인 에러 해제
            setErrors(prev => ({ ...prev, pw: undefined, confirmPw: undefined }));
            emit({ ...snapshot, pw: v });
          }}
          onBlur={() => {
            const msg = validatePasswordField(pw);
            setErrors(prev => ({ ...prev, pw: msg || undefined }));
          }}
          error={errors.pw}
        />

        <InputField
          id="confirmPw"
          label="비밀번호 확인"
          type="password"
          value={confirmPw}
          onChange={v => {
            setConfirmPw(v);
            setErrors(prev => ({ ...prev, confirmPw: undefined }));
            emit({ ...snapshot, confirmPw: v });
          }}
          onBlur={() => {
            const msg = validateConfirmPwField(confirmPw, pw);
            setErrors(prev => ({ ...prev, confirmPw: msg || undefined }));
          }}
          error={errors.confirmPw}
        />

        <InputField
          id="nickname"
          label="닉네임"
          value={nickname}
          onChange={v => {
            setNickname(v);
            setErrors(prev => ({ ...prev, nickname: undefined }));
            setNickCheckResult('');
            emit({ ...snapshot, nickname: v });
          }}
          error={errors.nickname}
          onCheck={handleNickCheck}
          isChecking={nickChecking}
          checkResult={nickCheckResult}
        />

        <GenderSelect
          value={gender}
          onChange={v => {
            setGender(v);
            emit({ ...snapshot, gender: v });
          }}
          error={!!errors.gender}
        />

        <BirthInput
          value={birth}
          onChange={v => {
            setBirth(v);
            emit({ ...snapshot, birth: v });
          }}
          error={!!errors.birth}
        />

        <CountrySelect
          value={country}
          onChange={v => {
            setCountry(v);
            emit({ ...snapshot, country: v });
          }}
          error={!!errors.country}
        />
      </div>

      <div className="flex justify-between sm:justify-end gap-2 sm:gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:opacity-80 transition-colors"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="bg-[var(--ara-primary)] text-white font-semibold py-2 px-4 rounded-lg hover:opacity-85 transition-colors"
        >
          다음 단계
        </button>
      </div>
    </section>
  );
}

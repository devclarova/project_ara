import React, { useEffect, useMemo, useState } from 'react';
import InputField from './InputField';
import GenderSelect from './GenderSelect';
import BirthInput from './BirthInput';
import CountrySelect from './CountrySelect';

type Props = {
  onNext: (data: FormData) => void;
  onBack: () => void;

  /** 부모가 가지고 있는 값(되돌아와도 값 유지용) */
  value?: FormData;
  /** 입력이 바뀔 때 부모에게 즉시 알려줌 */
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

  // 부모 값이 바뀌면 내부 상태도 동기화 (되돌아왔을 때 그대로 보이도록)
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

  const validate = (): boolean => {
    const newErr: Partial<Record<keyof FormData, string>> = {};
    if (!email) newErr.email = '이메일을 입력해주세요.';
    if (!pw) newErr.pw = '비밀번호를 입력해주세요.';
    if (pw && pw.length < 6) newErr.pw = '비밀번호는 6자 이상이어야 합니다.';
    if (confirmPw !== pw) newErr.confirmPw = '비밀번호가 일치하지 않습니다.';
    if (!nickname) newErr.nickname = '닉네임을 입력해주세요.';
    if (!gender) newErr.gender = '성별을 선택해주세요.';
    if (!birth) newErr.birth = '생년월일을 입력해주세요.';
    if (!country) newErr.country = '국적을 선택해주세요.';
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleNext = () => {
    // 최신 스냅샷으로 유효성 검사
    if (!validate()) return;
    onNext(snapshot);
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
            emit({ ...snapshot, email: v });
          }}
          error={errors.email}
        />
        <InputField
          id="pw"
          label="비밀번호"
          type="password"
          value={pw}
          onChange={v => {
            setPw(v);
            emit({ ...snapshot, pw: v });
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
            emit({ ...snapshot, confirmPw: v });
          }}
          error={errors.confirmPw}
        />
        <InputField
          id="nickname"
          label="닉네임"
          value={nickname}
          onChange={v => {
            setNickname(v);
            emit({ ...snapshot, nickname: v });
          }}
          error={errors.nickname}
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

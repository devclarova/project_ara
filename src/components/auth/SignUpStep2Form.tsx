import React, { useState } from 'react';
import InputField from './InputField';
import GenderSelect from './GenderSelect';
import BirthInput from './BirthInput';
import CountrySelect from './CountrySelect';

type Props = {
  onNext: (data: FormData) => void;
  onBack: () => void;
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

export default function SignUpStep2Form({ onNext, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [birth, setBirth] = useState<Date | null>(null);
  const [country, setCountry] = useState('');

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
    if (!validate()) return;
    onNext({ email, pw, confirmPw, nickname, gender, birth, country });
  };

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">회원 정보 입력</h2>

      <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
        <InputField
          id="email"
          label="이메일"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <InputField
          id="pw"
          label="비밀번호"
          type="password"
          value={pw}
          onChange={setPw}
          error={errors.pw}
        />
        <InputField
          id="confirmPw"
          label="비밀번호 확인"
          type="password"
          value={confirmPw}
          onChange={setConfirmPw}
          error={errors.confirmPw}
        />
        <InputField
          id="nickname"
          label="닉네임"
          value={nickname}
          onChange={setNickname}
          error={errors.nickname}
        />
        <GenderSelect value={gender} onChange={setGender} error={!!errors.gender} />
        <BirthInput value={birth} onChange={setBirth} error={!!errors.birth} />
        <CountrySelect value={country} onChange={setCountry} error={!!errors.country} />
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

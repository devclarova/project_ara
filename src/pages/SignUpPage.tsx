import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CountrySelect from '../components/common/CountrySelect';
import BirthInput from '../components/common/BirthInput';
import GenderSelect from '../components/common/GenderSelect';

function SignUpPage() {
  const { signUp } = useAuth();

  // form state
  const [email, setEmail] = useState<string>('');
  const [pw, setPw] = useState<string>('');
  const [confirmPw, setConfirmPw] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [birth, setBirth] = useState<Date | null>(null);
  const [country, setCountry] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // error state
  const [errors, setErrors] = useState<{
    email?: string;
    pw?: string;
    confirmPw?: string;
    nickname?: string;
  }>({});

  // 입력값 변경 시 오류 제거
  const handleChange = (field: keyof typeof errors, value: any) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
    switch (field) {
      case 'email':
        setEmail(value);
        break;
      case 'pw':
        setPw(value);
        break;
      case 'confirmPw':
        setConfirmPw(value);
        break;
      case 'nickname':
        setNickname(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSubmitAttempted(true);

    let tempErrors: typeof errors = {};

    if (!email) tempErrors.email = '이메일을 입력해주세요.';
    if (!pw) tempErrors.pw = '비밀번호를 입력해주세요.';
    if (!confirmPw) tempErrors.confirmPw = '비밀번호 확인을 입력해주세요.';
    if (pw && confirmPw && pw !== confirmPw) tempErrors.confirmPw = '비밀번호가 일치하지 않습니다.';
    if (!nickname) tempErrors.nickname = '닉네임을 입력해주세요.';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    // 회원가입 로직
    const { error } = await signUp(email, pw);
    if (error) {
      setMsg(`회원가입 오류: ${error}`);
    } else {
      setMsg('회원가입이 성공했습니다. 이메일 인증 링크를 확인해 주세요.');
    }
  };

  return (
    <div className="min-h-16 flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl rounded-2xl p-4 sm:p-6 md:p-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4 sm:mb-6">
          Create an Ara Account
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5 md:gap-6">
          {/* 이메일 */}
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder=" "
              className={`peer w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-black text-sm sm:text-base
                ${errors.email ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-300'}`}
            />
            <label
              htmlFor="email"
              className={`absolute left-3 sm:left-4 transition-all
                ${email ? '-top-3 text-xs sm:text-sm' : 'top-2 sm:top-3 text-sm sm:text-base'}
                peer-focus:-top-3 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-primary
                text-gray-400 bg-white/95 px-1 rounded`}
            >
              Email
            </label>
            {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email}</p>}
          </div>

          {/* 비밀번호 */}
          <div className="relative">
            <input
              type="password"
              id="pw"
              value={pw}
              onChange={e => handleChange('pw', e.target.value)}
              placeholder=" "
              className={`peer w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-black text-sm sm:text-base
                ${errors.pw ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-300'}`}
            />
            <label
              htmlFor="pw"
              className={`absolute left-3 sm:left-4 transition-all
                ${pw ? '-top-3 text-xs sm:text-sm' : 'top-2 sm:top-3 text-sm sm:text-base'}
                peer-focus:-top-3 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-primary
                text-gray-400 bg-white/95 px-1 rounded`}
            >
              Password
            </label>
            {errors.pw && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.pw}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div className="relative">
            <input
              type="password"
              id="confirmPw"
              value={confirmPw}
              onChange={e => handleChange('confirmPw', e.target.value)}
              placeholder=" "
              className={`peer w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-black text-sm sm:text-base
                ${errors.confirmPw ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-300'}`}
            />
            <label
              htmlFor="confirmPw"
              className={`absolute left-3 sm:left-4 transition-all
                ${confirmPw ? '-top-3 text-xs sm:text-sm' : 'top-2 sm:top-3 text-sm sm:text-base'}
                peer-focus:-top-3 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-primary
                text-gray-400 bg-white/95 px-1 rounded`}
            >
              Confirm Password
            </label>
            {errors.confirmPw && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.confirmPw}</p>
            )}
          </div>

          {/* 닉네임 */}
          <div className="relative">
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={e => handleChange('nickname', e.target.value)}
              placeholder=" "
              className={`peer w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-black text-sm sm:text-base
                ${errors.nickname ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-300'}`}
            />
            <label
              htmlFor="nickname"
              className={`absolute left-3 sm:left-4 transition-all
                ${nickname ? '-top-3 text-xs sm:text-sm' : 'top-2 sm:top-3 text-sm sm:text-base'}
                peer-focus:-top-3 peer-focus:text-xs sm:peer-focus:text-sm peer-focus:text-primary
                text-gray-400 bg-white/95 px-1 rounded`}
            >
              Nickname
            </label>
            {errors.nickname && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.nickname}</p>
            )}
          </div>

          {/* 성별, 생년월일, 국가 (ring 제거) */}
          <GenderSelect
            value={gender}
            onChange={setGender}
            error={submitAttempted && gender === ''}
          />
          <BirthInput value={birth} onChange={setBirth} error={submitAttempted && !birth} />
          {submitAttempted && !birth && (
            <p className="mt-1 text-red-500 text-sm">생년월일을 입력해주세요.</p>
          )}
          <CountrySelect value={country} onChange={setCountry} />

          {/* 프로필 사진 */}
          <div className="flex flex-col items-center mt-3 sm:mt-4">
            <label className="mb-2 font-semibold text-gray-700 text-sm sm:text-base">
              Select Profile Picture
            </label>

            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                <span className="text-gray-400 text-xs sm:text-sm">No Image</span>
              </div>
              <input type="file" accept="image/*" id="profile-upload" className="hidden" />
              <label
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 bg-primary opacity-70 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full cursor-pointer shadow flex items-center justify-center hover:opacity-90"
              >
                <img
                  src="/images/photo_icon.png"
                  alt="Select Profile Picture"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
              </label>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              JPG, PNG, GIF 등 모든 이미지 최대 2MB
            </p>
          </div>

          <button
            type="submit"
            className="bg-primary text-white font-semibold py-2 sm:py-3 rounded-lg hover:opacity-75 transition-colors text-sm sm:text-base"
          >
            Sign Up
          </button>
        </form>
        {msg && <p className="mt-3 sm:mt-4 text-center text-red-500 text-sm sm:text-base">{msg}</p>}
      </div>
    </div>
  );
}

export default SignUpPage;

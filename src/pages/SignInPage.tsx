import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [pw, setPw] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; pw?: string }>({});
  const navigate = useNavigate();
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [suppressEffects, setSuppressEffects] = useState(false);

  const handleChange = (field: 'email' | 'pw', value: string) => {
    setSuppressEffects(false);

    if (field === 'email') {
      setEmail(value);
      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
    } else {
      setPw(value);
      if (errors.pw) setErrors(prev => ({ ...prev, pw: '' }));
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resend({ type: 'signup', email: normalizedEmail });
    setResendMsg(error ? error.message : '인증 메일이 발송되었습니다. 이메일을 확인해주세요.');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg('');
    setNotConfirmed(false);
    setLoading(true);
    setErrors({});
    setSuppressEffects(false);

    // 입력 정규화(공백 제거 + 이메일 소문자)
    const normalizedEmail = email.trim().toLowerCase();
    const pwValue = pw;

    // 필수 입력 체크
    if (!normalizedEmail || !pwValue) {
      setErrors({
        email: !normalizedEmail ? '이메일을 입력해주세요.' : '',
        pw: !pwValue ? '패스워드를 입력해주세요.' : '',
      });
      setLoading(false);
      return;
    }

    // 로그인 시도
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: pwValue,
    });

    if (error) {
      // 상태코드/원문 기반으로 “정확히” 분기
      // supabase-js v2에선 AuthApiError 형태로 status가 들어옵니다.
      // (타입 임포트 안 해도 사용 가능: 런타임 속성만 읽음)
      const status = (error as { status?: number }).status ?? 0;
      const raw = error.message ?? '';
      const low = raw.toLowerCase();

      // 미인증
      const isUnverified =
        low.includes('email not confirmed') ||
        low === 'not confirmed' ||
        (status === 400 && low.includes('not confirmed'));

      if (isUnverified) {
        setNotConfirmed(true);
        // 인증 메일 자동 재발송
        try {
          await supabase.auth.resend({ type: 'signup', email: normalizedEmail });
        } catch {
          /* no-op */
        }
        setErrors(prev => ({
          ...prev,
          email: '이메일 인증 실패, 이메일을 확인해주세요.',
          pw: '',
        }));
        setMsg('로그인 전 이메일 인증을 해주세요.');
        setLoading(false);
        return;
      }

      // 잘못된 자격증명(이메일/비밀번호 불일치)
      const isInvalidCred =
        status === 400 ||
        low.includes('invalid login') ||
        low.includes('invalid credentials') ||
        low.includes('invalid email or password') ||
        low.includes('invalid password') ||
        low.includes('invalid email') ||
        low.includes('invalid_grant');

      if (isInvalidCred) {
        setErrors(prev => ({ ...prev, email: '', pw: '' }));
        setMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
        setSuppressEffects(false);
        setLoading(false);
        return;
      }

      // 기타 오류 노출
      setMsg(raw || '알 수 없는 오류로 인해 로그인에 실패했습니다.');
      setLoading(false);
      return;
    }

    // 성공
    setLoading(false);
    navigate('/home');
  };

  return (
    <div className="flex items-center justify-center bg-white pt-12 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        {/* 로고 및 제목 */}
        <div className="text-center mb-6">
          <span className="flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-bold text-red-400">
            <img
              src="/images/sample_logo.png"
              alt="Ara"
              className="mx-auto w-24 sm:w-28 md:w-32 lg:w-40 xl:w-48"
            />
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            아라에 오신 것을 환영합니다!
          </h2>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder=" "
              className={`peer w-full px-4 py-2 border bg-white text-gray-800 text-sm ara-rounded
                ${errors.email ? 'ara-focus--error' : 'ara-focus'}
                ${errors.email ? '' : 'border-gray-300'}`}
            />
            <label
              htmlFor="email"
              className={`absolute left-4 text-sm transition-all
                ${email || errors.email ? '-top-3 text-sm' : 'top-2.5 text-gray-400 text-sm'}
                ${errors.email ? 'text-red-500' : 'peer-focus:text-[#00BFA5]'}
                peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400
                peer-focus:-top-3 peer-focus:text-sm peer-focus:text-[#00BFA5]
                bg-white px-1`}
            >
              Email
            </label>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type="password"
              id="password"
              value={pw}
              onChange={e => handleChange('pw', e.target.value)}
              placeholder=" "
              className={`peer w-full px-4 py-2 border bg-white text-gray-800 text-sm ara-rounded
                ${errors.pw ? 'ara-focus--error' : 'ara-focus'}
                ${errors.pw ? '' : 'border-gray-300'}`}
            />
            <label
              htmlFor="password"
              className={`absolute left-4 text-sm transition-all
                ${pw || errors.pw ? '-top-3 text-sm' : 'top-2.5 text-gray-400 text-sm'}
                ${errors.pw ? 'text-red-500' : 'peer-focus:text-[#00BFA5]'}
                peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400
                peer-focus:-top-3 peer-focus:text-sm peer-focus:text-[#00BFA5]
                bg-white px-1`}
            >
              Password
            </label>
            {errors.pw && <p className="text-red-500 text-xs mt-1">{errors.pw}</p>}
          </div>

          {msg && <p className="my-4 text-center text-red-400 text-sm sm:text-base">{msg}</p>}

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 sm:py-3 rounded-lg font-semibold hover:opacity-80 text-sm sm:text-base disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {notConfirmed && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleResend}
              className="text-primary underline hover:opacity-80"
            >
              인증 메일 재발송
            </button>
            {resendMsg && <p className="mt-2 text-sm text-gray-600">{resendMsg}</p>}
          </div>
        )}

        <p className="mt-4 text-center text-sm sm:text-base text-gray-500">
          처음 오시나요? 계정을 생성해보세요.{' '}
          <span
            onClick={() => navigate('/signup')}
            className="text-primary font-medium cursor-pointer"
          >
            회원가입
          </span>
        </p>

        <div className="mt-4 flex items-center">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-2 text-gray-400 text-sm sm:text-base">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-primary rounded-lg py-2 sm:py-3 text-sm sm:text-base font-medium text-primary bg-gray-50 hover:opacity-80 transition-opacity"
          >
            <img src="/images/google_logo.png" alt="Sign in with Google" className="w-5 h-5" />
            <span>Google로 로그인하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;

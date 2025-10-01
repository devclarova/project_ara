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

  const handleChange = (field: 'email' | 'pw', value: string) => {
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
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResendMsg(error ? error.message : 'Verification email sent. Please check your inbox.');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({}); // 초기화

    if (!email || !pw) {
      setErrors({
        email: !email ? 'Please enter your email.' : '',
        pw: !pw ? 'Please enter your password.' : '',
      });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      const unverified =
        msg.includes('confirm') || msg.includes('not confirmed') || msg.includes('verify');

      setNotConfirmed(unverified);

      // ✅ 미인증이면 인증 메일 재발송
      if (unverified) {
        const { error: resendErr } = await supabase.auth.resend({ type: 'signup', email });
        if (resendErr) {
          console.warn('resend failed:', resendErr.message);
        } else {
          setMsg('Verification email re-sent. Please check your inbox.');
        }
      }

      setErrors(prev => ({
        ...prev,
        email: unverified ? 'Email is not confirmed. Please check your inbox.' : prev.email,
        pw: unverified ? '' : prev.pw,
      }));
      if (!unverified) setMsg(error.message);

      setLoading(false);
      return;
    }

    // ✅ 로그인 성공: 프로필 보장 RPC (실패해도 로그인은 진행)
    try {
      // 타입 오류가 뜨면 as any 캐스팅 사용
      const { error: rpcErr } = await (supabase as any).rpc('ensure_profile');
      if (rpcErr) console.warn('ensure_profile RPC failed:', rpcErr.message);
    } catch (e: any) {
      console.warn('ensure_profile RPC exception:', e?.message);
    }

    navigate('/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
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
            Welcome back to Ara
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
              Resend verification email
            </button>
            {resendMsg && <p className="mt-2 text-sm text-gray-600">{resendMsg}</p>}
          </div>
        )}

        <p className="mt-4 text-center text-sm sm:text-base text-gray-500">
          New here? Create an account{' '}
          <span
            onClick={() => navigate('/signup')}
            className="text-primary font-medium cursor-pointer"
          >
            Sign Up
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
            <span>Sign in with Google</span>
          </button>
        </div>

        {msg && <p className="mt-4 text-center text-red-400 text-sm sm:text-base">{msg}</p>}
      </div>
    </div>
  );
}

export default SignInPage;

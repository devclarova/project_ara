import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [pw, setPw] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const navigate = useNavigate();

  const handleSumit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { error } = await signIn(email, pw);
    if (error) {
      setMsg(`로그인 오류: ${error}`);
    } else {
      setMsg('로그인 성공');
    }
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
        <form onSubmit={handleSumit} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder=" " // floating label용
              className="peer w-full px-4 py-2 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
            />
            <label
              htmlFor="email"
              className="absolute left-4 top-2.5 sm:top-3 text-gray-400 text-sm sm:text-base transition-all
      peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm
      peer-focus:-top-3 peer-focus:left-3 peer-focus:text-sm peer-focus:text-[#00BFA5]
      bg-white px-1"
            >
              Email
            </label>
          </div>
          <div className="relative">
            <input
              type="password"
              id="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder=" " // floating label용
              className="peer w-full px-4 py-2 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-2.5 sm:top-3 text-gray-400 text-sm sm:text-base transition-all
      peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm
      peer-focus:-top-3 peer-focus:left-3 peer-focus:text-sm peer-focus:text-primary
      bg-white px-1"
            >
              Password
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 sm:py-3 rounded-lg font-semibold hover:opacity-80 text-sm sm:text-base"
          >
            Sign In
          </button>
        </form>

        <p className="mt-4 text-center text-sm sm:text-base text-gray-500">
          New here? Create an account.{' '}
          <span
            onClick={e => navigate('/signup')}
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

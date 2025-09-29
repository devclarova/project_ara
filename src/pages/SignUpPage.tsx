import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CountrySelect from '../components/common/CountrySelect';

function SignUpPage() {
  const { signUp } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [pw, setPw] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [birth, setBirth] = useState<string>('');
  const [country, setCountry] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await signUp(email, pw);
    if (error) {
      setMsg(`회원가입 오류: ${error}`);
    } else {
      setMsg('회원가입이 성공했습니다. 이메일 인증 링크를 확인해 주세요.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create an Ara Account</h2>
        <div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Password"
              className="px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="Nickname"
              className="px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={birth}
              onChange={e => setBirth(e.target.value)}
              placeholder="Birth"
              className="px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <CountrySelect value={country} onChange={setCountry} />
            <button
              type="submit"
              className="bg-primary text-white font-semibold py-3 rounded-lg hover:bg-secondary transition-colors"
            >
              회원가입
            </button>
          </form>
          {msg && <p className="mt-4 text-center text-red-500">{msg}</p>}
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;

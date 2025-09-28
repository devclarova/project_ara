// import React, { useState } from 'react';
// import { useAuth } from '../contexts/AuthContext';

// function SignInPage() {
//   const { signIn } = useAuth();
//   const [email, setEmail] = useState<string>('');
//   const [pw, setPw] = useState<string>('');
//   const [msg, setMsg] = useState<string>('');

//   const handleSumit = async (e: React.FormEvent<HTMLFormElement>) => {
//     // 새로고침 방지
//     e.preventDefault;

//     const { error } = await signIn(email, pw);
//     if (error) {
//       setMsg(`로그인 오류:${error}`);
//     } else {
//       setMsg('로그인 성공');
//     }
//   };

//   return (
//     <div>
//       <h2>Welcome back to Ara</h2>
//       <div>
//         <form onSubmit={handleSumit}>
//           <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
//           <input type="password" value={pw} onChange={e => setPw(e.target.value)} />
//           <button type="submit">로그인</button>
//         </form>
//         <p>{msg}</p>
//       </div>
//     </div>
//   );
// }

// export default SignInPage;

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [pw, setPw] = useState<string>('');
  const [msg, setMsg] = useState<string>('');

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
          <div>
            <label className="block text-sm sm:text-base text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-red-500 transition-colors text-sm sm:text-base"
          >
            Sign In
          </button>
        </form>

        <p className="mt-4 text-center text-sm sm:text-base text-gray-500">
          New here? Create an account.{' '}
          <span className="text-primary font-medium cursor-pointer">Sign Up</span>
        </p>

        <div className="mt-4 flex items-center justify-center text-gray-400 text-sm sm:text-base">
          <span>OR</span>
        </div>

        <div className="mt-4 space-y-2">
          <button className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-2 sm:py-3 text-sm sm:text-base hover:bg-gray-100 transition-colors">
            <span className="mr-2">G</span> Sign in with Google
          </button>
        </div>

        {msg && <p className="mt-4 text-center text-red-400 text-sm sm:text-base">{msg}</p>}
      </div>
    </div>
  );
}

export default SignInPage;

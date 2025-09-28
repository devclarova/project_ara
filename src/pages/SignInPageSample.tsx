import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SignInPageProps {
  onSuccess?: () => void;
}

const SignInPage = ({ onSuccess }: SignInPageProps) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [pw, setPw] = useState<string>('');
  const [msg, setMsg] = useState<string>('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      alert('이메일을 입력하세요.');
      return;
    }
    if (!pw.trim()) {
      alert('비밀번호를 입력하세요.');
      return;
    }

    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email,
    //   password: pw,
    // });

    // if (error) {
    //   setMsg(`로그인 오류 : ${error.message}`);
    // } else {
    //   setMsg('로그인 성공! 🎉');
    //   if (onSuccess) onSuccess();
    // }

    const { error } = await signIn(email, pw);
    if (error) {
      setMsg(`로그인 오류 : ${error}`);
    } else {
      setMsg('로그인 성공');
      // 바로 이동시키기
      console.log('당신은 로그인 성공');
      if (onSuccess) onSuccess(); // 🟢 모달 닫기
      navigate(`/home`);
    }
  };

  return (
    <div>
      <div className="card w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일"
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="비밀번호"
              className="form-input"
              required
            />
          </div>
          <button
            type="submit"
            className="btn bg-primary text-white btn-lg"
            style={{ width: '100%' }}
          >
            로그인
          </button>
        </form>

        {/* 구분선 */}
        <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--space-6)' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--gray-300)' }}></div>
          <span style={{ padding: '0 var(--space-4)', fontSize: '14px' }}>또는</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--gray-300)' }}></div>
        </div>
        <button
          onClick={e => {
            navigate('/signup');
          }}
          className="btn bg-secondary text-white btn-lg"
          style={{ width: '100%' }}
        >
          회원가입
        </button>
      </div>
    </div>
  );
};

export default SignInPage;

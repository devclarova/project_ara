/**
 * 주요기능
 * - 사용자 세션관리
 * - 로그인/회원가입/로그아웃
 * - 사용자 인증 정보 상태 변경 감시
 * - 전역 인증 상태를 컴포넌트에 반영
 */

import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { supabase } from '../lib/supabase';

// 1. 인증 컨텍스트 타입
type AuthContextType = {
  // 현재 사용자의 세션정보 (로그인 상태, 토큰)
  session: Session | null;
  // 현재 로그인 된 사용자 정보
  user: User | null;
  // 회원 가입 함수(이메일, 비밀번호) : 비동기라서
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  // 회원 로그인 함수(이메일, 비밀번호) : 비동기라서
  signIn: (email: string, password: string) => Promise<{ error?: string; unverified?: boolean }>;
  // 회원 로그아웃
  signOut: () => Promise<void>;
};

// 2. 인증 컨텍스트 생성 (인증 기능을 컴포넌트에서 활용하게 해줌.)
const AuthContext = createContext<AuthContextType | null>(null);

async function ensureProfileClient(user: User) {
  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (selErr) {
    console.warn('profiles select error:', selErr.message);
    return;
  }
  if (existing) return;

  // 메타데이터 기반 기본값
  const md = (user as any).user_metadata ?? {}; // Supabase 타입상 user_metadata는 any 유사
  const emailLocal = (user.email || '').split('@')[0] || 'user';
  const nickname = md.nickname || emailLocal;

  // gender는 enum 강제: 'Male' | 'Female' 만 허용
  let gender = md.gender;
  if (gender !== 'Male' && gender !== 'Female') gender = 'Male';

  // 나머지는 테이블 기본값을 사용하므로 최소 필드만 넣자
  const { error: insErr } = await supabase.from('profiles').insert([
    {
      user_id: user.id,
      nickname,
      gender,
      // birthday/country/avatar_url 등은 DB DEFAULT가 있다면 생략
    },
  ]);

  if (insErr) console.warn('profiles insert error:', insErr.message);
}

// 3. 인증 컨텍스트 프로바이더
export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // 현재 사용자 세션
  const [session, setSession] = useState<Session | null>(null);
  // 현재 로그인한 사용자 정보
  const [user, setUser] = useState<User | null>(null);

  // 초기 세션 로드 및 인증 상태 변경 감시
  useEffect(() => {
    // 기존 세션이 있는지 확인
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? data.session : null);
      setUser(data.session?.user ?? null);
    });
    // 인증상태 변경 이벤트를 체크(로그인, 로그아웃, 토큰 갱신 등의 이벤트 실시간 감시)
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });
    // 컴포넌트가 제거되면 이벤트 체크 해제 : cleanUp
    return () => {
      // 이벤트 감시 해제.
      data.subscription.unsubscribe();
    };
  }, []);

  // 회원 가입 함수(이메일, 비밀번호) : 비동기라서
  const signUp: AuthContextType['signUp'] = async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 회원 가입 후 이메일로 인증 확인시 리다이렉트 될 URL
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      return { error: error.message };
    }
    // 우리는 이메일 확인을 활성화 시켰습니다.
    // 이메일 확인 후 인증 전까지는 아무것도 넘어오지 않습니다.
    return {};
  };

  // 회원 로그인 함수(이메일, 비밀번호) : 비동기라서
  const signIn: AuthContextType['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password, options: {} });
    if (error) {
      const msg = (error.message || '').toLowerCase();
      const unverified =
        msg.includes('confirm') || msg.includes('not confirmed') || msg.includes('verify');

      if (unverified) {
        try {
          await supabase.auth.resend({ type: 'signup', email });
        } catch (error) {}
      }
      return { error: error.message };
    }
    try {
      await (supabase as any).rpc('ensure_profile');
    } catch (error) {}
    return {};
  };
  // 회원 로그아웃
  const signOut: AuthContextType['signOut'] = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ signUp, signIn, signOut, user, session }}>
      {children}
    </AuthContext.Provider>
  );
};

// const {signUp, signIn, signOut, user, session} = useAuth()
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('AuthContext 가 없습니다.');
  }
  return ctx;
};

/**
 * 주요기능
 * - 사용자 세션관리
 * - 로그인/회원가입/로그아웃
 * - 사용자 인증 정보 상태 변경 감시
 * - 전역 인증 상태를 컴포넌트에 반영
 *
 * ▼ 추가: 회원가입 플로우 드래프트/검증/가드 (기존 로직은 그대로 유지, 필드만 추가)
 */

import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { supabase } from '../lib/supabase';

// ===== [ADD] 가입 플로우 타입 =====
export type Step = 1 | 2 | 3;
export type ConsentResult = { service: boolean; privacy: boolean; marketing?: boolean };
export type SignUpForm = {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
};
type StepValid = { step1: boolean; step2: boolean; step3: boolean };
const SIGNUP_STORAGE_KEY = 'ara-signup-draft-v1';

// 1. 인증 컨텍스트 타입
type AuthContextType = {
  // 현재 사용자의 세션정보 (로그인 상태, 토큰)
  session: Session | null;
  // 현재 로그인 된 사용자 정보
  user: User | null;
  // 회원 가입 함수(이메일, 비밀번호)
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  // 회원 로그인 함수(이메일, 비밀번호)
  signIn: (email: string, password: string) => Promise<{ error?: string; unverified?: boolean }>;
  // 회원 로그아웃
  signOut: () => Promise<void>;

  // ===== [ADD] 가입 플로우 필드 (추가만 / 기존 사용처 영향 없음) =====
  currentStep: Step;
  setCurrentStep: (s: Step) => void;

  consents: ConsentResult | null;
  setConsents: (c: ConsentResult) => void;

  form: SignUpForm | null;
  setForm: (f: SignUpForm) => void;

  valid: StepValid;
  /** 스텝 이동 가드: from→to 허용 여부 */
  guard: (from: Step, to: Step) => boolean;
};

// 2. 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType | null>(null);

// 3. 인증 컨텍스트 프로바이더
export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // 현재 사용자 세션
  const [session, setSession] = useState<Session | null>(null);
  // 현재 로그인한 사용자 정보
  const [user, setUser] = useState<User | null>(null);

  // ===== [ADD] 가입 플로우 상태 =====
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [consents, setConsentsState] = useState<ConsentResult | null>(null);
  const [form, setFormState] = useState<SignUpForm | null>(null);

  // ===== [ADD] 유효성 =====
  const validateStep1 = (c: ConsentResult | null) => !!(c?.service && c?.privacy);
  const validateStep2 = (f: SignUpForm | null) => {
    if (!f) return false;

    // email, password, passwordConfirm, nickname 중 하나라도 빠졌다면 false 처리
    const emailOk = f.email ? /\S+@\S+\.\S+/.test(f.email) : false;
    const pwOk =
      typeof f.password === 'string' &&
      typeof f.passwordConfirm === 'string' &&
      f.password.length >= 8 &&
      f.password === f.passwordConfirm;
    const nickOk = typeof f.nickname === 'string' && f.nickname.trim().length >= 2;

    return emailOk && pwOk && nickOk;
  };

  const validateStep3 = () => true; // 프로필은 선택사항으로 가정

  const valid = useMemo<StepValid>(
    () => ({
      step1: validateStep1(consents),
      step2: validateStep2(form),
      step3: validateStep3(),
    }),
    [consents, form],
  );

  // ===== [ADD] 드래프트 저장/복원 (새로고침/이동에도 유지) =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIGNUP_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { consents?: ConsentResult; form?: SignUpForm };
      if (parsed.consents) setConsentsState(parsed.consents);
      if (parsed.form) setFormState(parsed.form);
    } catch {}
  }, []);
  const persistDraft = (next: { consents: ConsentResult | null; form: SignUpForm | null }) => {
    try {
      localStorage.setItem(SIGNUP_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };
  const setConsents = (c: ConsentResult) =>
    setConsentsState(prev => {
      const next = { ...(prev ?? ({} as ConsentResult)), ...c };
      persistDraft({ consents: next, form });
      return next;
    });
  const setForm = (f: SignUpForm) =>
    setFormState(prev => {
      const next = { ...(prev ?? ({} as SignUpForm)), ...f };
      persistDraft({ consents, form: next });
      return next;
    });

  // ===== [ADD] 이동 가드 (앞으로 갈 때만 선행 검증 필요) =====
  const guard = (from: Step, to: Step) => {
    if (to > from) {
      if (from === 1 && to >= 2 && !valid.step1) return false;
      if (from === 1 && to >= 3 && (!valid.step1 || !valid.step2)) return false;
      if (from === 2 && to >= 3 && !valid.step2) return false;
    }
    return true; // 뒤로 가기는 허용
  };

  // 초기 세션 로드 및 인증 상태 변경 감시 (기존 그대로)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? data.session : null);
      setUser(data.session?.user ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // 회원 가입 함수(이메일, 비밀번호)
  const signUp: AuthContextType['signUp'] = async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      return { error: error.message };
    }
    return {};
  };

  // 회원 로그인 함수(이메일, 비밀번호)
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
      return { error: error.message, unverified };
    }
    try {
      await supabase.rpc('ensure_profile');
    } catch (error) {}
    return {};
  };

  // 회원 로그아웃
  const signOut: AuthContextType['signOut'] = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        signUp,
        signIn,
        signOut,
        user,
        session,
        // [ADD] 가입 플로우
        currentStep,
        setCurrentStep,
        consents,
        setConsents,
        form,
        setForm,
        valid,
        guard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// const {signUp, signIn, signOut, user, session, ...가입플로우} = useAuth()
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('AuthContext 가 없습니다.');
  }
  return ctx;
};

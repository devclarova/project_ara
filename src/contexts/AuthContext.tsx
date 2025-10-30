import type { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithKakao: () => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const DRAFT_KEY = 'signup-profile-draft';

function readProfileDraftSafe() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function createProfileFromDraftIfMissing(u: User) {
  const { data: exists, error: exErr } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', u.id)
    .maybeSingle();

  if (exErr || exists) return;

  const draft = readProfileDraftSafe();

  const nickname = (draft?.nickname ?? u.email?.split('@')[0] ?? 'user').toString().trim();
  const gender = (draft?.gender ?? 'Male').toString().trim();
  const birthday = (draft?.birthday ?? '2000-01-01').toString().trim(); // YYYY-MM-DD
  const country = (draft?.country ?? 'Unknown').toString().trim();
  const bio = (draft?.bio ?? '').toString().trim() || null;
  const avatar = draft?.pendingAvatarUrl ?? null;

  // ✅ 여기! consents가 아니라 평탄화된 키를 읽도록 변경
  const tos_agreed = !!draft?.tos_agreed;
  const privacy_agreed = !!draft?.privacy_agreed;
  const age_confirmed = !!draft?.age_confirmed;
  const marketing_opt_in = !!draft?.marketing_opt_in;

  const payload = {
    user_id: u.id,
    nickname,
    gender,
    birthday,
    country,
    bio,
    avatar_url: avatar,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_online: false,
    last_active_at: null,
    nickname_normalized: null,
    nickname_script: null,
    nickname_lang: null,
    nickname_set_at: null,
    tos_agreed,
    privacy_agreed,
    age_confirmed,
    marketing_opt_in,
    is_onboarded: true, // 이메일 가입자는 인증까지 끝났다면 온보딩 true로 바로 사용 시작
    is_public: true,
  };

  const { error: pErr } = await supabase.from('profiles').insert(payload);
  if (pErr) {
    console.error('profiles insert error:', pErr);
  } else {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        const u = newSession?.user;
        if (u) void Promise.allSettled([createProfileFromDraftIfMissing(u)]);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthContextType['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signInWithGoogle: AuthContextType['signInWithGoogle'] = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return error ? { error: error.message } : {};
  };

  const signInWithKakao: AuthContextType['signInWithKakao'] = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return error ? { error: error.message } : {};
  };

  const signUp: AuthContextType['signUp'] = async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error?.message };
  };

  const signOut: AuthContextType['signOut'] = async () => {
    const timeout = (ms: number) =>
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('signOut:timeout')), ms));
    try {
      await Promise.race([supabase.auth.signOut(), timeout(3500)]);
    } catch {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {}
    } finally {
      setSession(null);
      setUser(null);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, user, signIn, signUp, signOut, signInWithGoogle, signInWithKakao }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

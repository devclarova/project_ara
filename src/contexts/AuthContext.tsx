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
};

const AuthContext = createContext<AuthContextType | null>(null);
const DRAFT_KEY = 'signup-profile-draft';

async function upsertUsersOnLogin(u: User) {
  try {
    await supabase.from('users').upsert(
      {
        auth_user_id: u.id,
        email: u.email ?? null,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      },
      { onConflict: 'auth_user_id' },
    );
  } catch (e) {
    console.warn('users upsert on login failed:', e);
  }
}

async function createProfileFromDraftIfMissing(u: User) {
  const { data: exists, error: exErr } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', u.id)
    .maybeSingle();

  if (exErr) {
    console.error('profiles exists check error:', exErr);
    return;
  }
  if (exists) return;

  const raw = localStorage.getItem('signup-profile-draft');
  const draft = raw ? JSON.parse(raw) : null;

  const nickname = (draft?.nickname ?? u.email?.split('@')[0] ?? 'user').toString().trim();
  const gender = (draft?.gender ?? 'Male').toString().trim();
  const birthday = (draft?.birthday ?? '2000-01-01').toString().trim();
  const country = (draft?.country ?? 'Unknown').toString().trim();
  const bio = (draft?.bio ?? '').toString().trim() || null; // ✅ bio 포함(옵션)
  const avatar = draft?.pendingAvatarUrl ?? null;

  const payload = {
    user_id: u.id,
    nickname,
    gender,
    birthday,
    country,
    bio, // ✅ 이제 DB에 저장됨
    avatar_url: avatar,
    created_at: new Date().toISOString(),
  };

  const { error: pErr } = await supabase.from('profiles').insert(payload);
  if (pErr) {
    console.error('profiles insert error:', pErr);
    return;
  }

  try {
    localStorage.removeItem('signup-profile-draft');
  } catch {}
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 초기 세션 로드
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
    });

    // 상태 변화 구독
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      const u = newSession?.user ?? null;
      if (!u) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        // 1) users 보정
        await upsertUsersOnLogin(u);
        // 2) profiles 생성(없을 때만)
        await createProfileFromDraftIfMissing(u);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthContextType['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signUp: AuthContextType['signUp'] = async (email, password) => {
    // (팁) 실제 가입은 각 스텝 화면에서 처리하므로 여기선 래퍼만 유지
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

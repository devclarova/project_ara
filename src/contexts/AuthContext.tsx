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

// 로그인 시 users 보정
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

// 프로필 없으면 draft로 생성
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

  const raw = localStorage.getItem(DRAFT_KEY);
  const draft = raw ? JSON.parse(raw) : null;

  const nickname = (draft?.nickname ?? u.email?.split('@')[0] ?? 'user').toString().trim();
  const gender = (draft?.gender ?? 'Male').toString().trim();
  const birthday = (draft?.birthday ?? '2000-01-01').toString().trim();
  const country = (draft?.country ?? 'Unknown').toString().trim();
  const bio = (draft?.bio ?? '').toString().trim() || null;
  const avatar = draft?.pendingAvatarUrl ?? null;

  const payload = {
    user_id: u.id,
    nickname,
    gender,
    birthday,
    country,
    bio,
    avatar_url: avatar,
    created_at: new Date().toISOString(),
  };

  const { error: pErr } = await supabase.from('profiles').insert(payload);
  if (pErr) {
    console.error('profiles insert error:', pErr);
    return;
  }

  try {
    localStorage.removeItem(DRAFT_KEY);
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
      // console.log('[auth] initial session:', !!data.session);
    });

    // 상태 변화 구독 (한 곳에서만 관리)
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      // console.log('[auth:event]', event, 'user=', newSession?.user?.id ?? null);
      // 즉시 UI 반영
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // 콘솔 확인용(필요 시 활성화)
      // console.log('[auth:event]', event, 'user=', newSession?.user?.id);

      // 로그인 관련 보정은 UI를 막지 않도록 비동기로 처리 (await 금지)
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        const u = newSession?.user;
        if (u) {
          void Promise.allSettled([upsertUsersOnLogin(u), createProfileFromDraftIfMissing(u)]);
        }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthContextType['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signUp: AuthContextType['signUp'] = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message };
  };

  const signOut: AuthContextType['signOut'] = async () => {
    // 안전 로그아웃: 서버 타임아웃 시 로컬 폴백
    const timeout = (ms: number) =>
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('signOut:timeout')), ms));

    try {
      await Promise.race([supabase.auth.signOut(), timeout(3500)]);
    } catch (e) {
      console.warn('[logout] signOut timeout → local fallback');
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {}
    } finally {
      // 단일 출처 상태 정리
      setSession(null);
      setUser(null);

      // 앱 내 캐시/로컬 상태 초기화가 필요하면 여기서
      // localStorage.removeItem('...'); queryClient.clear(); 등
    }
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

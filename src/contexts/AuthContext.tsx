import type { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { isBanned as checkIsBanned } from '@/utils/banUtils';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithKakao: () => Promise<{ error?: string }>;
  bannedUntil: string | null;
  isBanned: boolean;
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
  const provider = (u.app_metadata?.provider as string | undefined) ?? 'email';

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

  // consents가 아니라 평탄화된 키를 읽도록 변경
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
    // nickname_normalized: null,
    // nickname_script: null,
    // nickname_lang: null,
    // nickname_set_at: null,
    tos_agreed,
    privacy_agreed,
    age_confirmed,
    marketing_opt_in,
    is_onboarded: provider === 'email',
    is_public: true,
  };

  const { error: pErr } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id', ignoreDuplicates: true });
  if (pErr) {
    console.error('profiles insert error:', pErr);
  } else {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }
}

import RestoreAccountModal from '@/components/auth/RestoreAccountModal';
import { differenceInDays, parseISO, addYears } from 'date-fns';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  
  // 복구 대상 유저 상태 (deleted_at이 있는 유저)
  // { id: string, deletedAt: string } 형태
  const [restoreUser, setRestoreUser] = useState<{ id: string; deletedAt: string } | null>(null);
  
  // 제재 상태
  const [bannedUntil, setBannedUntil] = useState<string | null>(null);
  const [isBannedState, setIsBannedState] = useState(false);

  // 계정 삭제 상태 확인 함수
  const checkAccountStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('deleted_at, banned_until')
      .eq('user_id', userId)
      .single();

    if (error || !data) return;

    if (data.deleted_at) {
      const deletedAt = new Date(data.deleted_at);
      const now = new Date();
      const diff = differenceInDays(now, deletedAt);

      if (diff > 7) {
         // 7일 경과 시 -> 강제 로그아웃 (복구 불가)
         alert(t('auth.account_restore_expired', '탈퇴 신청 후 7일이 경과하여 계정을 복구할 수 없습니다.'));
         await supabase.auth.signOut();
         setSession(null);
         setUser(null);
      } else {
         // 7일 이내 -> 복구 모달 표시
         setRestoreUser({ id: userId, deletedAt: data.deleted_at });
      }
    }
    
    // 제재 상태 확인
    if (data.banned_until) {
      const bannedDate = new Date(data.banned_until);
      const now = new Date();
      // 영구 제재 기준 (50년)
      const isPermanent = bannedDate > addYears(now, 50);

      if (isPermanent) {
        alert(t('auth.permanent_ban_alert', '해당 계정은 영구 정지되었습니다.'));
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        return;
      }

      setBannedUntil(data.banned_until);
      setIsBannedState(checkIsBanned(data.banned_until));
    } else {
      setBannedUntil(null);
      setIsBannedState(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1) 초기 세션
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
      
      // 초기 진입 시 삭제 여부 체크
      if (data.session?.user) {
        checkAccountStatus(data.session.user.id);
      }
    });

    // 2) 세션 변동 구독
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        const u = newSession?.user;
        if (u) {
          // 로그인 시 게스트 번역 카운트 초기화
          if (event === 'SIGNED_IN') {
            try {
              localStorage.removeItem('guest-translation-count');
            } catch {}
          }

          // 계정 삭제 상태 체크
          checkAccountStatus(u.id);

          const provider = (u.app_metadata?.provider as string | undefined) ?? 'email';
          if (provider === 'email') {
            void Promise.allSettled([createProfileFromDraftIfMissing(u)]);
          }
        }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
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

    // 로그아웃 전 명시적으로 오프라인 상태 설정 (실시간 반영 위함)
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ 
            is_online: false,
            last_active_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        // Give a small moment for the DB update to propagate (though await should be enough)
      } catch (err) {
        console.error('Logout status update failed:', err);
      }
    }

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

  // 계정 복구 처리 함수
  const handleRestore = async () => {
    if (!restoreUser) return;
    
    // 복구 로직: deleted_at을 NULL로 초기화
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: null })
      .eq('user_id', restoreUser.id);

    if (error) {
      console.error('Failed to restore account:', error);
      alert(t('auth.restore_error', '계정 복구 중 오류가 발생했습니다.'));
      return;
    }

    // 복구 성공 시 모달 닫기
    setRestoreUser(null);
    // 세션 정보를 최신으로 갱신하지 않아도 로컬 상태는 유지되지만,
    // 필요하다면 setUser 등 업데이트 (여기선 불필요, 이미 session은 유효함)
  };

  const handleCancelRestore = async () => {
    setRestoreUser(null);
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user, loading, signIn, signUp, signOut, signInWithGoogle, signInWithKakao, bannedUntil, isBanned: isBannedState }}
    >
      {children}
      {/* 계정 복구 모달: restoreUser 상태가 있을 때만 노출 */}
      <RestoreAccountModal
        isOpen={!!restoreUser}
        onRestore={handleRestore}
        onCancel={handleCancelRestore}
        daysRemaining={restoreUser ? 7 - differenceInDays(new Date(), parseISO(restoreUser.deletedAt)) : 0}
      />
    </AuthContext.Provider>
  );
}
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

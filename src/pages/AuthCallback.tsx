import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Timer as TimerIcon } from 'lucide-react';

const DRAFT_KEY = 'signup-profile-draft';

// 안전한 로컬 드래프트 읽기
function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 이메일 인증 직후(세션 보유 시점)에만 사용:
 * - 존재하지 않으면 draft 기반으로 profiles 생성
 * - 생성 성공 시 draft 제거
 * - 이메일 플로우는 is_onboarded=true로 마무리(첫 로그인에서 바로 /social)
 */
async function ensureProfileFromDraft(uid: string, email?: string | null) {
  // 이미 존재하면 no-op
  const { count, error: exErr } = await supabase
    .from('profiles')
    .select('user_id', { count: 'exact', head: true })
    .eq('user_id', uid);
  if (!exErr && (count ?? 0) > 0) return;

  const draft = readDraft();

  const nickname =
    (draft?.nickname ?? (email && email.includes('@') ? email.split('@')[0] : '') ?? 'user')
      ?.toString()
      .trim() || 'user';

  // ✅ 동의값 매핑: 옛 키/새 키 모두 흡수
  const tos_agreed = !!(draft?.tos_agreed ?? draft?.terms);
  const privacy_agreed = !!(draft?.privacy_agreed ?? draft?.privacy);
  const age_confirmed = !!(draft?.age_confirmed ?? draft?.age_ok);
  const marketing_opt_in = !!(draft?.marketing_opt_in ?? draft?.marketing_agreed);

  // ✅ [2] 생년 검증(14세 이상 여부)
  const birth = new Date((draft?.birthday ?? '2000-01-01').toString().trim());
  const today = new Date();
  const age =
    today.getFullYear() -
    birth.getFullYear() -
    (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
  const isAge14Plus = age >= 14;

  // ✅ 온보딩 완료는 '필수 동의'가 모두 true일 때만
  const canOnboard = tos_agreed && privacy_agreed && age_confirmed;

  const payload = {
    user_id: uid,
    nickname,
    gender: (draft?.gender ?? 'Male').toString().trim(),
    birthday: (draft?.birthday ?? '2000-01-01').toString().trim(), // YYYY-MM-DD
    country: (draft?.country ?? 'Unknown').toString().trim(),
    bio: (draft?.bio ?? '').toString().trim() || null,
    avatar_url: draft?.pendingAvatarUrl ?? null,
    tos_agreed,
    privacy_agreed,
    age_confirmed,
    marketing_opt_in,
    // ⚠️ 체크 제약 충족 시에만 true
    is_onboarded: canOnboard,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' });
  if (!error) {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }
}

async function createProfileShellIfMissing(uid: string) {
  const { count, error: exErr } = await supabase
    .from('profiles')
    .select('user_id', { count: 'exact', head: true })
    .eq('user_id', uid);
  if (!exErr && (count ?? 0) > 0) return;

  // ✅ 스키마 제약( NOT NULL / CHECK ) 을 통과할 최소 기본값
  const payload = {
    user_id: uid,
    nickname: `user_${uid.slice(0, 8)}`,
    gender: 'Male', // enum이면 허용값과 대소문자 정확히 일치해야 합니다
    birthday: '2000-01-01', // YYYY-MM-DD
    country: 'Unknown',
    bio: null,
    avatar_url: null,
    tos_agreed: false,
    privacy_agreed: false,
    age_confirmed: false,
    marketing_opt_in: false,
    is_onboarded: false, // 소셜은 온보딩 페이지에서 true로 업데이트
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' });
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('인증 처리 중 ...');

  // setTimeout 반환형 number로 고정
  const redirectTimerRef = useRef<number | null>(null);
  const ranRef = useRef(false);

  const scheduleRedirect = (path: string, delay = 600, state?: any) => {
    if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    redirectTimerRef.current = window.setTimeout(() => {
      navigate(path, { replace: true, state });
    }, delay);
  };

  useEffect(() => {
    (async () => {
      const href = window.location.href;
      const hasCode = href.includes('code=');
      const hasHashToken = href.includes('#access_token=');

      if (!hasCode && !hasHashToken) {
        navigate('/signin', { replace: true });
        return;
      }

      // ✅ SDK가 자동으로 URL을 파싱(detectSessionInUrl: true). 잠깐 대기하면서 세션 생성 기다림.
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) break;
        await new Promise(r => setTimeout(r, 100));
      }

      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (!u) {
        navigate('/signin', { replace: true });
        return;
      }

      const provider = (u.app_metadata?.provider as string | undefined) ?? 'email';

      if (provider === 'email') {
        try {
          await ensureProfileFromDraft(u.id, u.email);
        } catch {}

        // ✅ 이메일 인증 링크로 들어온 세션을 즉시 끊고
        await supabase.auth.signOut({ scope: 'local' });

        // ✅ 로그인 페이지로 이동하면서 "인증 완료 모달"을 띄울 수 있도록 신호를 전달
        navigate('/signin', { replace: true, state: { emailVerified: true } });

        return;
      }

      // try {
      //   await supabase.rpc('ensure_app_user');
      // } catch {}
      // await supabase
      //   .from('profiles')
      //   .upsert({ user_id: u.id }, { onConflict: 'user_id', ignoreDuplicates: true });

      try {
        await createProfileShellIfMissing(u.id);
      } catch {
        // no-op: 실패해도 온보딩에서 다시 update 시도됨
      }

      navigate('/signup/social', { replace: true, state: { from: 'oauth' } });
    })().finally(() => {
      // ✅ 세션 처리 후에 URL 정리
      window.history.replaceState({}, document.title, '/auth/callback');
    });
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3">
        <TimerIcon className="w-6 h-6 animate-pulse" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold mb-2">인증 페이지</h2>
      <div className="text-gray-600">{msg}</div>
    </div>
  );
}

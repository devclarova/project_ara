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
async function ensureProfileFromDraft(userId: string, email?: string | null) {
  // 이미 존재하면 no-op
  const { data: exists, error: exErr } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (exErr || exists) return;

  const draft = readDraft();

  const nickname =
    (draft?.nickname ?? (email && email.includes('@') ? email.split('@')[0] : '') ?? 'user')
      ?.toString()
      .trim() || 'user';

  const payload = {
    user_id: userId,
    nickname,
    gender: (draft?.gender ?? 'Male').toString().trim(),
    birthday: (draft?.birthday ?? '2000-01-01').toString().trim(), // YYYY-MM-DD
    country: (draft?.country ?? 'Unknown').toString().trim(),
    bio: (draft?.bio ?? '').toString().trim() || null,
    avatar_url: draft?.pendingAvatarUrl ?? null,
    tos_agreed: !!draft?.tos_agreed,
    privacy_agreed: !!draft?.privacy_agreed,
    age_confirmed: !!draft?.age_confirmed,
    marketing_opt_in: !!draft?.marketing_opt_in,
    is_onboarded: true, // 이메일은 인증 완료 시 온보딩 종료
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').insert(payload);
  if (!error) {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }
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
    if (ranRef.current) return;
    ranRef.current = true;

    const current = new URL(window.location.href);
    const code = current.searchParams.get('code');
    const error =
      current.searchParams.get('error_description') || current.searchParams.get('error');

    // URL 정리
    if (current.search) {
      const clean = `${current.pathname}${current.hash || ''}`;
      window.history.replaceState({}, document.title, clean);
    }

    if (!code && !error) {
      setMsg('콜백 페이지에 직접 접근하셨습니다. 로그인 페이지로 이동합니다...');
      scheduleRedirect('/signin', 600);
      return () => {
        if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
      };
    }

    let innerTimer: number | null = null;

    (async () => {
      try {
        if (error) {
          setMsg(`인증/로그인 실패: ${decodeURIComponent(error)}`);
          return;
        }

        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exErr) {
            setMsg(`소셜 로그인 처리 실패: ${exErr.message}`);
            return;
          }

          const { data } = await supabase.auth.getSession();
          const u = data.session?.user ?? null;
          const provider = (u?.app_metadata?.provider as string | undefined) ?? 'email';

          // ✅ 이메일 인증 콜백: 여기서 프로필을 먼저 보장하고 signOut → /signin
          if (provider === 'email') {
            if (u?.id) {
              try {
                await ensureProfileFromDraft(u.id, u.email);
              } catch {}
            }
            setMsg('이메일 인증이 완료되었습니다. 로그인 페이지로 이동해 로그인해주세요.');
            await supabase.auth.signOut();
            innerTimer = window.setTimeout(() => navigate('/signin', { replace: true }), 1000);
            return;
          }

          // 소셜(OAuth) 콜백: 최소 user_id upsert만 하고 /signup으로 연결 (프로필 세부는 가입 단계에서)
          if (u?.id) {
            try {
              await supabase.rpc('ensure_app_user');
            } catch {}
            await supabase.from('profiles').upsert({ user_id: u.id }, { onConflict: 'user_id' });
          }

          setMsg('소셜 로그인 처리 완료! 회원가입을 이어서 진행합니다...');
          innerTimer = window.setTimeout(() => {
            navigate('/signup', { replace: true, state: { from: 'oauth' } });
          }, 600);
          return;
        }

        // code가 없고 error도 없을 때의 보수 처리
        setMsg('이메일 인증이 완료되었습니다. 로그인 페이지로 이동해 로그인해주세요.');
        await supabase.auth.signOut();
        innerTimer = window.setTimeout(() => navigate('/signin', { replace: true }), 1200);
      } catch (e: any) {
        setMsg(`처리 중 오류가 발생했습니다: ${e?.message ?? 'unknown error'}`);
      }
    })();

    return () => {
      if (innerTimer) window.clearTimeout(innerTimer);
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
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

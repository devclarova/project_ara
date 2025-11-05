import { supabase } from '@/lib/supabase';
import { Timer as TimerIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  // 동의값 매핑: 옛 키/새 키 모두 흡수
  const tos_agreed = !!(draft?.tos_agreed ?? draft?.terms);
  const privacy_agreed = !!(draft?.privacy_agreed ?? draft?.privacy);
  const age_confirmed = !!(draft?.age_confirmed ?? draft?.age_ok);
  const marketing_opt_in = !!(draft?.marketing_opt_in ?? draft?.marketing_agreed);

  // [2] 생년 검증(14세 이상 여부)
  const birth = new Date((draft?.birthday ?? '2000-01-01').toString().trim());
  const today = new Date();
  const age =
    today.getFullYear() -
    birth.getFullYear() -
    (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
  const isAge14Plus = age >= 14;

  // 온보딩 완료는 '필수 동의'가 모두 true일 때만
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
    // 체크 제약 충족 시에만 true
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

  // 스키마 제약( NOT NULL / CHECK ) 을 통과할 최소 기본값
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

  // 중복 실행 방지
  const ranRef = useRef(false);

  // setTimeout 반환형 number로 고정
  const redirectTimerRef = useRef<number | null>(null);

  const scheduleRedirect = (path: string, delay = 600, state?: any) => {
    if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    redirectTimerRef.current = window.setTimeout(() => {
      navigate(path, { replace: true, state });
    }, delay);
  };

  useEffect(() => {
    // 이미 실행됐으면 스킵
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      const href = window.location.href;

      const hasCode = href.includes('code=');
      const hasHashToken = href.includes('#access_token=');
      const hasTokenHash = href.includes('token_hash=');

      // auth 파라미터 없으면 즉시 signin으로
      if (!hasCode && !hasHashToken && !hasTokenHash) {
        navigate('/signin', { replace: true });
        return;
      }

      // 세션 대기 (최대 2초)
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) break;
        await new Promise(r => setTimeout(r, 100));
      }

      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;

      // 세션 없으면 무조건 /signin (이메일 인증 완료 케이스)
      if (!u) {
        navigate('/signin', { replace: true, state: { emailVerified: true } });
        return;
      }

      const provider = (u.app_metadata?.provider as string | undefined) ?? 'email';

      if (provider === 'email') {
        // 이메일: 프로필 생성 → 로그아웃 → /signin
        try {
          await ensureProfileFromDraft(u.id, u.email);
        } catch (e) {
          console.warn('[AuthCallback] ensureProfileFromDraft error', e);
        }

        try {
          await supabase.auth.signOut();
        } catch {}

        // 즉시 signin으로 이동 (finalhome 거치지 않음)
        navigate('/signin', { replace: true, state: { emailVerified: true } });
        return;
      }

      // 소셜: 프로필 셸 생성 → /signup/social
      try {
        await createProfileShellIfMissing(u.id);
      } catch (e) {
        console.warn('[AuthCallback] createProfileShellIfMissing error', e);
      }

      navigate('/signup/social', { replace: true, state: { from: 'oauth' } });
    })();
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

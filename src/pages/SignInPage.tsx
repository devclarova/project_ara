import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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
 * 이메일 로그인 직후에도 한 번 더 보장:
 * - 존재하지 않으면 draft 기반으로 profiles 생성 (is_onboarded=true)
 * - 생성 성공 시 draft 제거
 * - 이미 존재하면 no-op
 */
async function ensureProfileFromDraftAfterSignIn(userId: string, email?: string | null) {
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
    birthday: (draft?.birthday ?? '2000-01-01').toString().trim(),
    country: (draft?.country ?? 'Unknown').toString().trim(),
    bio: (draft?.bio ?? '').toString().trim() || null,
    avatar_url: draft?.pendingAvatarUrl ?? null,
    tos_agreed: !!draft?.tos_agreed,
    privacy_agreed: !!draft?.privacy_agreed,
    age_confirmed: !!draft?.age_confirmed,
    marketing_opt_in: !!draft?.marketing_opt_in,
    is_onboarded: true, // 이메일은 인증 마치고 로그인했으므로 온보딩 true
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

/** 로그인 성공 후 라우팅 분기
 * - 프로필 존재 & is_onboarded=true → /social
 * - 그 외 → /signup (소셜은 콜백에서 이동, 이메일은 여기서 이미 보장됨)
 */
async function postSignInRoute(navigate: ReturnType<typeof useNavigate>) {
  // 세션/유저 확보
  const { data } = await supabase.auth.getSession();
  const u = data.session?.user;
  if (!u) {
    navigate('/signin', { replace: true });
    return;
  }

  // 로그인 제공자 확인
  const provider = (u.app_metadata?.provider as string | undefined) ?? 'email';

  if (provider === 'email') {
    // 이메일은 인증이 끝나야 로그인 성공하므로, 바로 홈
    navigate('/finalhome', { replace: true });
    return;
  }

  // 소셜: 온보딩 여부로 분기
  const { data: prof, error } = await supabase
    .from('profiles')
    .select('user_id,is_onboarded')
    .eq('user_id', u.id)
    .maybeSingle();

  if (error) {
    console.warn('[signin route] profiles select error:', error.message);
    navigate('/finalhome', { replace: true });
    return;
  }

  if (prof?.is_onboarded) {
    navigate('/finalhome', { replace: true });
  } else {
    navigate('/signup', { replace: true, state: { from: 'oauth' } });
  }
}

function SignInPage() {
  const { signIn, session, signInWithGoogle, signInWithKakao } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [pw, setPw] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; pw?: string }>({});
  const navigate = useNavigate();
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [suppressEffects, setSuppressEffects] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (session) {
      (async () => {
        const provider = (session.user.app_metadata?.provider as string | undefined) ?? 'email';
        if (provider !== 'email') {
          navigate('/signup/social', { replace: true });
          return;
        }
        const uid = session.user.id;
        const { count } = await supabase
          .from('profiles')
          .select('user_id', { head: true, count: 'exact' })
          .eq('user_id', uid);
        navigate(count ? '/finalhome' : '/signup', { replace: true });
      })();
    }
  }, [loading, session, navigate]);

  const handleChange = (field: 'email' | 'pw', value: string) => {
    setSuppressEffects(false);

    if (field === 'email') {
      setEmail(value);
      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
    } else {
      setPw(value);
      if (errors.pw) setErrors(prev => ({ ...prev, pw: '' }));
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resend({ type: 'signup', email: normalizedEmail });
    setResendMsg(error ? error.message : '인증 메일이 발송되었습니다. 이메일을 확인해주세요.');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setMsg('');
    setNotConfirmed(false);
    setLoading(true);
    setErrors({});
    setSuppressEffects(false);

    // 입력 정규화
    const normalizedEmail = email.trim().toLowerCase();
    const pwValue = pw;

    // 필수 체크
    if (!normalizedEmail || !pwValue) {
      setErrors({
        email: !normalizedEmail ? '이메일을 입력해주세요.' : '',
        pw: !pwValue ? '패스워드를 입력해주세요.' : '',
      });
      setLoading(false);
      return;
    }

    // 로그인 시도(직접 호출; useAuth.signIn 사용해도 무방)
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: pwValue,
    });

    if (error) {
      const status = (error as { status?: number }).status ?? 0;
      const raw = error.message ?? '';
      const low = raw.toLowerCase();

      // 미인증
      const isUnverified =
        low.includes('email not confirmed') ||
        low === 'not confirmed' ||
        (status === 400 && low.includes('not confirmed'));

      if (isUnverified) {
        setNotConfirmed(true);
        try {
          await supabase.auth.resend({ type: 'signup', email: normalizedEmail });
        } catch {}
        setErrors(prev => ({
          ...prev,
          email: '이메일 인증 실패, 이메일을 확인해주세요.',
          pw: '',
        }));
        setMsg('로그인 전 이메일 인증을 해주세요.');
        setLoading(false);
        return;
      }

      // 자격 증명 오류
      const isInvalidCred =
        status === 400 ||
        low.includes('invalid login') ||
        low.includes('invalid credentials') ||
        low.includes('invalid email or password') ||
        low.includes('invalid password') ||
        low.includes('invalid email') ||
        low.includes('invalid_grant');

      if (isInvalidCred) {
        setErrors(prev => ({ ...prev, email: '', pw: '' }));
        setMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
        setSuppressEffects(false);
        setLoading(false);
        return;
      }

      // 기타 오류
      setMsg(raw || '알 수 없는 오류로 인해 로그인에 실패했습니다.');
      setLoading(false);
      return;
    }

    // 성공 → 프로필/온보딩 상태에 따라 분기 (프로필 먼저 보장)
    try {
      await postSignInRoute(navigate);
    } catch (e) {
      console.warn('[signin route] fallback social:', (e as any)?.message);
      navigate('/social', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-white pt-12 px-4 dark:bg-gray-800">
      <div className="bg-white dark:bg-secondary rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 lg:p-12 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        {/* 로고 및 제목 */}
        <div className="text-center mb-6">
          <span className="flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-bold text-red-400">
            <img
              src="/images/sample_font_logo.png"
              alt="Ara"
              className="mx-auto w-24 sm:w-28 md:w-32 lg:w-30 xl:w-36"
            />
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            아라에 오신 것을 환영합니다!
          </h2>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder=" "
              className={`peer w-full px-4 py-2 border bg-white dark:bg-secondary text-gray-800 dark:text-gray-100 text-sm ara-rounded
                ${errors.email ? 'ara-focus--error' : 'ara-focus'}
                ${errors.email ? '' : 'border-gray-300'}`}
            />
            <label
              htmlFor="email"
              className={`absolute left-4 text-sm transition-all dark:text-gray-400 dark:bg-secondary
                ${email || errors.email ? '-top-3 text-sm' : 'top-2.5 text-gray-400 text-sm'}
                ${errors.email ? 'text-red-500' : 'peer-focus:text-[#00BFA5]'}
                peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400
                peer-focus:-top-3 peer-focus:text-sm peer-focus:text-[#00BFA5]
                bg-white px-1`}
            >
              Email
            </label>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 ml-2 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type="password"
              id="password"
              value={pw}
              onChange={e => handleChange('pw', e.target.value)}
              placeholder=" "
              className={`peer w-full px-4 py-2 border bg-white dark:bg-secondary text-gray-800 dark:text-gray-100 text-sm ara-rounded
                ${errors.pw ? 'ara-focus--error' : 'ara-focus'}
                ${errors.pw ? '' : 'border-gray-300'}`}
            />
            <label
              htmlFor="password"
              className={`absolute left-4 text-sm transition-all dark:text-gray-400 dark:bg-secondary
                ${pw || errors.pw ? '-top-3 text-sm' : 'top-2.5 text-gray-400 text-sm'}
                ${errors.pw ? 'text-red-500' : 'peer-focus:text-[#00BFA5]'}
                peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400
                peer-focus:-top-3 peer-focus:text-sm peer-focus:text-[#00BFA5]
                bg-white px-1`}
            >
              Password
            </label>
            {errors.pw && (
              <p className="text-red-500 text-xs mt-1 ml-2 dark:text-red-400">{errors.pw}</p>
            )}
          </div>

          {msg && (
            <p className="my-4 text-center text-red-400 dark:text-red-300 text-sm sm:text-base">
              {msg}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 sm:py-3 rounded-xl font-semibold hover:opacity-80 text-sm sm:text-base disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 flex flex-row items-center justify-between gap-2 px-3 flex-wrap">
          {/* 자동 로그인 체크박스 (CheckboxSquare 스타일 적용, UI 전용) */}
          <label
            htmlFor="remember"
            className="flex items-center gap-3 cursor-pointer select-none"
            style={
              {
                '--ara-checkbox-bg': 'var(--ara-surface, #ffffff)',
                '--ara-checkbox-border': 'var(--ara-border, #d1d5db)',
                '--ara-checkbox-ring': 'var(--ara-ring, rgba(0,191,165,.3))',
                '--ara-checkbox-check': 'var(--ara-ink, #111111)',
              } as React.CSSProperties
            }
          >
            {/* 시각용 상태만 토글 — 비즈니스 로직 영향 없음 */}
            <input
              id="remember"
              type="checkbox"
              className="sr-only"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <span
              className="w-5 h-5 rounded-[6px] border grid place-items-center
               bg-[var(--ara-checkbox-bg)] border-[var(--ara-checkbox-border)]
               outline-none ring-0 focus-visible:ring-2"
              tabIndex={-1}
              aria-hidden="true"
            >
              {/* 체크 상태에 따라 아이콘 투명도만 변경 */}
              <svg
                className={`w-4 h-4 transition-opacity duration-150 ${remember ? 'opacity-100' : 'opacity-0'}`}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M5 10.5l3 3 7-7"
                  stroke="var(--ara-checkbox-check)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-100">자동 로그인</span>
          </label>

          {/* 이메일/비밀번호 찾기 (그대로 유지) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary underline-offset-2 hover:underline"
              aria-label="이메일 찾기"
            >
              이메일 찾기
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary underline-offset-2 hover:underline"
              aria-label="비밀번호 찾기"
            >
              비밀번호 찾기
            </button>
          </div>
        </div>

        {notConfirmed && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleResend}
              className="text-primary underline hover:opacity-80"
            >
              인증 메일 재발송
            </button>
            {resendMsg && <p className="mt-2 text-sm text-gray-600">{resendMsg}</p>}
          </div>
        )}

        <p className="mt-4 text-center text-sm sm:text-base text-gray-500 dark:text-gray-400">
          처음 오시나요? 계정을 생성해보세요.{' '}
          <span
            onClick={() => navigate('/signup')}
            className="text-primary font-medium cursor-pointer"
          >
            회원가입
          </span>
        </p>

        <div className="mt-4 flex items-center">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-2 text-gray-400 dark:text-gray-100 text-sm sm:text-base">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <div className="mt-4 space-y-2 flex flex-col gap-3">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-solid border-gray-300 rounded-xl py-2 sm:py-3 text-sm sm:text-base font-medium text-black bg-[#fff] hover:bg-gray-50 transition-opacity dark:hover:opacity-70"
            onClick={signInWithGoogle}
          >
            <img src="/images/google_logo.png" alt="Sign in with Google" className="w-5 h-5" />
            <span>Google 로그인</span>
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-2 sm:py-3 text-sm sm:text-base font-medium text-black bg-[#FEE500] hover:opacity-80 transition-opacity"
            onClick={signInWithKakao}
          >
            <img src="/images/kakao_logo.png" alt="Sign in with Kakao" className="w-5 h-5" />
            <span>카카오 로그인</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;

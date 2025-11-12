import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import SignUpStep1Consent from '@/components/auth/SignUpStep1Consent';
import SignUpStep2Form, { type FormData } from '@/components/auth/SignUpStep2Form';
import SignUpStep3Profile from '@/components/auth/SignUpStep3Profile';
import SignUpStepper from '@/components/auth/SignUpStepper';
import StepCard from '@/components/auth/StepCard';
import type { ConsentResult } from '@/types/consent';
import type { Step, Verified } from '@/types/signup';
import { slideVariants } from '@/utils/motion';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpWizard({ mode = 'social' }: { mode?: 'social' }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [dir, setDir] = useState<'forward' | 'backward'>('forward');

  // 세션 확인 + 이미 온보딩된 경우 튕겨내기 (이중 안전장치)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (!u) {
        navigate('/signin', { replace: true });
        return;
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('is_onboarded')
        .eq('user_id', u.id)
        .maybeSingle();
      if (prof?.is_onboarded) navigate('/finalhome', { replace: true });
    })();
  }, [navigate]);

  const [step, setStep] = useState<Step>(1);
  const [consents, setConsents] = useState<ConsentResult | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [profileDraft, setProfileDraft] = useState<{
    bio: string;
    file: File | null;
    preview: string | null;
  }>({ bio: '', file: null, preview: null });
  const [verified, setVerified] = useState<Verified>({
    email: { value: '', ok: true }, // 소셜: 이메일 자동 OK
    nickname: { value: '', ok: false },
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const handleSkipSocial = async () => {
    try {
      await signOut();
    } catch {}
    navigate('/', { replace: true });
  };

  // 이탈 경고 (첫 제출 전)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (step < 3) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [step]);

  const consentOK = !!(consents?.terms && consents?.privacy && consents?.age);
  const formOK = useMemo(() => {
    if (!form) return false;
    const emailOk = /\S+@\S+\.\S+/.test(form.email || '');
    const nickOk = typeof form.nickname === 'string' && form.nickname.trim().length >= 2;
    const genderOk = !!form.gender;
    const birthOk = !!form.birth;
    const countryOk = !!form.country;
    return emailOk && nickOk && genderOk && birthOk && countryOk;
  }, [form]);

  const invalidateIfChanged = (nextEmail: string, nextNickname: string) => {
    setVerified(v => ({
      email: { value: nextEmail, ok: true }, // 소셜: 항상 ok
      nickname: { value: nextNickname, ok: v.nickname.ok && v.nickname.value === nextNickname },
    }));
  };

  const guard = (from: Step, to: Step) => {
    if (from === 1 && to > 1 && !consentOK) return false;
    if (from === 2 && to > 2 && (!form || !formOK)) {
      setSubmitAttempted(true);
      return false;
    }
    return true;
  };

  const goTo = (next: Step) =>
    setStep(prev => {
      if (!guard(prev, next)) return prev;
      // 이동 직전에 방향 결정
      setDir(next > prev ? 'forward' : 'backward');
      return next;
    });
  const next = () => goTo(step === 1 ? 2 : 3);
  const back = () => goTo(step === 3 ? 2 : 1);

  return (
    <div className="min-h-auto mt-4 w-full bg-white dark:bg-black flex justify-center items-start pt-5 sm:pt-7 pb-4 overflow-y-auto">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-3 sm:mb-4">
          소셜 회원가입
        </h1>

        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={handleSkipSocial}
            className="rounded-lg px-3 py-1.5 text-sm font-medium border border-black/10 dark:border-white/10
               text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            다음에 하기
          </button>
        </div>

        <div className="mb-3 sm:mb-4">
          <SignUpStepper current={step} onStepChange={goTo} guard={guard} />
        </div>

        <StepCard>
          <motion.div className="overflow-x-hidden">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              {step === 1 && (
                <motion.section
                  key="s1"
                  custom={1}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <SignUpStep1Consent
                    value={consents ?? undefined}
                    onChange={setConsents}
                    onNext={c => {
                      setConsents(c);
                      goTo(2);
                    }}
                  />
                </motion.section>
              )}

              {step === 2 && (
                <motion.section
                  key="s2"
                  custom={dir}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <SignUpStep2Form
                    value={form ?? undefined}
                    verified={verified}
                    submitAttempted={submitAttempted}
                    onInvalidateByChange={(e, n) => invalidateIfChanged(e, n)}
                    onDupChecked={(which, value, ok) =>
                      setVerified(v => ({ ...v, [which]: { value, ok } }))
                    }
                    onChange={setForm}
                    onNext={d => {
                      setForm(d);
                      setSubmitAttempted(true);
                      goTo(3);
                    }}
                    onBack={back}
                    signupKind="social"
                  />
                </motion.section>
              )}

              {step === 3 && form && (
                <motion.section
                  key="s3"
                  custom={dir}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <SignUpStep3Profile
                    email={form.email}
                    pw="__SOCIAL__"
                    nickname={form.nickname}
                    gender={form.gender}
                    birth={form.birth}
                    country={form.country}
                    consents={consents ?? undefined}
                    onBack={back}
                    onDone={() => {
                      /* 완료 시 행동은 컴포넌트 내에서 navigate 처리 */
                    }}
                    draft={profileDraft}
                    onChangeDraft={setProfileDraft}
                    signupKind="social" // ✅ 핵심
                  />
                </motion.section>
              )}
            </AnimatePresence>
          </motion.div>
        </StepCard>
      </div>
    </div>
  );
}

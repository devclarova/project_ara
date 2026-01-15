import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Home, X } from 'lucide-react';

import SignUpStep1Consent from '@/components/auth/SignUpStep1Consent';
import SignUpStep2Form, { type FormData } from '@/components/auth/SignUpStep2Form';
import SignUpStep3Profile from '@/components/auth/SignUpStep3Profile';
import SignUpStepper from '@/components/auth/SignUpStepper';
import StepCard from '@/components/auth/StepCard';

import { useSignupKind } from '@/hooks/useSignupKind';
import { buildGuard, useSignupStepper } from '@/hooks/useSignupStepper';

import type { ConsentResult } from '@/types/consent';
import type { Step, Verified } from '@/types/signup';
import { slideVariants } from '@/utils/motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export default function SignUpPage() {
  const { t } = useTranslation();
  const { step, setStep, prevStepRef, direction, guardedSetStep } = useSignupStepper(1);

  const [consents, setConsents] = useState<ConsentResult | null>(null);
  const [form, setForm] = useState<FormData | null>(null);

  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [profileDraft, setProfileDraft] = useState<{
    bio: string;
    file: File | null;
    preview: string | null;
  }>({ bio: '', file: null, preview: null });

  const [verified, setVerified] = useState<Verified>({
    email: { value: '', ok: false },
    nickname: { value: '', ok: false },
  });

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const signupKind = useSignupKind();

  const consentOK = !!(consents?.terms && consents?.privacy && consents?.age);

  const formOK = useMemo(() => {
    if (!form) return false;
    const emailOk = /\S+@\S+\.\S+/.test(form.email || '');
    const pwOk =
      signupKind === 'social'
        ? true
        : typeof form.pw === 'string' && form.pw.length >= 8 && form.pw === (form.confirmPw || '');
    const nickOk = typeof form.nickname === 'string' && form.nickname.trim().length >= 2;
    const genderOk = !!form.gender;
    const birthOk = !!form.birth;
    const countryOk = !!form.country;
    return emailOk && pwOk && nickOk && genderOk && birthOk && countryOk;
  }, [form, signupKind]);

  const invalidateIfChanged = (nextEmail: string, nextNickname: string) => {
    setVerified(v => ({
      email: { value: nextEmail, ok: v.email.ok && v.email.value === nextEmail },
      nickname: { value: nextNickname, ok: v.nickname.ok && v.nickname.value === nextNickname },
    }));
  };

  const handleGoHome = () => {
    // 이메일 가입: 홈(랜딩)으로 보냄 (로그인 안 된 상태일 수 있으니 '/')
    navigate('/', { replace: true });
  };

  const handleSkipSocial = async () => {
    // 소셜 가입: "다음에 하기" → 로그아웃 후 홈으로
    try {
      await signOut();
    } catch {}
    navigate('/', { replace: true });
  };

  const guard = buildGuard({
    consentOK,
    form,
    formOK,
    signupKind,
    verified,
    setSubmitAttempted,
  });

  const goTo = (next: Step) => guardedSetStep(step)(next, guard(step, next));
  const next = () => goTo(step === 1 ? 2 : 3);
  const back = () => goTo(step === 3 ? 2 : 1);

  // 레이아웃 마진/패딩
  const wrapperPad = 'pt-6 max-[449px]:pt-4 sm:pt-8 pb-6 max-[449px]:pb-4';

  const title = signupKind === 'social' ? t('signup.title_social') : t('signup.title_email');

  return (
    <div
      className={`min-h-auto mt- md:min-h-auto w-full bg-white dark:bg-background
                     flex justify-center items-start ${wrapperPad} overflow-y-auto`}
    >
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl px-4 xs:px-2.5 sm:px-6 md:px-8">
        <div className="relative mb-3 xs:mb-2 sm:mb-4 flex items-center justify-center min-h-[40px] sm:min-h-[48px]">
          {/* 중앙 타이틀 (절대 위치로 중앙 고정) - Title flows naturally but constrained */}
          <div className="relative z-0 px-12 xs:px-10 text-center mx-auto max-w-full">
            <h1 
              className="text-2xl xs:text-[20px] sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100"
              style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}
            >
              {title}
            </h1>
          </div>

          {/* 오른쪽: 액션 버튼 (절대 위치) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            {signupKind === 'social' ? (
              <button
                type="button"
                onClick={handleSkipSocial}
                className="inline-flex items-center gap-1.5 max-[449px]:gap-1 rounded-2xl max-[449px]:rounded-xl px-3.5 max-[449px]:px-2.5 py-1.5 text-sm max-[449px]:text-xs font-medium
                   border border-black/10 dark:border-white/10
                   text-gray-800 dark:text-gray-200
                   bg-primary/30 dark:bg-primary/70 backdrop-blur
                   shadow-sm hover:shadow transition-all duration-200
                   hover:bg-primary/50 hover:dark:bg-primary/80 hover:from-sky-400/10 hover:to-indigo-500/10
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-0
                   whitespace-nowrap"
                 aria-label="다음에 하기"
              >
                <X size={16} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                <span className="xs:hidden">{t('signup.later')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoHome}
                className="inline-flex items-center gap-1.5 max-[449px]:gap-1 rounded-2xl max-[449px]:rounded-xl px-3.5 max-[449px]:px-2.5 py-1.5 text-sm max-[449px]:text-xs font-medium
                   border border-black/10 dark:border-white/10
                   text-gray-800 dark:text-gray-200
                   bg-gray-300/30 dark:bg-gray-300/10 backdrop-blur
                   shadow-sm hover:shadow transition-all duration-200
                   hover:bg-gray-300/50 hover:dark:bg-gray-300/30 hover:from-sky-400/10 hover:to-indigo-500/10
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-0
                   whitespace-nowrap"
                aria-label="홈으로"
              >
                <Home size={16} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                <span className="xs:hidden">{t('signup.go_home')}</span>
              </button>
            )}
          </div>
        </div>

        <div className="mb-3 sm:mb-4">
          <SignUpStepper current={step} onStepChange={goTo} guard={guard} />
        </div>

        <StepCard>
          <motion.div className="overflow-x-hidden">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              {step === 1 && (
                <motion.section
                  key="step1"
                  custom={direction}
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
                  key="step2"
                  custom={direction}
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
                    signupKind={signupKind}
                  />
                </motion.section>
              )}

              {step === 3 && (
                <motion.section
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {form && (
                    <SignUpStep3Profile
                      email={form.email}
                      pw={form.pw}
                      nickname={form.nickname}
                      gender={form.gender}
                      birth={form.birth}
                      country={form.country}
                      consents={consents ?? undefined}
                      recoveryQuestion={form.recoveryQuestion || ''}
                      recoveryAnswer={form.recoveryAnswer || ''}
                      recoveryEmail={form.recoveryEmail || ''}
                      onBack={back}
                      onDone={() => {
                        /* 후속 처리 훅/라우팅 등 추가 지점 */
                      }}
                      draft={profileDraft}
                      onChangeDraft={setProfileDraft}
                      signupKind={signupKind}
                    />
                  )}
                </motion.section>
              )}
            </AnimatePresence>
          </motion.div>
        </StepCard>
      </div>
    </div>
  );
}

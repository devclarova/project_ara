import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';

import SignUpStep1Consent from '@/components/auth/SignUpStep1Consent';
import SignUpStep2Form, { type FormData } from '@/components/auth/SignUpStep2Form';
import SignUpStep3Profile from '@/components/auth/SignUpStep3Profile';
import SignUpStepper from '@/components/auth/SignUpStepper';
import StepCard from '@/components/auth/StepCard';

import { useSignupKind } from '@/hooks/useSignupKind';
import { buildGuard, useSignupStepper } from '@/hooks/useSignupStepper';

import type { ConsentResult } from '@/types/consent';
import type { Step, Verified } from '@/types/signup';
import { slideVariants } from '@/untils/motion';

export default function SignUpPage() {
  const { step, setStep, prevStepRef, direction, guardedSetStep } = useSignupStepper(1);

  const [consents, setConsents] = useState<ConsentResult | null>(null);
  const [form, setForm] = useState<FormData | null>(null);

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
  const isStep2 = step === 2;
  const wrapperPad = isStep2 ? 'pt-8 sm:pt-12 pb-10' : 'pt-5 sm:pt-7 pb-4';

  return (
    <div
      className={`min-h-auto mt-4 md:min-h-auto w-full bg-white dark:bg-black
                     flex justify-center items-start ${wrapperPad} overflow-y-auto`}
    >
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl px-4 sm:px-6 md:px-8">
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-center
                       text-gray-800 dark:text-white mb-3 sm:mb-4"
        >
          회원가입
        </h1>

        <div className="mb-3 sm:mb-4">
          <SignUpStepper current={step} onStepChange={goTo} guard={guard} />
        </div>

        <StepCard>
          <motion.div layout className="overflow-x-hidden">
            <AnimatePresence mode="wait" custom={direction}>
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

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';

import SignUpStep1Consent, { type ConsentResult } from '../components/auth/SignUpStep1Consent';
import SignUpStep2Form, { type FormData } from '../components/auth/SignUpStep2Form';
import SignUpStep3Profile from '../components/auth/SignUpStep3Profile';
import SignUpStepper from '../components/auth/SignUpStepper';

type Step = 1 | 2 | 3;

// 좌↔우 슬라이드(절대배치 없이 x/opacity만)
const slideVariants = {
  initial: (dir: 'forward' | 'backward') => ({ x: dir === 'forward' ? 40 : -40, opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.25 } },
  exit: (dir: 'forward' | 'backward') => ({
    x: dir === 'forward' ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.22 },
  }),
} as const;

// 남겨두되, 실제로는 쓰지 않음(기존 브라우저 잔여 데이터 정리용)
const DRAFT_KEY = 'ara-signup-draft-v1';

export default function SignUpPage() {
  const [step, setStep] = useState<Step>(1);
  const prevStepRef = useRef<Step>(1);

  const [consents, setConsents] = useState<ConsentResult | null>(null);
  const [form, setForm] = useState<FormData | null>(null);

  // 3단계 프로필 드래프트(왕복 시 유지) — 컴포넌트 생존 동안만 유지(스토리지 미사용)
  const [profileDraft, setProfileDraft] = useState<{
    bio: string;
    file: File | null;
    preview: string | null; // blob: URL
  }>({ bio: '', file: null, preview: null });

  // ✅ 언마운트 시 혹시 남아 있을 수 있는 이전 버전 초안 제거(안전)
  useEffect(() => {
    return () => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
    };
  }, []);

  // 유효성
  function isFormValid(f: FormData | null): boolean {
    if (!f) return false;
    const emailOk = /\S+@\S+\.\S+/.test(f.email || '');
    const pwOk = typeof f.pw === 'string' && f.pw.length >= 6 && f.pw === (f.confirmPw || '');
    const nickOk = typeof f.nickname === 'string' && f.nickname.trim().length >= 2;
    const genderOk = !!f.gender;
    const birthOk = !!f.birth;
    const countryOk = !!f.country;
    return emailOk && pwOk && nickOk && genderOk && birthOk && countryOk;
  }

  const consentOK = !!(consents?.terms && consents?.privacy && consents?.age);
  const formOK = useMemo(() => isFormValid(form), [form]);

  const direction: 'forward' | 'backward' = step > prevStepRef.current ? 'forward' : 'backward';

  // 이동 가드
  const guard = (from: Step, to: Step) => {
    if (to > from) {
      if (to >= 2 && !consentOK) return false;
      if (to >= 3 && !formOK) return false;
    }
    return true;
  };

  const guardedSetStep = (next: Step) => {
    if (!guard(step, next)) return;
    prevStepRef.current = step;
    setStep(next);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goTo = (next: Step) => guardedSetStep(next);
  const next = () => guardedSetStep(step === 1 ? 2 : 3);
  const back = () => guardedSetStep(step === 3 ? 2 : 1);

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-neutral-950 flex items-start justify-center py-8 sm:py-12">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-4 sm:mb-6">
          회원가입
        </h1>

        <div className="mb-3 sm:mb-4">
          <SignUpStepper current={step} onStepChange={goTo} guard={guard} />
        </div>

        <div
          className="
          rounded-2xl bg-white dark:bg-neutral-900 shadow-md
          ring-1 ring-gray-200/80 dark:ring-neutral-800 p-4 sm:p-6 md:p-8
        "
        >
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
                    onChange={c => setConsents(c)}
                    onNext={c => {
                      setConsents(c);
                      guardedSetStep(2);
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
                    onChange={d => setForm(d)}
                    onNext={d => {
                      setForm(d);
                      guardedSetStep(3);
                    }}
                    onBack={back}
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
                        console.log('Sign up flow finished', { consents, form, profileDraft });
                      }}
                      draft={profileDraft}
                      onChangeDraft={setProfileDraft}
                    />
                  )}
                </motion.section>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

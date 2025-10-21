import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

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

// (옵션) 드래프트 저장 키
const DRAFT_KEY = 'ara-signup-draft-v1';

export default function SignUpPage() {
  const [step, setStep] = useState<Step>(1);
  const prevStepRef = useRef<Step>(1);

  const [consents, setConsents] = useState<ConsentResult | null>(null);
  const [form, setForm] = useState<FormData | null>(null);

  // ✅ 3단계 프로필 드래프트(이전/다음 왕복 시 유지) — 직렬화 어려운 File은 로컬스토리지는 생략
  const [profileDraft, setProfileDraft] = useState<{
    bio: string;
    file: File | null;
    preview: string | null; // blob: URL
  }>({ bio: '', file: null, preview: null });

  // 새로고침 감지 플래그(복원/저장 이펙트 1회 스킵용)
  const skipPersistenceRef = useRef(false);

  function isFormValid(f: FormData | null): boolean {
    if (!f) return false;
    const emailOk = /\S+@\S+\.\S+/.test(f.email || '');
    const pwOk = typeof f.pw === 'string' && f.pw.length >= 6 && f.pw === (f.confirmPw || '');
    const nickOk = typeof f.nickname === 'string' && f.nickname.trim().length >= 2;
    const genderOk = !!f.gender;
    const birthOk = !!f.birth; // 필요 시 상세 체크(미래/형식) 추가
    const countryOk = !!f.country;
    return emailOk && pwOk && nickOk && genderOk && birthOk && countryOk;
  }

  // ✅ 필드 유효성
  const consentOK = !!(consents?.terms && consents?.privacy && consents?.age);
  const formOK = useMemo(() => isFormValid(form), [form]);

  // ─────────────────────────────────────
  // (1) 새로고침이면 저장된 초안 전부 삭제 + 1단계로 초기화
  // (2) 새로고침이 아니면 localStorage 복원
  // ─────────────────────────────────────
  useEffect(() => {
    // Navigation Timing으로 리로드 감지
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const isReload = nav?.type === 'reload';

    if (isReload) {
      // 리로드 시에는 모든 초안/스텝 초기화
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      setStep(1);
      prevStepRef.current = 1;
      setConsents(null);
      setForm(null);
      setProfileDraft({ bio: '', file: null, preview: null });

      // 첫 저장 이펙트 1회 스킵 (초기 상태로 덮어쓰지 않게)
      skipPersistenceRef.current = true;
      return;
    }

    // 리로드가 아니면 저장된 초안 복원
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        consents?: ConsentResult | null;
        form?: FormData | (Omit<FormData, 'birth'> & { birth: string | null }) | null;
        step?: Step;
      };
      if (parsed.consents) setConsents(parsed.consents);
      if (parsed.form) {
        const revivedBirth = parsed.form.birth
          ? typeof parsed.form.birth === 'string'
            ? new Date(parsed.form.birth)
            : parsed.form.birth
          : null;
        setForm({ ...(parsed.form as any), birth: revivedBirth });
      }
      if (parsed.step) {
        setStep(parsed.step);
        prevStepRef.current = parsed.step;
      }
    } catch {}
  }, []);

  // (옵션) 드래프트 저장 (File/preview는 직렬화 이슈로 저장하지 않음)
  useEffect(() => {
    // 리로드 직후 1회 스킵
    if (skipPersistenceRef.current) {
      skipPersistenceRef.current = false;
      return;
    }
    try {
      const safeForm = form
        ? { ...form, birth: form.birth ? form.birth.toISOString() : null }
        : null;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ consents, form: safeForm, step }));
    } catch {}
  }, [consents, form, step]);

  const direction: 'forward' | 'backward' = step > prevStepRef.current ? 'forward' : 'backward';

  // 🔒 이동 가드 (스텝퍼에도 넘겨서 버튼 클릭 시 동일 규칙 적용)
  const guard = (from: Step, to: Step) => {
    if (to > from) {
      if (to >= 2 && !consentOK) return false; // 1→2, 1→3
      if (to >= 3 && !formOK) return false; // 2→3, 1→3
    }
    return true; // 뒤로 가기는 허용
  };

  const guardedSetStep = (next: Step) => {
    if (!guard(step, next)) return;
    prevStepRef.current = step;
    setStep(next);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 타입 안전 이동(분기)
  const goTo = (next: Step) => guardedSetStep(next);
  const next = () => guardedSetStep(step === 1 ? 2 : 3);
  const back = () => guardedSetStep(step === 3 ? 2 : 1);

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-neutral-950 flex items-start justify-center py-8 sm:py-12">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl px-4 sm:px-6 md:px-8">
        {/* 페이지 타이틀 (카드 밖) */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-4 sm:mb-6">
          회원가입
        </h1>

        {/* 스텝퍼 (카드 밖) — guard 연결 + 1↔3 경유 애니는 스텝퍼가 처리 */}
        <div className="mb-3 sm:mb-4">
          <SignUpStepper current={step} onStepChange={goTo} guard={guard} />
        </div>

        {/* 카드 컨테이너 */}
        <div
          className="
            rounded-2xl
            bg-white dark:bg-neutral-900
            shadow-md
            ring-1 ring-gray-200/80 dark:ring-neutral-800
            p-4 sm:p-6 md:p-8
          "
        >
          {/* height 자동 보간 */}
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

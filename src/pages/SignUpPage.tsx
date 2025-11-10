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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

export default function SignUpPage() {
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
  const wrapperPad = 'pt-6 sm:pt-8 pb-6';

  const title = signupKind === 'social' ? '소셜 회원가입' : '회원가입';

  return (
    <>
      <Helmet>
        <title>Sign Up | ARA - Join the Global Korean Learning Community</title>
        <meta
          name="description"
          content="지금 ARA에 가입하고 전 세계 친구들과 함께 K-콘텐츠로 한국어를 배우세요. 쉽고 재미있는 한국어 학습 여정을 지금 시작하세요!"
        />
        <meta
          name="keywords"
          content="ARA 가입, 회원가입, Learn Korean, Korean study, K-POP, K-Drama, 한국어 학습, language exchange"
        />

        {/* Open Graph (SNS 공유용) */}
        <meta property="og:title" content="Join ARA - Learn Korean through K-Culture" />
        <meta
          property="og:description"
          content="전 세계 학습자들과 함께 K-드라마, 음악, 예능으로 한국어를 배우는 글로벌 커뮤니티 ARA에 지금 가입하세요!"
        />
        <meta property="og:image" content="/images/sample_font_logo.png" />
        <meta property="og:url" content="https://project-ara.vercel.app/signup" />
        <meta property="og:type" content="website" />

        {/* ✅ Twitter 카드 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Join ARA - Learn Korean through K-Culture" />
        <meta
          name="twitter:description"
          content="K-콘텐츠로 한국어를 배우는 글로벌 학습 플랫폼 ARA. 지금 가입하고 새로운 언어 여정을 시작하세요!"
        />
        <meta name="twitter:image" content="/images/sample_font_logo.png" />
      </Helmet>
      <div
        className={`min-h-auto mt- md:min-h-auto w-full bg-white dark:bg-background
                     flex justify-center items-start ${wrapperPad} overflow-y-auto`}
      >
        <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl px-4 sm:px-6 md:px-8">
          <div className="mb-3 sm:mb-4 grid grid-cols-3 items-center">
            <div className="col-start-2 justify-self-center">
              <h1 className="text-2xl pb-4 sm:text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100">
                {title}
              </h1>
            </div>

            {/* 오른쪽: 액션 버튼 */}
            <div className="col-start-3 justify-self-end">
              {signupKind === 'social' ? (
                <button
                  type="button"
                  onClick={handleSkipSocial}
                  className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-sm font-medium
                   border border-black/10 dark:border-white/10
                   text-gray-800 dark:text-gray-200
                   bg-primary/30 dark:bg-primary/70 backdrop-blur
                   shadow-sm hover:shadow transition-all duration-200
                   hover:bg-primary/50 hover:dark:bg-primary/80 hover:from-sky-400/10 hover:to-indigo-500/10
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-0"
                  aria-label="다음에 하기"
                >
                  다음에 하기
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoHome}
                  className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-sm font-medium
                   border border-black/10 dark:border-white/10
                   text-gray-800 dark:text-gray-200
                   bg-gray-300/30 dark:bg-gray-300/10 backdrop-blur
                   shadow-sm hover:shadow transition-all duration-200
                   hover:bg-gray-300/50 hover:dark:bg-gray-300/30 hover:from-sky-400/10 hover:to-indigo-500/10
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-0"
                  aria-label="홈으로"
                >
                  홈으로
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
    </>
  );
}

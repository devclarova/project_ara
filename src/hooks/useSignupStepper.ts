import { useMemo, useRef, useState } from 'react';
import type { Step, Verified } from '@/types/signup';

export type MinimalForm = {
  email: string;
  pw: string;
  confirmPw?: string;
  nickname: string;
  gender: string;
  birth: Date | null;
  country: string;
};

type GuardDeps = {
  consentOK: boolean;
  form: MinimalForm | null;
  formOK: boolean;
  signupKind: 'email' | 'social';
  verified: Verified;
  setSubmitAttempted: (b: boolean) => void;
};

export function useSignupStepper(initialStep: Step = 1) {
  const [step, setStep] = useState<Step>(initialStep);
  const prevStepRef = useRef<Step>(initialStep);

  const direction: 'forward' | 'backward' =
    step > prevStepRef.current ? 'forward' : 'backward';

  const guardedSetStep = (from: Step) => (to: Step, canGo: boolean) => {
    if (!canGo) return;
    prevStepRef.current = from;
    setStep(to);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return { step, setStep, prevStepRef, direction, guardedSetStep };
}

export function buildGuard({
  consentOK, form, formOK, signupKind, verified, setSubmitAttempted,
}: GuardDeps) {
  return (from: Step, to: Step) => {
    if (to > from) {
      if (to >= 2 && !consentOK) return false;

      if (to >= 3) {
        setSubmitAttempted(true);

        if (!formOK) return false;

        const emailOK =
          signupKind === 'social'
            ? true
            : verified.email.ok && verified.email.value === (form?.email ?? '');
        const nickOK =
          verified.nickname.ok && verified.nickname.value === (form?.nickname ?? '');

        if (!emailOK || !nickOK) return false;
      }
    }
    return true;
  };
}
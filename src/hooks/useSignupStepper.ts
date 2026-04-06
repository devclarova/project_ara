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

/**
 * 단계별 회원가입 상태 머신(Signup Step State Machine)
 * - 회원가입 진행 단계(Step), 가드 조건(Guard) 및 화면 전환 방향성을 총괄 관리
 * - UI 애니메이션 방향 제어 및 최적화된 스크롤 위치 보정 로직 포함
 */
export function useSignupStepper(initialStep: Step = 1) {
  const [step, setStep] = useState<Step>(initialStep);
  const prevStepRef = useRef<Step>(initialStep);

  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const guardedSetStep = (from: Step) => (to: Step, canGo: boolean) => {
    if (!canGo) return;
     setDirection(to > from ? 'forward' : 'backward');
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
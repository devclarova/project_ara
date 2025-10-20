import React, { useState } from 'react';
import SignUpStepper from '../components/auth/SignUpStepper';
import SignUpStep1Consent, { type ConsentResult } from '../components/auth/SignUpStep1Consent';
import SignUpStep2Form, { type FormData } from '../components/auth/SignUpStep2Form';
import SignUpStep3Profile from '../components/auth/SignUpStep3Profile';


type Step = 1 | 2 | 3;

export default function SignUpPage() {
  const [step, setStep] = useState<Step>(1);
  const [consents, setConsents] = useState<ConsentResult | null>(null);
  const [form, setForm] = useState<FormData | null>(null);

  return (
    <div className="min-h-16 flex items-center justify-center">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl rounded-2xl p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4 sm:mb-6">
          회원가입
        </h1>

        <SignUpStepper current={step} />

        {step === 1 && (
          <SignUpStep1Consent
            onNext={c => {
              setConsents(c);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <SignUpStep2Form
            onNext={d => {
              setForm(d);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && form && (
          <SignUpStep3Profile
            email={form.email}
            pw={form.pw}
            nickname={form.nickname}
            gender={form.gender}
            birth={form.birth}
            country={form.country}
            consents={consents ?? undefined}
            onBack={() => setStep(2)}
            onDone={() => {
              // 성공 UX: 이메일 인증 안내 → 로그인/홈으로
              // 예: navigate('/signin') 등으로 교체 가능
              console.log('Sign up flow finished');
            }}
          />
        )}
      </div>
    </div>
  );
}

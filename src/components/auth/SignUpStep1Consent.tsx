import React, { useEffect, useState } from 'react';
import type { ConsentResult } from '@/types/consent';
import { useConsentDraft } from './consent/useConsentDraft';
import AgreeRow from './consent/AgreeRow';
import ConsentModal from './consent/ConsentModal';
import { useTranslation } from 'react-i18next';

type Props = {
  onNext: (c: ConsentResult) => void;
  value?: ConsentResult;
  onChange?: (c: ConsentResult) => void;
};

export default function SignUpStep1Consent({ onNext, value, onChange }: Props) {
  const { t } = useTranslation();
  const [terms, setTerms] = useState(value?.terms ?? false);
  const [privacy, setPrivacy] = useState(value?.privacy ?? false);
  const [age, setAge] = useState(value?.age ?? false);
  const [marketing, setMarketing] = useState(value?.marketing ?? false);

  // 외부 상태 동기화(External Sync) — 부모 컴포넌트로부터 전달받은 약관 동의 상태(Value)를 로컬 상태에 실시간 바인딩
  useEffect(() => {
    if (!value) return;
    setTerms(value.terms);
    setPrivacy(value.privacy);
    setAge(value.age);
    setMarketing(value.marketing);
  }, [value]);

  // 상태 전파 엔진(State Propagation) — 사용자의 인터랙션 결과를 상위 컨텍스트로 전달하여 전체 가입 프로세스의 데이터 정합성 유지
  const emit = (next: ConsentResult) => {
    onChange?.(next);
  };

  // 법적 요건 검증(Compliance Validation) — 서비스 이용의 필수 약관 동의 여부를 판별하여 다음 스텝으로의 가이드라인(Guardrail) 역할 수행
  const allRequired = terms && privacy && age;
  const allSelected = terms && privacy && age && marketing;
  const anySelected = terms || privacy || age || marketing;
  const someSelected = anySelected && !allSelected;

  // 벌크 액션 오케스트레이터(Bulk Action Orchestration) — '전체 동의' 선택 시 개별 약관의 상태를 일괄적으로 전환하여 사용자 편의성 제공
  const handleAll = (v: boolean) => {
    const next: ConsentResult = { terms: v, privacy: v, age: v, marketing: v };
    setTerms(next.terms);
    setPrivacy(next.privacy);
    setAge(next.age);
    setMarketing(next.marketing);
    emit(next);
  };

  const [open, setOpen] = useState<null | 'terms' | 'privacy' | 'marketing'>(null);

  // 컨텐츠 상세 확인 및 승인 — 각 약관의 세부 전문을 확인한 후 개별 항목의 승인 상태를 확정하고 모달 라이프사이클 종료
  const acceptAndClose = () => {
    if (!open) return;
    const next: ConsentResult = { terms, privacy, age, marketing };
    if (open === 'terms') next.terms = true;
    if (open === 'privacy') next.privacy = true;
    if (open === 'marketing') next.marketing = true;

    setTerms(next.terms);
    setPrivacy(next.privacy);
    setAge(next.age);
    setMarketing(next.marketing);
    emit(next);
    setOpen(null);
  };

  return (
    <section className="bg-white p-4 xs:p-3 sm:p-6 md:p-8 shadow dark:bg-secondary">
      <h2 
        className="text-xl xs:text-[19px] sm:text-2xl font-bold text-gray-800 mb-1 dark:text-gray-100"
        style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}
      >
        {t('signup.step1_title')}
      </h2>
      <p 
        className="text-gray-500 xs:text-[13px] mb-4 xs:mb-3 sm:mb-5 dark:text-gray-400"
        style={{ overflowWrap: 'break-word' }}
      >
        {t('signup.step1_desc')}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 xs:gap-x-1">
        <AgreeRow label={t('signup.agree_all')} checked={allSelected} onChange={handleAll} />
        {/* 인디케이터 표현은 CheckboxSquare 내부 visualState로 처리해도 됨 */}
        <div className="col-span-2 h-px bg-gray-100 dark:bg-gray-700 my-1" />

        <AgreeRow
          required
          label={t('signup.agree_terms')}
          checked={terms}
          onChange={v => {
            setTerms(v);
            emit({ terms: v, privacy, age, marketing });
          }}
          onDetail={() => setOpen('terms')}
        />
        <AgreeRow
          required
          label={t('signup.agree_privacy')}
          checked={privacy}
          onChange={v => {
            setPrivacy(v);
            emit({ terms, privacy: v, age, marketing });
          }}
          onDetail={() => setOpen('privacy')}
        />
        <AgreeRow
          required
          label={t('signup.agree_age')}
          checked={age}
          onChange={v => {
            setAge(v);
            emit({ terms, privacy, age: v, marketing });
          }}
        />
        <AgreeRow
          label={t('signup.agree_marketing')}
          checked={marketing}
          onChange={v => {
            setMarketing(v);
            emit({ terms, privacy, age, marketing: v });
          }}
          onDetail={() => setOpen('marketing')}
        />
      </div>

      <div className="mt-6 xs:mt-4 flex w-full justify-end">
        <button
          disabled={!allRequired}
          onClick={() => {
            const payload: ConsentResult = { terms, privacy, age, marketing };
            onNext(payload);
          }}
          className={[
            'bg-[var(--ara-primary)] text-white font-semibold rounded-lg px-4 py-2 sm:px-5 sm:py-2.5 transition-opacity',
            'text-sm xs:text-[14px] sm:text-base',
            'max-w-full',
            !allRequired ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-85',
          ].join(' ')}
        >
          {t('signup.next_step')}
        </button>
      </div>

      <ConsentModal open={open} onClose={() => setOpen(null)} onAccept={acceptAndClose} />
    </section>
  );
}

import React, { useEffect, useState } from 'react';
import type { ConsentResult } from '@/types/consent';
import { useConsentDraft } from './consent/useConsentDraft';
import AgreeRow from './consent/AgreeRow';
import ConsentModal from './consent/ConsentModal';

type Props = {
  onNext: (c: ConsentResult) => void;
  value?: ConsentResult;
  onChange?: (c: ConsentResult) => void;
};

export default function SignUpStep1Consent({ onNext, value, onChange }: Props) {
  const [terms, setTerms] = useState(value?.terms ?? false);
  const [privacy, setPrivacy] = useState(value?.privacy ?? false);
  const [age, setAge] = useState(value?.age ?? false);
  const [marketing, setMarketing] = useState(value?.marketing ?? false);

  // 외부 value 변화 동기화
  useEffect(() => {
    if (!value) return;
    setTerms(value.terms);
    setPrivacy(value.privacy);
    setAge(value.age);
    setMarketing(value.marketing);
  }, [value]);

  // ✅ 입력 중에는 저장하지 않음. 부모에만 알림.
  const emit = (next: ConsentResult) => {
    onChange?.(next);
  };

  const allRequired = terms && privacy && age;
  const allSelected = terms && privacy && age && marketing;
  const anySelected = terms || privacy || age || marketing;
  const someSelected = anySelected && !allSelected;

  const handleAll = (v: boolean) => {
    const next: ConsentResult = { terms: v, privacy: v, age: v, marketing: v };
    setTerms(next.terms);
    setPrivacy(next.privacy);
    setAge(next.age);
    setMarketing(next.marketing);
    emit(next);
  };

  const [open, setOpen] = useState<null | 'terms' | 'privacy' | 'marketing'>(null);

  // 모달의 "동의하고 닫기": 열린 항목만 true로 만든 next를 반영
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
    <section className="bg-white p-4 sm:p-6 md:p-8 shadow overflow-x-hidden dark:bg-secondary">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 dark:text-gray-100">
        회원가입 동의
      </h2>
      <p className="text-gray-500 mb-4 sm:mb-5 dark:text-gray-400">
        서비스 이용을 위해 약관에 동의해주세요.
      </p>

      <div className="grid grid-cols-[1fr,auto] gap-x-4">
        <AgreeRow label="전체 동의" checked={allSelected} onChange={handleAll} />
        {/* 인디케이터 표현은 CheckboxSquare 내부 visualState로 처리해도 됨 */}
        <div className="col-span-2 h-px bg-gray-100 dark:bg-gray-700 my-1" />

        <AgreeRow
          required
          label="이용약관 동의"
          checked={terms}
          onChange={v => {
            setTerms(v);
            emit({ terms: v, privacy, age, marketing });
          }}
          onDetail={() => setOpen('terms')}
        />
        <AgreeRow
          required
          label="개인정보처리방침 동의"
          checked={privacy}
          onChange={v => {
            setPrivacy(v);
            emit({ terms, privacy: v, age, marketing });
          }}
          onDetail={() => setOpen('privacy')}
        />
        <AgreeRow
          required
          label="만 14세 이상입니다"
          checked={age}
          onChange={v => {
            setAge(v);
            emit({ terms, privacy, age: v, marketing });
          }}
        />
        <AgreeRow
          label="마케팅 정보 수신 동의(선택)"
          checked={marketing}
          onChange={v => {
            setMarketing(v);
            emit({ terms, privacy, age, marketing: v });
          }}
          onDetail={() => setOpen('marketing')}
        />
      </div>

      <div className="mt-6 flex w-full justify-end">
        <button
          disabled={!allRequired}
          onClick={() => {
            const payload: ConsentResult = { terms, privacy, age, marketing };
            onNext(payload);
          }}
          className={[
            'bg-[var(--ara-primary)] text-white font-semibold rounded-lg px-4 py-2 sm:px-5 sm:py-2.5 transition-opacity',
            'max-w-full',
            !allRequired ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-85',
          ].join(' ')}
        >
          다음 단계
        </button>
      </div>

      <ConsentModal open={open} onClose={() => setOpen(null)} onAccept={acceptAndClose} />
    </section>
  );
}

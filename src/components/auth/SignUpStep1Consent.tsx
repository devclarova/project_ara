import React, { useState } from 'react';

export type ConsentResult = {
  terms: boolean;
  privacy: boolean;
  age: boolean;
  marketing: boolean;
};

type Props = {
  onNext: (c: ConsentResult) => void;
};

export default function SignUpStep1Consent({ onNext }: Props) {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [age, setAge] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [open, setOpen] = useState<null | 'terms' | 'privacy' | 'marketing'>(null);

  const allRequired = terms && privacy && age;
  const handleAll = (v: boolean) => {
    setTerms(v);
    setPrivacy(v);
    setAge(v);
  };

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">회원가입 동의</h2>
      <p className="text-gray-500 mb-4 sm:mb-5">서비스 이용을 위해 약관에 동의해주세요.</p>

      {/* 전체 동의 */}
      <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 mb-3 hover:ring-2 hover:ring-[var(--ara-ring)]">
        <input
          type="checkbox"
          checked={allRequired}
          onChange={e => handleAll(e.target.checked)}
          className="w-5 h-5 accent-[var(--ara-primary)]"
        />
        <span className="font-semibold text-gray-800">전체 동의(선택)</span>
      </label>

      {/* 항목 리스트 */}
      <div className="divide-y divide-gray-100">
        <AgreeRow
          required
          label="이용약관 동의"
          checked={terms}
          onChange={setTerms}
          onDetail={() => setOpen('terms')}
        />
        <AgreeRow
          required
          label="개인정보처리방침 동의"
          checked={privacy}
          onChange={setPrivacy}
          onDetail={() => setOpen('privacy')}
        />
        <AgreeRow required label="만 14세 이상입니다" checked={age} onChange={setAge} />
        <AgreeRow
          label="마케팅 정보 수신 동의(선택)"
          checked={marketing}
          onChange={setMarketing}
          onDetail={() => setOpen('marketing')}
        />
      </div>

      {/* 버튼 */}
      <div className="flex justify-end mt-5">
        <button
          disabled={!allRequired}
          onClick={() => onNext({ terms, privacy, age, marketing })}
          className={[
            'bg-[var(--ara-primary)] text-white font-semibold rounded-lg px-4 py-2 sm:px-5 sm:py-2.5 transition-opacity',
            !allRequired ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-85',
          ].join(' ')}
        >
          다음 단계
        </button>
      </div>

      {/* 모달 */}
      {open !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-[88vw] max-w-2xl max-h-[70vh] overflow-auto relative">
            <h3 className="text-lg font-bold mb-3 text-[var(--ara-primary)]">
              {open === 'terms'
                ? '이용약관'
                : open === 'privacy'
                  ? '개인정보처리방침'
                  : '마케팅 수신 동의'}
            </h3>
            <div className="space-y-3 text-sm text-gray-700 leading-6">
              <p>(문서 내용을 이 영역에 넣어주세요)</p>
            </div>
            <button
              onClick={() => setOpen(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-[var(--ara-primary)]"
              aria-label="close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function AgreeRow({
  required = false,
  label,
  checked,
  onChange,
  onDetail,
}: {
  required?: boolean;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onDetail?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="w-5 h-5 accent-[var(--ara-primary)]"
        />
        <span className="font-semibold text-gray-800">
          {label} {required && <em className="not-italic text-red-600 ml-1">(필수)</em>}
        </span>
      </label>
      {onDetail && (
        <button
          type="button"
          onClick={onDetail}
          className="text-[var(--ara-primary)] hover:underline font-semibold"
        >
          세부보기
        </button>
      )}
    </div>
  );
}

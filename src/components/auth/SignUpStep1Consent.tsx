import React, { useEffect, useRef, useState } from 'react';

export type ConsentResult = {
  terms: boolean;
  privacy: boolean;
  age: boolean;
  marketing: boolean;
};

type Props = {
  onNext: (c: ConsentResult) => void;
  value?: ConsentResult;
  onChange?: (c: ConsentResult) => void;
};

// 간단한 고유 ID 훅
function useAutoId(prefix = 'chk') {
  const ref = useRef<string>();
  if (!ref.current) {
    ref.current = `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
  return ref.current;
}

// 사각형 커스텀 체크박스 (indeterminate 표현 옵션 지원)
function CheckboxSquare({
  checked,
  onChange,
  label,
  required = false,
  id,
  className = '',
  visualState, // 'checked' | 'indeterminate' | 'unchecked'
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  required?: boolean;
  id?: string;
  className?: string;
  visualState?: 'checked' | 'indeterminate' | 'unchecked';
}) {
  const autoId = useAutoId();
  const inputId = id || autoId;

  const vars = {
    '--ara-checkbox-bg': 'var(--ara-surface, #ffffff)',
    '--ara-checkbox-border': 'var(--ara-border, #d1d5db)',
    '--ara-checkbox-ring': 'var(--ara-ring, rgba(0,191,165,.3))',
    '--ara-checkbox-check': 'var(--ara-ink, #111111)',
  } as React.CSSProperties;

  const state: 'checked' | 'indeterminate' | 'unchecked' =
    visualState ?? (checked ? 'checked' : 'unchecked');

  return (
    <label
      htmlFor={inputId}
      className={['flex items-center gap-3 cursor-pointer select-none', className].join(' ')}
      style={vars}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={[
          'w-5 h-5 rounded-[6px] border grid place-items-center',
          'bg-[var(--ara-checkbox-bg)] border-[var(--ara-checkbox-border)]',
          'outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ara-checkbox-ring)]',
        ].join(' ')}
        tabIndex={-1}
        aria-hidden="true"
      >
        {state === 'checked' && (
          <svg className="w-4 h-4 opacity-100" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 10.5l3 3 7-7"
              stroke="var(--ara-checkbox-check)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {state === 'indeterminate' && (
          <svg className="w-4 h-4 opacity-100" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 10h10"
              stroke="var(--ara-checkbox-check)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {state === 'unchecked' && <svg className="w-4 h-4 opacity-0" viewBox="0 0 20 20" />}
      </span>
      <span className="font-semibold text-gray-800">
        {label} {required && <em className="not-italic text-red-600 ml-1">(필수)</em>}
      </span>
    </label>
  );
}

export default function SignUpStep1Consent({ onNext, value, onChange }: Props) {
  const [terms, setTerms] = useState(value?.terms ?? false);
  const [privacy, setPrivacy] = useState(value?.privacy ?? false);
  const [age, setAge] = useState(value?.age ?? false);
  const [marketing, setMarketing] = useState(value?.marketing ?? false);

  useEffect(() => {
    if (!value) return;
    setTerms(value.terms);
    setPrivacy(value.privacy);
    setAge(value.age);
    setMarketing(value.marketing);
  }, [value?.terms, value?.privacy, value?.age, value?.marketing]);

  // 부모로 변경 통지 헬퍼
  const emit = (next: ConsentResult) => onChange?.(next);

  const [open, setOpen] = useState<null | 'terms' | 'privacy' | 'marketing'>(null);

  // 버튼 활성화는 필수 3개만
  const allRequired = terms && privacy && age;

  // 전체 선택(표시용) — 선택 포함 4개 모두
  const allSelected = terms && privacy && age && marketing;
  const anySelected = terms || privacy || age || marketing;
  const someSelected = anySelected && !allSelected;

  const handleAll = (v: boolean) => {
    setTerms(v);
    setPrivacy(v);
    setAge(v);
    setMarketing(v);
    emit({ terms: v, privacy: v, age: v, marketing: v });
  };

  // ─────────────────────────────────────────
  // 세부보기 콘텐츠
  // ─────────────────────────────────────────
  const CONTENT: Record<
    'terms' | 'privacy' | 'marketing',
    { title: string; sections: Array<{ id: string; h: string; body: React.ReactNode }> }
  > = {
    terms: {
      title: '이용약관',
      sections: [
        {
          id: 'purpose',
          h: '제1조 (목적)',
          body: (
            <p>
              본 약관은 “ARA”(이하 “회사”)가 제공하는 한국어 학습 플랫폼 및 관련 제반 서비스(이하
              “서비스”)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한
              사항을 규정함을 목적으로 합니다.
            </p>
          ),
        },
        {
          id: 'definition',
          h: '제2조 (용어의 정의)',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>
                “회원”이란 회사의 서비스에 접속하여 본 약관에 따라 이용계약을 체결하고 서비스를
                이용하는 자를 말합니다.
              </li>
              <li>
                “콘텐츠”란 서비스 내에서 제공되는 영상, 텍스트, 음성, 이미지, AI 분석 결과 등 일체의
                자료를 말합니다.
              </li>
              <li>
                “유료 서비스”란 일부 프리미엄 학습 콘텐츠, AI 피드백 기능, 광고 제거 등의 대가로
                결제를 필요로 하는 서비스를 말합니다.
              </li>
            </ul>
          ),
        },
        {
          id: 'contract',
          h: '제3조 (이용계약의 성립)',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>이용계약은 회원이 본 약관에 동의하고, 회사가 이를 승낙함으로써 성립합니다.</li>
              <li>
                회사는 서비스 제공을 위해 필요한 경우 회원의 이메일 인증을 요구할 수 있습니다.
              </li>
              <li>만 14세 미만은 부모(법정대리인)의 동의 없이는 회원 가입이 불가합니다.</li>
            </ul>
          ),
        },
        {
          id: 'member_duty',
          h: '제4조 (회원의 의무)',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>회원은 서비스 이용 시 관련 법령, 본 약관, 운영정책을 준수해야 합니다.</li>
              <li>타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.</li>
              <li>서비스 내에서의 모든 활동에 대한 책임은 회원 본인에게 있습니다.</li>
              <li>AI 분석 결과를 무단 복제, 유포, 상업적 이용하는 행위를 금지합니다.</li>
            </ul>
          ),
        },
        {
          id: 'company_duty',
          h: '제5조 (회사의 의무)',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>회사는 관련 법령과 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않습니다.</li>
              <li>회원이 안전하게 서비스를 이용할 수 있도록 개인정보 보호에 최선을 다합니다.</li>
              <li>서비스의 안정적 제공을 위하여 시스템 점검, 업데이트 등을 수행할 수 있습니다.</li>
            </ul>
          ),
        },
        {
          id: 'service_change',
          h: '제6조 (서비스의 변경 및 중단)',
          body: (
            <p>
              회사는 운영상 또는 기술상의 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수
              있으며, 이 경우 사전에 회원에게 공지합니다. 단, 불가피한 사유로 사전 공지가 어려운
              경우 사후에 통지할 수 있습니다.
            </p>
          ),
        },
        {
          id: 'termination',
          h: '제7조 (계약 해지 및 이용제한)',
          body: (
            <p>
              회원은 언제든지 “회원탈퇴” 기능을 통해 이용계약을 해지할 수 있습니다. 회사는 회원이
              약관을 위반하거나 법령을 위반한 경우 서비스 이용을 제한하거나 계약을 해지할 수
              있습니다.
            </p>
          ),
        },
        {
          id: 'disclaimer',
          h: '제8조 (면책)',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>
                회사는 천재지변, 통신장애 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임을
                지지 않습니다.
              </li>
              <li>
                회원의 귀책 사유로 인한 서비스 이용 장애에 대하여 회사는 책임을 지지 않습니다.
              </li>
            </ul>
          ),
        },
      ],
    },
    privacy: {
      title: '개인정보처리방침',
      sections: [
        {
          id: 'collect',
          h: '제1조 (수집하는 개인정보 항목)',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>회원가입 시</strong>: 이메일, 비밀번호, 닉네임 (필수)
              </li>
              <li>
                <strong>선택 항목</strong>: 생년월일, 성별, 프로필 사진, 국가 정보
              </li>
              <li>
                <strong>자동 수집 정보</strong>: 서비스 이용 기록, 접속 IP, 쿠키, 기기 정보, 오류
                로그
              </li>
            </ul>
          ),
        },
        {
          id: 'purpose',
          h: '제2조 (개인정보의 이용 목적)',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>회원 식별 및 본인 확인</li>
              <li>서비스 제공, 학습 기록 저장 및 피드백 기능 운영</li>
              <li>고객 문의 및 민원 처리, 공지사항 전달</li>
              <li>서비스 품질 향상을 위한 통계 분석 및 맞춤형 콘텐츠 제공</li>
              <li>불법 사용 방지 및 보안 유지</li>
            </ul>
          ),
        },
        {
          id: 'store',
          h: '제3조 (개인정보의 보유 및 이용 기간)',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>회원 탈퇴 시 즉시 파기합니다.</li>
              <li>단, 다음의 경우 관련 법령에 따라 일정 기간 보관합니다.</li>
              <ul className="list-disc pl-5">
                <li>계약 또는 청약 철회 기록: 5년</li>
                <li>전자금융 거래 기록: 5년</li>
                <li>서비스 이용 관련 로그 기록: 3개월</li>
              </ul>
            </ul>
          ),
        },
        {
          id: 'share',
          h: '제4조 (개인정보의 제3자 제공 및 위탁)',
          body: (
            <p>
              회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 단, 다음의 경우에 한해
              제3자에게 제공할 수 있습니다.
            </p>
          ),
        },
        {
          id: 'security',
          h: '제5조 (개인정보의 안전성 확보조치)',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>비밀번호 및 민감정보 암호화 저장</li>
              <li>접근권한 최소화 및 정기적 보안 점검</li>
              <li>개인정보 접근 기록 관리 및 위·변조 방지</li>
              <li>정기적 백업 및 재난 대비 시스템 구축</li>
            </ul>
          ),
        },
        {
          id: 'rights',
          h: '제6조 (이용자의 권리와 행사방법)',
          body: (
            <p>
              이용자는 언제든지 본인의 개인정보에 대해 열람, 정정, 삭제를 요청할 수 있으며, 회사는
              본인 확인 후 지체 없이 필요한 조치를 취합니다.
            </p>
          ),
        },
        {
          id: 'contact',
          h: '제7조 (개인정보 보호책임자)',
          body: (
            <div>
              <p>회사는 개인정보 보호를 위한 책임자를 다음과 같이 지정합니다.</p>
              <ul className="list-disc pl-5">
                <li>성명: 홍길동</li>
                <li>이메일: privacy@ara-service.com</li>
                <li>문의 시간: 평일 10:00~18:00</li>
              </ul>
            </div>
          ),
        },
      ],
    },
    marketing: {
      title: '마케팅 정보 수신 동의',
      sections: [
        {
          id: 'purpose',
          h: '제1조 (수신 목적)',
          body: (
            <p>
              회사는 회원에게 다양한 혜택과 정보를 제공하기 위해 이메일, 앱 알림(Push), 문자(SMS)
              등을 통해 맞춤형 마케팅 정보를 발송할 수 있습니다.
            </p>
          ),
        },
        {
          id: 'contents',
          h: '제2조 (수신 내용)',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>신규 학습 콘텐츠 및 기능 업데이트 안내</li>
              <li>K-Culture 관련 이벤트 및 캠페인 소식</li>
              <li>할인, 프로모션, 쿠폰 및 제휴 혜택 정보</li>
              <li>사용자 맞춤 학습 리포트 및 추천 서비스</li>
            </ul>
          ),
        },
        {
          id: 'method',
          h: '제3조 (수신 방법)',
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>회원가입 시 선택 항목을 통한 사전 동의</li>
              <li>회원 정보 수정 페이지에서 수신 여부 변경 가능</li>
              <li>이메일 하단 ‘수신거부’ 또는 설정 → 알림 → 수신 동의 해제 가능</li>
            </ul>
          ),
        },
        {
          id: 'withdraw',
          h: '제4조 (동의 철회)',
          body: (
            <p>
              회원은 언제든지 서비스 설정 페이지 또는 이메일 하단의 ‘수신거부’ 기능을 통해 마케팅
              수신 동의를 철회할 수 있습니다. 철회 시 이후 발송분부터 적용됩니다.
            </p>
          ),
        },
        {
          id: 'note',
          h: '제5조 (기타)',
          body: (
            <p>
              마케팅 수신 동의 여부와 관계없이 서비스 운영상 필수적인 공지(약관 변경, 보안 관련,
              결제 내역 등)는 발송됩니다.
            </p>
          ),
        },
      ],
    },
  };

  const toc = open ? CONTENT[open] : null;

  // 모달 닫기 & 동의 처리
  const closeModal = () => setOpen(null);
  const acceptAndClose = () => {
    if (!open) return;
    if (open === 'terms') setTerms(true);
    if (open === 'privacy') setPrivacy(true);
    if (open === 'marketing') setMarketing(true);
    // age(만14세)는 별도 항목이라 모달 없음
    setOpen(null);
  };

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow overflow-x-hidden">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">회원가입 동의</h2>
      <p className="text-gray-500 mb-4 sm:mb-5">서비스 이용을 위해 약관에 동의해주세요.</p>

      <div className="grid grid-cols-[1fr,auto] gap-x-4">
        {/* 전체 동의 (선택 포함 4개) */}
        <div className="col-span-2 py-2">
          <CheckboxSquare
            checked={allSelected}
            visualState={someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'}
            onChange={handleAll}
            label="전체 동의"
            className="w-full"
          />
        </div>

        <div className="col-span-2 h-px bg-gray-100 my-1" />

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
            emit({ privacy: v, terms, age, marketing });
          }}
          onDetail={() => setOpen('privacy')}
        />
        <AgreeRow
          required
          label="만 14세 이상입니다"
          checked={age}
          onChange={v => {
            setAge(v);
            emit({ age: v, terms, privacy, marketing });
          }}
        />
        <AgreeRow
          label="마케팅 정보 수신 동의(선택)"
          checked={marketing}
          onChange={v => {
            setMarketing(v);
            emit({ marketing: v, terms, privacy, age });
          }}
          onDetail={() => setOpen('marketing')}
        />
      </div>

      {/* 버튼 */}
      <div className="mt-6 flex w-full justify-end">
        <button
          disabled={!allRequired}
          onClick={() => onNext({ terms, privacy, age, marketing })}
          className={[
            'bg-[var(--ara-primary)] text-white font-semibold rounded-lg px-4 py-2 sm:px-5 sm:py-2.5 transition-opacity',
            'max-w-full',
            !allRequired ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-85',
          ].join(' ')}
        >
          다음 단계
        </button>
      </div>

      {/* ───────────── 모달 ───────────── */}
      {open && toc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          {/* 컨테이너: 세로 플렉스, 높이 제한, overflow 제어는 자식에서 */}
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-lg">
            {/* 헤더: 고정(스크롤 영향 X) */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-none">
              <h3 className="text-lg font-bold text-[var(--ara-primary)]">{toc.title}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-[var(--ara-primary)]"
                aria-label="close"
              >
                ✕
              </button>
            </div>

            {/* 바디: grid, 오른쪽만 스크롤 가능하게 설정 */}
            <div className="grid grid-cols-[180px,1fr] gap-0 flex-auto min-h-0">
              {/* 왼쪽 TOC: 고정(스크롤에 영향받지 않게 overflow 없음) */}
              <nav className="border-r px-4 py-4 flex-none">
                <ul className="space-y-2 text-sm">
                  {toc.sections.map(s => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="text-gray-700 hover:text-[var(--ara-primary)] hover:underline"
                        onClick={e => {
                          // 내부 스크롤 컨테이너로 스무스 스크롤
                          e.preventDefault();
                          const container = document.getElementById('modal-content-scroll');
                          const target = document.getElementById(s.id);
                          if (container && target) {
                            container
                              .querySelector(`#${s.id}`)
                              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                      >
                        {s.h}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* 오른쪽 내용: 유일한 스크롤 컨테이너 */}
              <div id="modal-content-scroll" className="px-6 py-5 overflow-auto min-h-0">
                <div className="space-y-6 text-sm text-gray-800 leading-6 pr-2">
                  {toc.sections.map(s => (
                    <section key={s.id} id={s.id} className="scroll-mt-20">
                      <h4 className="font-bold text-gray-900 mb-2">{s.h}</h4>
                      <div>{s.body}</div>
                    </section>
                  ))}
                </div>
              </div>
            </div>

            {/* 푸터: 고정(스크롤 영향 X) */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t flex-none">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                onClick={acceptAndClose}
                className="px-4 py-2 rounded-lg bg-[var(--ara-primary)] text-white font-semibold hover:opacity-90"
              >
                동의하고 닫기
              </button>
            </div>
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
    <>
      <div className="py-2">
        <CheckboxSquare checked={checked} onChange={onChange} label={label} required={required} />
      </div>
      <div className="py-2">
        {onDetail ? (
          <button
            type="button"
            onClick={onDetail}
            className="text-[var(--ara-primary)] hover:underline font-semibold whitespace-nowrap"
          >
            세부보기
          </button>
        ) : (
          <span className="inline-block w-[72px]" />
        )}
      </div>
    </>
  );
}

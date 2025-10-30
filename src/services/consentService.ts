// 로컬스토리지에 보관하는 Step1 동의 드래프트

const KEY = 'ara.signup.consent';

export type ConsentDraft = {
  tos_agreed: boolean;
  privacy_agreed: boolean;
  marketing_agreed?: boolean;
  age_ok: boolean; // ✅ 문제의 필드
};

// 기본값
const DEFAULTS: ConsentDraft = {
  tos_agreed: false,
  privacy_agreed: false,
  marketing_agreed: false,
  age_ok: false,
};

function isBool(x: any): x is boolean {
  return typeof x === 'boolean';
}

/**
 * 과거 스키마(예: age, ageOk 등)와도 호환되게 안전 파서
 */
function coerceDraft(raw: any): ConsentDraft {
  if (!raw || typeof raw !== 'object') return { ...DEFAULTS };

  const tos_agreed = isBool(raw.tos_agreed) ? raw.tos_agreed : false;
  const privacy_agreed = isBool(raw.privacy_agreed) ? raw.privacy_agreed : false;
  const marketing_agreed = isBool(raw.marketing_agreed) ? raw.marketing_agreed : false;

  // ✅ 이전 키 호환 처리: age / ageOk / age_ok 중 존재하는 값 사용
  const age_ok =
    isBool(raw.age_ok) ? raw.age_ok :
    isBool(raw.age) ? raw.age :
    isBool(raw.ageOk) ? raw.ageOk :
    false;

  return { tos_agreed, privacy_agreed, marketing_agreed, age_ok };
}

export function readConsentDraft(): ConsentDraft | null {
  try {
    const txt = localStorage.getItem(KEY);
    if (!txt) return null;
    const parsed = JSON.parse(txt);
    return coerceDraft(parsed);
  } catch {
    return null;
  }
}

export function saveConsentDraft(partial: Partial<ConsentDraft>): void {
  const prev = readConsentDraft() ?? { ...DEFAULTS };
  // ✅ age_ok 포함해서 병합 저장
  const next: ConsentDraft = {
    ...prev,
    ...partial,
    // 어떤 이유로 undefined가 들어와도 안전하게 보정
    tos_agreed: !!(partial.tos_agreed ?? prev.tos_agreed),
    privacy_agreed: !!(partial.privacy_agreed ?? prev.privacy_agreed),
    marketing_agreed: !!(partial.marketing_agreed ?? prev.marketing_agreed),
    age_ok: !!(partial.age_ok ?? prev.age_ok),
  };
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearConsentDraft(): void {
  localStorage.removeItem(KEY);
}

export async function persistConsentToServer(
  userId: string,
  consents: ConsentDraft
): Promise<void> {
  // TODO: 여기서 실제 서버 반영 로직(supabase rpc/insert 등) 연결
  return;
}
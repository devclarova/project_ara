/**
 * 개인정보 수집 및 이용 동의 관리 서비스(Privacy Consent & Compliance Service):
 * - 목적(Why): 서비스 가입 시 법적 규제 준수를 위한 약관 동의 상태를 관리하고 안전하게 처리함
 * - 방법(How): 로컬 스토리지 기반의 드래프트 시스템을 통해 가입 단계 간 상태를 유지하며, 레거시 스키마 호환성 파서를 통해 데이터 무결성을 보장함
 */
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

function isBool(x: unknown): x is boolean {
  return typeof x === 'boolean';
}

/**
 * 과거 스키마(예: age, ageOk 등)와도 호환되게 안전 파서
 */
function coerceDraft(raw: unknown): ConsentDraft {
  if (!raw || typeof raw !== 'object') return { ...DEFAULTS };
  const r = raw as Record<string, unknown>;

  const tos_agreed = isBool(r.tos_agreed) ? r.tos_agreed : false;
  const privacy_agreed = isBool(r.privacy_agreed) ? r.privacy_agreed : false;
  const marketing_agreed = isBool(r.marketing_agreed) ? r.marketing_agreed : false;

  // 이전 키 호환 처리: age / ageOk / age_ok 중 존재하는 값 사용
  const age_ok =
    isBool(r.age_ok) ? r.age_ok :
    isBool(r.age) ? r.age :
    isBool(r.ageOk) ? r.ageOk :
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
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  clearConsentDraft,
  readConsentDraft,
  type ConsentDraft,
  persistConsentToServer,
} from './consentService';

export const PROFILE_DRAFT_KEY = 'signup-profile-draft';
const isDupeErr = (msg?: string) =>
  !!msg && (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique'));

/** auth.users → public.users 미러 보장 (멱등, 서버 RPC 없으면 경고만) */
export async function ensureAppUser() {
  const { error } = await supabase.rpc('ensure_app_user');
  if (error) {
    console.warn('[ensure_app_user] error:', error.message);
  }
}

/** 드래프트 로드 (없으면 기본값) */
function readProfileDraftFallback(u: User) {
  let draft: any = null;
  try {
    const raw = localStorage.getItem(PROFILE_DRAFT_KEY);
    if (raw) draft = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  const nickname = (draft?.nickname ?? u.email?.split('@')[0] ?? 'user').toString().trim();
  const gender = (draft?.gender ?? 'Male').toString().trim();
  const birth = (draft?.birthday ?? '2000-01-01').toString().trim();
  const country = draft?.country ? String(draft.country).trim() : null;
  const bio = (draft?.bio ?? '').toString().trim() || null;
  const avatar_url = draft?.pendingAvatarUrl ?? null;

  return { nickname, gender, birth, country, bio, avatar_url };
}

/** 공통: 이미 프로필 있는지 체크 */
async function profileExists(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[profiles exists check]', error);
    return true; // 보수적으로 중단
  }
  return !!data;
}

/** 이메일: 인증 후 첫 로그인 시 프로필 자동 생성 (드래프트+동의 반영 시도) */
export async function createEmailProfileIfMissing(u: User) {
  if (await profileExists(u.id)) return;

  const base = readProfileDraftFallback(u);
  const consent: ConsentDraft | null = readConsentDraft();

  const payload: Record<string, unknown> = {
    user_id: u.id,
    ...base,
    // is_onboarded는 이메일 플로우에선 로그인 시점 auto 생성이므로 false로 시작해도 되고,
    // 페이지 완료 시 true로 올리는 패턴 유지 가능. 여기선 생략(스키마 차이 흡수).
  };

  // profiles에 동의 칼럼이 이미 있다면 포함 (없으면 PostgREST 에러 → 아래서 무시)
  if (consent) {
    (payload as any).tos_agreed = !!consent.tos_agreed;
    (payload as any).privacy_agreed = !!consent.privacy_agreed;
    if (typeof consent.marketing_agreed !== 'undefined') {
      (payload as any).marketing_agreed = !!consent.marketing_agreed;
    }
  }

  const { error } = await supabase.from('profiles').insert(payload);
  if (error && !isDupeErr(error.message)) {
    console.error('[profiles insert(email)]', error);
  } else {
    // 동의 별도 테이블이 있을 수도 있으니 병렬로 저장 시도
    if (consent) {
      void persistConsentToServer(u.id, consent);
      clearConsentDraft();
    }
    try {
      localStorage.removeItem(PROFILE_DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }
}

/** 소셜: 최초 로그인 즉시 기본 프로필 생성 → 페이지에서 업데이트 */
export async function createSocialProfileDefaultsIfMissing(u: User) {
  if (await profileExists(u.id)) return;

  const nickname = (u.email?.split('@')[0] ?? `user_${u.id.slice(0, 8)}`).trim();
  const payload: Record<string, unknown> = {
    user_id: u.id,
    nickname,
    gender: 'Male',
    birthday: '2000-01-01',
    country: null,
    bio: null,
    avatar_url: null,
    is_onboarded: false,
  };

  // 소셜도 동의 드래프트가 이미 있다면 붙여 저장(없으면 무시)
  const consent = readConsentDraft();
  if (consent) {
    (payload as any).tos_agreed = !!consent.tos_agreed;
    (payload as any).privacy_agreed = !!consent.privacy_agreed;
    if (typeof consent.marketing_agreed !== 'undefined') {
      (payload as any).marketing_agreed = !!consent.marketing_agreed;
    }
  }

  const { error } = await supabase.from('profiles').insert(payload);
  if (error && !isDupeErr(error.message)) {
    console.error('[profiles insert(social)]', error);
  } else {
    if (consent) {
      void persistConsentToServer(u.id, consent);
      clearConsentDraft();
    }
  }
}
import { createClient } from '@supabase/supabase-js';
import type { DatabaseWithRPC } from '../types/supabase-augment';

/**
 * Vite 환경변수 유효성 + 형식 보정
 * - 앞뒤 공백 제거
 * - URL 끝 슬래시 제거 (일부 SDK/미들웨어에서 미묘한 차이 방지)
 */
function mustEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const raw = import.meta.env[name];
  if (!raw || typeof raw !== 'string') {
    throw new Error(`[supabase] Missing env: ${name}`);
  }
  const trimmed = raw.trim();
  if (!trimmed) throw new Error(`[supabase] Empty env: ${name}`);
  return trimmed;
}

const SUPABASE_URL = mustEnv('VITE_SUPABASE_URL').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = mustEnv('VITE_SUPABASE_ANON_KEY');

/**
 * 브라우저 환경에서만 sessionStorage 사용
 * - 새로고침: 같은 탭에서는 세션 유지
 * - 탭/브라우저를 닫으면: 세션 삭제 → 재접속 시 로그아웃 상태
 */
const browserSessionStorage =
  typeof window !== 'undefined' && 'sessionStorage' in window
    ? window.sessionStorage
    : undefined;

/**
 * Browser Supabase Client (Typed)
 * - persistSession: 브라우저 세션 스토리지에 세션 유지
 * - autoRefreshToken: 토큰 만료 전 자동 갱신
 * - detectSessionInUrl: OAuth/Email 링크 콜백 쿼리에서 세션 감지
 */
export const supabase = createClient<DatabaseWithRPC>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage: browserSessionStorage, // ✅ localStorage 대신 sessionStorage 사용
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // 필요 시 전역 fetch/headers/logging 등 추가 가능
  // global: { headers: { 'x-foo': 'bar' } },
});

export type SupabaseClientTyped = typeof supabase;
export { SUPABASE_URL, SUPABASE_ANON_KEY };
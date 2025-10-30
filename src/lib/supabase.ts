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
 * Browser Supabase Client (Typed)
 * - persistSession: 브라우저 로컬에 세션 유지
 * - autoRefreshToken: 토큰 만료 전 자동 갱신
 * - detectSessionInUrl: OAuth/Email 링크 콜백 쿼리에서 세션 감지
 */
export const supabase = createClient<DatabaseWithRPC>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // 필요 시 전역 fetch/headers/logging 등 추가 가능
  // global: { headers: { 'x-foo': 'bar' } },
});

export type SupabaseClientTyped = typeof supabase;
export { SUPABASE_URL, SUPABASE_ANON_KEY };
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
 * Custom storage adapter for auto-login functionality
 * - Uses localStorage when "remember me" is checked (persistent across browser restarts)
 * - Uses sessionStorage when unchecked (cleared on browser/tab close)
 */
const customStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    // Check both storages, prioritize sessionStorage if exists
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    
    // Check user preference from localStorage
    const rememberMe = localStorage.getItem('auth-remember-me') === 'true';
    
    if (rememberMe) {
      localStorage.setItem(key, value);
     // Clean up from sessionStorage if it was there
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      // Clean up from localStorage if it was there
      localStorage.removeItem(key);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    // Remove from both to ensure complete cleanup
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

/**
 * Browser Supabase Client (Typed)
 * - Custom storage adapter respects "remember me" preference
 * - autoRefreshToken: 토큰 만료 전 자동 갱신
 * - detectSessionInUrl: OAuth/Email 링크 콜백 쿼리에서 세션 감지
 */
export const supabase = createClient<DatabaseWithRPC>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type SupabaseClientTyped = typeof supabase;
export { SUPABASE_URL, SUPABASE_ANON_KEY };

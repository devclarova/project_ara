/**
 * Supabase 클라이언트 및 인증 상태 관리 엔진(Supabase Client & Auth Orchestration)
 * - 목적: 서비스 전반의 데이터베이스 통신 허브 역할을 수행하며, 보안 정책 및 일관된 데이터 접근 레이어 제공
 * - 방식: 다이나믹 세션 스토리지 어댑터를 통해 "로그인 상태 유지" 옵션에 따른 저장소(Local/Session) 자동 분기 처리
 */
import { createClient } from '@supabase/supabase-js';
import type { DatabaseWithRPC } from '../types/supabase-augment';

/**
 * Vite 환경변수 유효성 검사 및 형식 보정
 * - 목적: 환경변수 누락 방지 및 잘못된 입력값으로 인한 런타임 오류 사전 차단
 * - 방식: 필수 환경변수 존재 여부 확인 후, 앞뒤 공백 제거 및 URL 끝 슬래시 제거를 통한 정규화 수행
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
 * 커스텀 스토리지 어댑터(Custom Storage Adapter)
 * - 목적: 사용자의 "로그인 상태 유지" 선택에 따라 인증 토큰의 영속성 수준을 동적으로 제어
 * - 방식: localStorage(브라우저 종료 후 유지)와 sessionStorage(탭 종료 시 삭제) 간의 상태를 동기화하고, 우선순위에 따라 저장소 분기 처리
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
 * Supabase 클라이언트 인스턴스(Typed Supabase Client)
 * - 목적: 타입 안정성이 보장된 데이터베이스 통신 인터페이스 제공
 * - 방식: 커스텀 스토리지 어댑터를 주입하여 인증 상태 관리 정책을 적용하고, 자동 토큰 갱신 및 URL 세션 감지 활성화
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

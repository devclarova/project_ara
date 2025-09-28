import { createClient } from '@supabase/supabase-js';

// CRA : process.env... 의 환경변수 호출과는 형식이 다름.
// Vite : import.meta.env... 환경변수 호출
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
// 웹브라우저 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 웹 브라우저에 탭이 열려 있는 동안 인증 토큰 자동 갱신
    autoRefreshToken: true,
    // 사용자 세션 정보를 localStorage에 저장해서 웹 브라우저 새로고침
    persistSession: true,
    // URL 인증 세션을 파악해서 OAuth 로그인 등의 콜백을 처리한다.
    detectSessionInUrl: true,
  },
});

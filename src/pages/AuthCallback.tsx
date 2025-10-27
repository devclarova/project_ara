import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';

/**
 * - 인증 콜백 URL 처리
 * - 사용자에게 인증 진행 상태 안내
 * - 자동 인증 처리 완료 안내
 */
function AuthCallback() {
  const [msg, setMsg] = useState<string>('인증 처리 중 ...');
  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error_description') || url.searchParams.get('error');

        if (error) {
          setMsg(`인증/로그인 실패: ${decodeURIComponent(error)}`);
          return;
        }

        if (code) {
          // OAuth: 코드 → 세션 교환
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exErr) {
            setMsg(`소셜 로그인 처리 실패: ${exErr.message}`);
            return;
          }
          setMsg('소셜 로그인 처리 완료! 잠시 후 이동합니다...');
          // 여기서 라우팅 가드가 있으면 SignUp flow로 붙을 것임(프로필 미존재 시)
          return;
        }

        // 이메일 인증 콜백(자동 로그인 없음)
        setMsg('이메일 인증이 완료되었습니다. 로그인 페이지로 이동해 로그인해주세요.');
      } catch (e: any) {
        setMsg(`처리 중 오류가 발생했습니다: ${e?.message ?? 'unknown error'}`);
      }
    })();
  }, []);

  return (
    <div>
      <h2>인증 페이지</h2>
      <div>{msg}</div>
    </div>
  );
}

export default AuthCallback;

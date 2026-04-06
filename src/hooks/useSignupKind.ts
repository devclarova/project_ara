import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { SignupKind } from '@/types/signup';

/**
 * 소셜/이메일 가입 유형 판별기(Signup Type Resolver)
 * - 사용자 세션 메타데이터와 ID 공급자(Identity Provider) 정보를 분석하여 현재 가입 절차의 성격(Social vs Email) 정의
 * - 가입 방식에 따른 UI 흐름 및 분기 로직의 판단 기준 제공
 */
export function useSignupKind() {
  const [signupKind, setSignupKind] = useState<SignupKind>('email');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const provider = data.session?.user?.app_metadata?.provider ?? 'email';
        const identities = data.session?.user?.identities ?? [];
        const isSocial = provider !== 'email' || identities.some(id => id.provider !== 'email');
        if (mounted) setSignupKind(isSocial ? 'social' : 'email');
      } catch {
        if (mounted) setSignupKind('email');
      }
    })();
    return () => { mounted = false; };
  }, []);

  return signupKind;
}
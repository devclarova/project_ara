import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { SignupKind } from '@/types/signup';

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
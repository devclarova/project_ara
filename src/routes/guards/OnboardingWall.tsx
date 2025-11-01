import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function OnboardingWall() {
  const [checking, setChecking] = useState(true);
  const [block, setBlock] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (!u) {
        setBlock(false);
        setChecking(false);
        return;
      }

      const provider = (u.app_metadata?.provider as string | undefined) ?? 'email';
      if (provider !== 'email') {
        const { data: prof } = await supabase
          .from('profiles')
          .select('is_onboarded')
          .eq('user_id', u.id)
          .maybeSingle();
        setBlock(!prof?.is_onboarded);
      } else {
        setBlock(false);
      }
      setChecking(false);
    })();
  }, [loc.pathname]);

  if (checking) return null;
  if (block && loc.pathname !== '/signup/social') {
    return <Navigate to="/signup/social" replace />;
  }
  return <Outlet />;
}

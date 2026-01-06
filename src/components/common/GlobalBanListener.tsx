import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { addYears } from 'date-fns';
import { toast } from 'sonner';

export const GlobalBanListener: React.FC = () => {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`ban-listener-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: any) => {
          const newProfile = payload.new;
          if (newProfile && newProfile.banned_until) {
            const bannedUntil = new Date(newProfile.banned_until);
            const now = new Date();
            
            // If ban is expired, ignore
            if (bannedUntil <= now) return;

            // Check for Permanent Ban (> 50 years)
            const permanentThreshold = addYears(now, 50);
            const isPermanent = bannedUntil > permanentThreshold;

            if (isPermanent) {
              toast.error('계정이 영구적으로 정지되었습니다.', {
                description: '관리자에 의해 계정 사용이 영구적으로 제한되었습니다.',
                duration: Infinity,
              });
              // Give a small delay for toast to be seen? No, immediate action is safer/better UX for "perm ban" usually means "get out"
              // But a tiny delay helps avoiding race conditions or jarring effect
              setTimeout(() => {
                 signOut();
              }, 1000);
            } else {
              // Temporary Ban
              toast.warning('계정 이용이 제한되었습니다.', {
                 description: `관리자에 의해 ${bannedUntil.toLocaleDateString()}까지 이용이 제한됩니다.`,
                 duration: 5000,
              });
              // Ideally we'd trigger a context refresh here to disable write buttons,
              // but since writes are blocked by RLS and components often check `user` from context
              // we might want to reload the window or force an auth refresh if the context doesn't auto-update profile data deep inside session.
              // For now, toast is sufficient for notification. Logic elsewhere handles the disabling.
              // However, to ensure the UI updates specifically for "banned" state (like disabling inputs),
              // a page reload is the surest way if we don't have a global "refreshProfile" method.
              // Let's reload to be safe and ensure all "banned" checks re-run.
              setTimeout(() => {
                  window.location.reload();
              }, 1500);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, signOut]);

  return null;
};

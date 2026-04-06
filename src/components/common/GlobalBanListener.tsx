/**
 * 전역 계정 제재 실시간 감시 엔진(Global Account Sanction Real-time Monitor):
 * - 목적(Why): 서비스 이용 중 관리자에 의해 계정이 정지될 경우 이를 즉각적으로 감지하여 부적절한 활동을 차단함
 * - 방법(How): Supabase Realtime 채널을 통해 프로필 테이블의 제재 상태(banned_until) 변화를 구독하고, 탐지 시 세션 종료(signOut) 또는 강제 리로드로 보안 가드를 실행함
 */
import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { addYears } from 'date-fns';
import { toast } from 'sonner';

export const GlobalBanListener: React.FC = () => {
  const { user, signOut, bannedUntil: initialBannedUntil } = useAuth();
  const lastNotifiedBanRef = React.useRef<string | null>(initialBannedUntil);

  useEffect(() => {
    if (!user) {
       lastNotifiedBanRef.current = null;
       return;
    }
    
    // Session State Sync: Synchronizes the ban reference pointer upon authentication state transitions.
    lastNotifiedBanRef.current = initialBannedUntil;

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
            // Deduplication Logic: Prevents redundant notifications for identical ban timestamps to improve UX.
            if (lastNotifiedBanRef.current === newProfile.banned_until) return;

            const bannedUntil = new Date(newProfile.banned_until);
            const now = new Date();
            
            // Stale Record Filtering: Ignores notifications if the ban period has already concluded at the time of update.
            if (bannedUntil <= now) {
               lastNotifiedBanRef.current = newProfile.banned_until;
               return;
            }

            lastNotifiedBanRef.current = newProfile.banned_until;

            // Indefinite Restriction Logic: Discriminates persistent bans (50Y+ threshold) from temporary suspensions.
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
              // Temporary Suspension Workflow: Notifies the user and triggers a global UI refresh to enforce permission constraints.
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

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { retryWithBackoff, isOnline } from '@/utils/networkUtils';

/**
 * 전역 사용자 활동 및 접속 상태 추적 엔진(Global User Activity & Presence Tracking Engine):
 * - 목적(Why): 서비스 내 사용자의 실시간 접속 여부(is_online)와 마지막 활동 시간을 동기화하여 커뮤니티 활성도를 가시화함
 * - 방법(How): 30초 단위의 하트비트(Heartbeat), 가시성 API(Visibility API), 그리고 언로드(BeforeUnload) 이벤트를 바인딩하여 프로필 테이블의 메타데이터를 원자적으로 업데이트함
 */
export const GlobalUserStatusTracker = () => {
  const { user } = useAuth();
  const lastUpdateRef = useRef<{ time: number; status: boolean | null }>({ time: 0, status: null });
  const isUnloadingRef = useRef(false);
  const isRetryingRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Synchronization Engine: Dispatches remote updates to the profile table to synchronize 'is_online' and 'last_active_at' metadata.
    const updateStatus = async (online: boolean, force = false) => {
      // 오프라인이거나 사용자가 없거나 이미 재시도 중이면 중단
      if (!isOnline() || !user || isRetryingRef.current) return;

      const now = Date.now();
      // 쓰로틀링: 상태가 같고 5초 이내면 업데이트 스킵 (force가 아닐 때만)
      if (!force && lastUpdateRef.current.status === online && (now - lastUpdateRef.current.time) < 5000) {
        return;
      }

      const performUpdate = async () => {
        const { error } = await (supabase.from('profiles') as any)
          .update({ 
            is_online: online,
            last_active_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        if (error) throw error;
      };

      try {
        if (force) {
          // 강제 업데이트(초기화/언로드) 시에는 즉시 실행
          await performUpdate();
        } else {
          // 일반 하트비트는 재시도 로직 적용
          isRetryingRef.current = true;
          await retryWithBackoff(performUpdate, {
            maxAttempts: 2,
            shouldRetry: (err: any) => {
              const msg = err?.message?.toLowerCase() || '';
              return msg.includes('fetch') || msg.includes('network');
            }
          });
        }
        lastUpdateRef.current = { time: now, status: online };
      } catch (err: unknown) {
        // 네트워크 페치 실패(Failed to fetch) 등은 하트비트 수준에서는 무시 (다음 주기에 다시 시도)
        if (!isUnloadingRef.current) {
          const error = err as Error;
          const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');
          const isPostgrestError = (error as unknown as { code: string })?.code === 'PGRST116';
          if (!isNetworkError && !isPostgrestError) {
             console.warn('[StatusTracker] Update failed:', error.message || error);
          }
        }
      } finally {
        isRetryingRef.current = false;
      }
    };

    // 초기 온라인 설정 (강제)
    updateStatus(true, true);

    // Availability Heartbeat: Executes a 30-second periodic update to maintain real-time presence accuracy.
    const heartbeatInterval = setInterval(() => {
      updateStatus(true);
    }, 1000 * 30); 

    // Page Visibility Binding: Synchronizes state immediately upon window focus or document visibility transitions.
    const handleFocus = () => updateStatus(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateStatus(true);
      }
    };

    const handleBeforeUnload = () => {
      isUnloadingRef.current = true;
      // 언로드 시에는 비동기 페치가 취소될 수 있으므로, 결과 로깅 없이 시도만 함
      updateStatus(false, true);
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeatInterval);
      
      // 언로딩 상태가 아닐 때(컴포넌트만 언마운트될 때) 오프라인 처리
      if (!isUnloadingRef.current) {
        updateStatus(false, true);
      }
    };
  }, [user?.id]); // user 객체 전체 대신 id 사용

  return null; // UI는 없음
};

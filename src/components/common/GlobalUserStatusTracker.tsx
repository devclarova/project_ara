import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * GlobalUserStatusTracker
 * - 사용자의 접속 상태(is_online)와 마지막 활동 시간(last_active_at)을 실시간으로 업데이트합니다.
 * - 이 정보는 관리자 페이지 및 다른 사용자에게 '현재 접속 중' 여부를 알려주는 데 사용됩니다.
 */
export const GlobalUserStatusTracker = () => {
  const { user, profileId } = useAuth();

  useEffect(() => {
    if (!user) return;

    // 1. 상태 업데이트 함수
    const updateStatus = async (online: boolean) => {
      // 오프라인이거나 사용자가 없으면 중단
      if (!window.navigator.onLine || !user) return;

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_online: online,
            last_active_at: new Date().toISOString(),
          })
          .eq('user_id', user.id); // profiles 테이블의 user_id 컬럼과 auth.users.id 매칭
        
        if (error) {
          // 406 Not Acceptable 등 무의미한 에러 로깅 제외 (세션 만료 등)
          if (error.code !== 'PGRST116') {
             console.warn('[StatusTracker] Update failed:', error.message);
          }
        }
      } catch (err) {
        // 네트워크 페치 실패 등은 조용히 무시 (이미 onLine 체크 함)
      }
    };

    // 초기 온라인 설정
    updateStatus(true);

    // 2. 주기적인 하트비트 (30초마다 갱신하여 관리자 페이지 실시간성 유지)
    const heartbeatInterval = setInterval(() => {
      updateStatus(true);
    }, 1000 * 30); 

    // 3. 브라우저 포커스 기반 업데이트 (포커스 잃었을 때 즉시 오프라인으로 만들지 않고 하트비트에 맡김)
    const handleFocus = () => updateStatus(true);
    
    // blur 시 오프라인 처리는 모바일이나 탭 전환 시 너무 잦게 발생하므로 제거하거나 신중하게 처리
    // 여기서는 활동 중인 것만 명확히 트래킹하고, beforeunload 시에만 명시적 종료 시도
    
    window.addEventListener('focus', handleFocus);
    
    // 4. 페이지 가시성/종료 이벤트 기반 오프라인 처리 보강
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 백그라운드에서 포그라운드로 올 때 즉시 하트비트/시간 갱신
        updateStatus(true);
      }
    };

    // 5. 윈도우 종료/새로고침 시 오프라인 처리 시도
    const handleBeforeUnload = () => {
      // 이 시점에는 비동기 처리가 보장되지 않으므로, 최대한 시도만 함.
      // 실제 정확한 오프라인 처리는 Presence(웹소켓 끊김) 가 담당함.
      updateStatus(false);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeatInterval);
      updateStatus(false);
    };
  }, [user]);

  return null; // UI는 없음
};

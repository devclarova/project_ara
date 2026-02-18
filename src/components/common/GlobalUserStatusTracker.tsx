import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * GlobalUserStatusTracker
 * - 사용자의 접속 상태(is_online)와 마지막 활동 시간(last_active_at)을 실시간으로 업데이트합니다.
 * - 이 정보는 관리자 페이지 및 다른 사용자에게 '현재 접속 중' 여부를 알려주는 데 사용됩니다.
 */
export const GlobalUserStatusTracker = () => {
  const { user } = useAuth();
  const lastUpdateRef = useRef<{ time: number; status: boolean | null }>({ time: 0, status: null });
  const isUnloadingRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    // 1. 상태 업데이트 함수
    const updateStatus = async (online: boolean, force = false) => {
      // 오프라인이거나 사용자가 없으면 중단
      if (!window.navigator.onLine || !user) return;

      const now = Date.now();
      // 쓰로틀링: 상태가 같고 5초 이내면 업데이트 스킵 (force가 아닐 때만)
      if (!force && lastUpdateRef.current.status === online && (now - lastUpdateRef.current.time) < 5000) {
        return;
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_online: online,
            last_active_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        if (error) {
          // 언로드 중이 아닐 때만 유의미한 에러 로깅
          if (!isUnloadingRef.current && error.code !== 'PGRST116') {
             console.warn('[StatusTracker] Update failed:', error.message);
          }
        } else {
          lastUpdateRef.current = { time: now, status: online };
        }
      } catch (err) {
        // 네트워크 페치 실패(Failed to fetch) 등은 언로드 중일 가능성이 높으므로 로깅 제외
        if (!isUnloadingRef.current) {
          // console.debug('[StatusTracker] Network error during update');
        }
      }
    };

    // 초기 온라인 설정 (강제)
    updateStatus(true, true);

    // 2. 주기적인 하트비트 (30초마다 갱신)
    const heartbeatInterval = setInterval(() => {
      updateStatus(true);
    }, 1000 * 30); 

    // 3. 브라우저/가시성 이벤트 기반 업데이트
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

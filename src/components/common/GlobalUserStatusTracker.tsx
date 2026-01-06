import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * GlobalUserStatusTracker
 * - 사용자의 접속 상태(is_online)와 마지막 활동 시간(last_active_at)을 실시간으로 업데이트합니다.
 * - 이 정보는 관리자 페이지 및 다른 사용자에게 '현재 접속 중' 여부를 알려주는 데 사용됩니다.
 */
export const GlobalUserStatusTracker = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // 1. 상태 업데이트 함수
    const updateStatus = async (online: boolean) => {
      try {
        // 불필요한 DB 요청 방지 (현재 세션에서의 최신 상태를 간단히 캐싱하거나, 체크 후 업데이트)
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_online: online,
            last_active_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        if (error) {
          // RLS 혹은 네트워크 오류 발생 시 로깅
          console.error('Supabase status update error:', error.message);
        }
      } catch (err) {
        console.error('Failed to update online status:', err);
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
    
    // 종료 시 오프라인 처리 (완벽하지 않을 수 있으나 시도)
    const handleUnload = () => {
      // Beacon API 등을 쓰지 않으면 비동기 처리가 씹힐 수 있음
      updateStatus(false);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(heartbeatInterval);
      // 컴포넌트 언마운트 시 (로그아웃 등) 오프라인 처리
      updateStatus(false);
    };
  }, [user]);

  return null; // UI는 없음
};

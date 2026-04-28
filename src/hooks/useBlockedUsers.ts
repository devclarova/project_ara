import { useBlockedUsersContext } from '@/contexts/BlockedUsersContext';

/**
 * 전역 차단 사용자 동기화 엔진(Global Blocked User Sync Engine):
 * - 목적(Why): 현재 사용자가 차단한 전체 유저 리스트 및 ID 셋(Set)을 관리하여 서비스 전역의 콘텐츠 필터링 데이터를 제공함
 * - 방법(How): BlockedUsersContext를 통해 중앙 집중식으로 데이터를 공급받으며, 중복 요청을 방지함
 */
export function useBlockedUsers() {
  const { blockedIds, blockingMeIds, blockedUsers, isLoading, unblock } = useBlockedUsersContext();

  return {
    blockedIds,
    blockingMeIds,
    blockedUsers,
    isLoading,
    unblockMutation: {
      mutate: unblock
    }
  };
}

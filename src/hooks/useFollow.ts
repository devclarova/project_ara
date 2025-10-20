import { useEffect, useState } from 'react';

export function useFollow(handle: string) {
  const [isFollowing, setIsFollowing] = useState(false);

  // ✅ 팔로우 상태 불러오기
  useEffect(() => {
    const stored = localStorage.getItem('followedUsers');
    if (stored) {
      const followedList = JSON.parse(stored);
      setIsFollowing(followedList.includes(handle));
    }
  }, [handle]);

  // ✅ 상태 토글 및 저장
  const toggleFollow = () => {
    setIsFollowing(prev => {
      const nextState = !prev;
      const stored = localStorage.getItem('followedUsers');
      const followedList = stored ? JSON.parse(stored) : [];

      const updatedList = nextState
        ? [...new Set([...followedList, handle])] // 추가
        : followedList.filter((h: string) => h !== handle); // 제거

      localStorage.setItem('followedUsers', JSON.stringify(updatedList));
      return nextState;
    });
  };

  return { isFollowing, toggleFollow };
}

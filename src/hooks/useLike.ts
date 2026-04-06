/**
 * 콘텐츠 상호작용 및 반응 관리 엔진(Content Interaction & Reaction Engine):
 * - 목적(Why): 특정 콘텐츠에 대한 사용자의 선호도(좋아요) 상태를 즉각적으로 반영하고 영속화함
 * - 방법(How): 로컬 스토리지 기반의 상태 캐싱을 통해 런타임 성능을 최적화하며, 낙관적 업데이트(Optimistic Update) 패턴으로 UI 응답성을 극대화함
 */
import { useEffect, useState } from 'react';

export function useLike(id: string, initialCount: number) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  // ✅ 로컬스토리지에서 좋아요 상태 불러오기
  useEffect(() => {
    const stored = localStorage.getItem('likedTweets');
    if (stored) {
      const list = JSON.parse(stored);
      if (list.includes(id)) setLiked(true);
    }
  }, [id]);

  // ✅ 상태 토글 및 저장
  const toggleLike = () => {
    setLiked(prev => {
      const next = !prev;
      const stored = localStorage.getItem('likedTweets');
      const list = stored ? JSON.parse(stored) : [];

      const updatedList = next
        ? [...new Set([...list, id])] // 추가
        : list.filter((tid: string) => tid !== id); // 제거

      localStorage.setItem('likedTweets', JSON.stringify(updatedList));
      setCount(prevCount => (next ? prevCount + 1 : prevCount - 1));
      return next;
    });
  };

  return { liked, count, toggleLike };
}

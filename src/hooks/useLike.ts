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

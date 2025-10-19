import { useEffect, useState } from 'react';

export function useRetweet(id: string, initialCount: number) {
  const [retweeted, setRetweeted] = useState(false);
  const [count, setCount] = useState(initialCount);

  // ✅ 로컬 스토리지에서 불러오기
  useEffect(() => {
    const stored = localStorage.getItem('retweetedTweets');
    if (stored) {
      const list = JSON.parse(stored);
      if (list.includes(id)) setRetweeted(true);
    }
  }, [id]);

  // ✅ 상태 토글 및 저장
  const toggleRetweet = () => {
    setRetweeted(prev => {
      const next = !prev;
      const stored = localStorage.getItem('retweetedTweets');
      const list = stored ? JSON.parse(stored) : [];

      const updatedList = next
        ? [...new Set([...list, id])] // 추가
        : list.filter((tid: string) => tid !== id); // 제거

      localStorage.setItem('retweetedTweets', JSON.stringify(updatedList));
      setCount(prevCount => (next ? prevCount + 1 : prevCount - 1));
      return next;
    });
  };

  return { retweeted, count, toggleRetweet };
}

import { useEffect, useRef, useCallback } from 'react';

/**
 * 무한 스크롤을 위한 훅
 * @param callback 교차 시 실행할 함수
 * @param hasMore 더 불러올 데이터가 있는지 여부
 * @param isLoading 현재 로딩 중인지 여부
 * @param threshold 교차 임계값 (0.0 ~ 1.0)
 */
export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  isLoading: boolean,
  threshold = 1.0
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoading) {
        callback();
      }
    },
    [callback, hasMore, isLoading]
  );

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null, // viewport 기준
      rootMargin: '20px', // 미리 로드하기 위해 약간의 여유를 둠
      threshold,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, threshold]);

  return targetRef;
}

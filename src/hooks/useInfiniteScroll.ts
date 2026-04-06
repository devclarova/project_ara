import { useEffect, useRef, useCallback } from 'react';

/**
 * 고성능 무한 스크롤 인터페이스(High-performance Infinite Scroll Interface):
 * - 목적(Why): 뷰포트 하단 도달을 감지하여 대규모 데이터 페칭을 최적화하고 사용자 경험을 개선함
 * - 방법(How): Intersection Observer API를 활용하여 메인 스레드 부하를 최소화하고 관찰자 연결을 효율적으로 제어함
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
      root: null, // 뷰포트를 기준으로 관찰
      rootMargin: '20px', // 데이터 페칭 시점을 앞당기기 위한 여유 마진 설정
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

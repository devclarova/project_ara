import { useEffect, useRef } from 'react';

export function useBodyScrollLock(lock: boolean) {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!lock) return;

    // 모달 오픈 시 클래스 추가
    document.body.classList.add('prevent-scroll');
    document.documentElement.classList.add('prevent-scroll');

    const preventScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // 1. 모달 래퍼(허용 영역) 찾기
      const scrollWrapper = target.closest('[data-scroll-lock-scrollable]') as HTMLElement;
      
      // [Case 1] 허용 영역 바깥 -> 무조건 차단
      if (!scrollWrapper) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      // 2. 방향 계산
      let deltaY = 0;
      let deltaX = 0;

      if (e.type === 'touchmove') {
        const touchEvent = e as TouchEvent;
        if (touchStartY.current === null || touchStartX.current === null) return;
        deltaY = touchStartY.current - touchEvent.touches[0].clientY; // 양수: 아래로(Up gesture)
        deltaX = touchStartX.current - touchEvent.touches[0].clientX;
      } else if (e.type === 'wheel') {
        const wheelEvent = e as WheelEvent;
        deltaY = wheelEvent.deltaY;
        deltaX = wheelEvent.deltaX;
      }

      // [Case 2] 수평 스크롤(Swipe) 의도 -> 허용
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        return;
      }

      // [Case 3] 수직 스크롤: 실제 스크롤 가능한 부모가 있는지 탐색 (Recursive Check)
      let el = target;
      let canScroll = false;

      while (el) {
        // 스타일 확인
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const isScrollableStyle = overflowY === 'auto' || overflowY === 'scroll';
        
        // 실제 스크롤 가능 여부 확인 (내용이 넘치는지)
        if (isScrollableStyle && el.scrollHeight > el.clientHeight) {
          // 방향에 따른 여유 공간 확인
          const isAtTop = el.scrollTop <= 0;
          const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1; // 1px 오차 허용

          // 위로 스크롤(내용 내리기) 시도 시 -> Top이 아니면 가능
          if (deltaY < 0 && !isAtTop) {
            canScroll = true;
            break;
          }
          // 아래로 스크롤(내용 올리기) 시도 시 -> Bottom이 아니면 가능
          if (deltaY > 0 && !isAtBottom) {
            canScroll = true;
            break;
          }
        }

        // 래퍼까지 검사했으면 중단 (더 상위의 Body로 넘어가지 않음)
        if (el === scrollWrapper) break;
        
        el = el.parentElement as HTMLElement;
      }

      // 스크롤 가능한 요소를 못 찾았거나(짧은 모달), 찾았지만 끝에 도달함(긴 모달)
      // -> 바깥 전파 차단
      if (!canScroll) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const preventKeys = (e: KeyboardEvent) => {
      const keys = [' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT', 'Editable'].includes(target.tagName) || target.isContentEditable;
      if (isInput) return;

      const scrollWrapper = target.closest('[data-scroll-lock-scrollable]');
      if (!scrollWrapper && keys.includes(e.key)) {
        e.preventDefault();
      }
    };

    const options = { passive: false };

    window.addEventListener('wheel', preventScroll, options);
    window.addEventListener('touchmove', preventScroll, options);
    window.addEventListener('touchstart', handleTouchStart, options);
    window.addEventListener('keydown', preventKeys, options);

    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', preventKeys);
      
      document.body.classList.remove('prevent-scroll');
      document.documentElement.classList.remove('prevent-scroll');
    };
  }, [lock]);
}

import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // 1. 해시가 있으면 해당 위치로 스크롤 (댓글 하이라이트 등)
    const isValidIdHash = /^#[A-Za-z][\w-]*$/.test(hash || '');
    if (isValidIdHash) {
      const el = document.querySelector(hash!);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // 2. 뒤로가기(POP)거나 단순 상태 변경(REPLACE)인 경우 스크롤 무시
    // 이렇게 해야 브라우저/Home.tsx의 복원 로직과 충돌하지 않음
    if (navType === 'POP' || navType === 'REPLACE') {
      prevPathname.current = pathname;
      return;
    }

    // 3. 새로운 경로로 이동(PUSH)할 때만 최상단으로 이동
    if (navType === 'PUSH' && pathname !== prevPathname.current) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    prevPathname.current = pathname;
  }, [pathname, hash, navType]);

  return null;
}

export default ScrollToTop;

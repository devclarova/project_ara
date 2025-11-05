import React, { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // 🔹 finalhome 경로 판별 (/finalhome, /finalhome/abc 다 포함하고 싶으면 startsWith 사용)
    const isFinalHome = pathname === '/finalhome' || pathname.startsWith('/finalhome/');

    // 🔹 1) 해시가 id 형태(#section-1)이면 그 위치로 스크롤
    const isValidIdHash = /^#[A-Za-z][\w-]*$/.test(hash || '');
    if (isValidIdHash) {
      const el = document.querySelector(hash!);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // 🔹 2) 뒤로가기/앞으로가기(POP)일 땐 브라우저가 알아서 스크롤 복원하게 두기
    //     → 여기서 return 하면, back/forward 시에는 더 이상 0,0으로 안 올라감
    if (navType === 'POP') {
      return;
    }

    // 🔹 3) 그 외 (PUSH/REPLACE)지만 finalhome인 경우에는 건드리지 않기
    if (isFinalHome) {
      return;
    }

    // 🔹 4) 나머지 경우는 항상 맨 위로
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash, navType]);

  return null;
}

export default ScrollToTop;

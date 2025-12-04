import React, { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // sns 계열은 전혀 건드리지 않기
    if (pathname.startsWith('/sns')) {
      return;
    }

    const isValidIdHash = /^#[A-Za-z][\w-]*$/.test(hash || '');
    if (isValidIdHash) {
      const el = document.querySelector(hash!);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    if (navType === 'POP') {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash, navType]);

  return null;
}

export default ScrollToTop;

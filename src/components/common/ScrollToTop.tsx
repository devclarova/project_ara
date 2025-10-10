import React, { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    if (navType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [pathname, hash, navType]);

  return null;
}

export default ScrollToTop;

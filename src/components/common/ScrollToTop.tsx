/**
 * 라우팅 연동 자동 스크롤 관리자(Routing-linked Auto-scroll Manager):
 * - 목적(Why): 페이지 전환(Navigation)이나 해시 라우팅 시 사용자에게 최적화된 뷰포트 시작 지점을 제공함
 * - 방법(How): React Router의 위치(Location) 변화 및 탐색 유형(POP/PUSH)을 감지하여 뷰포트를 원점으로 리셋하거나 특정 앵커로 부드럽게 이동시킴
 */
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

function ScrollToTop() {
  const location = useLocation();
  const { pathname, hash } = location;
  const navType = useNavigationType();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Anchor Routing: Smoothly scrolls to the target element if a valid ID hash is present in the URL.
    const isValidIdHash = /^#[A-Za-z][\w-]*$/.test(hash || '');
    if (isValidIdHash) {
      const el = document.querySelector(hash!);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // History Normalization: Preserves custom scroll offsets for POP and REPLACE navigation types to maintain UX consistency during back/forward actions.
    if (navType === 'POP' || navType === 'REPLACE') {
      prevPathname.current = pathname;
      return;
    }

    // Viewport Reset: Forces the scroll position back to the origin upon PUSH navigation to a fresh route.
    if (navType === 'PUSH' && pathname !== prevPathname.current) {
      const state = location.state as { fromAdmin?: boolean; highlightCommentId?: string } | null;
      // Only skip if we have a specific element to jump to (comment highlight)
      if (!state?.fromAdmin || !state?.highlightCommentId) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }

    prevPathname.current = pathname;
  }, [pathname, hash, navType]);

  return null;
}

export default ScrollToTop;

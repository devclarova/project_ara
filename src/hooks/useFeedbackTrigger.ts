/**
 * 피드백 자동 트리거 훅 (Feedback Auto-Trigger Hook)
 * - 목적: 사용자의 서비스 이용 패턴에 따라 적절한 시점에 피드백 모달을 자동으로 노출
 * - 전략: 2단계 트리거 → 1회차(3분+2페이지), 2회차(dismiss 후 10분+5페이지 추가), 완료 시 영구 비노출
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const FEEDBACK_STATUS_KEY = 'ara_feedback_status';
const FIRST_VISIT_TIME_KEY = 'ara_first_visit_time';
const DISMISS_TIME_KEY = 'ara_feedback_dismiss_time';
const PAGE_COUNT_KEY = 'ara_page_visit_count';
const DISMISS_PAGE_COUNT_KEY = 'ara_dismiss_page_count';

type FeedbackStatus = 'none' | 'dismissed' | 'completed';

function getStatus(): FeedbackStatus {
  return (localStorage.getItem(FEEDBACK_STATUS_KEY) as FeedbackStatus) || 'none';
}

function getPageCount(): number {
  return parseInt(sessionStorage.getItem(PAGE_COUNT_KEY) || '0', 10);
}

function setPageCount(count: number) {
  sessionStorage.setItem(PAGE_COUNT_KEY, String(count));
}

function getDismissPageCount(): number {
  return parseInt(sessionStorage.getItem(DISMISS_PAGE_COUNT_KEY) || '0', 10);
}

function setDismissPageCount(count: number) {
  sessionStorage.setItem(DISMISS_PAGE_COUNT_KEY, String(count));
}

export function useFeedbackTrigger() {
  const { user } = useAuth();
  const location = useLocation();
  const [shouldShow, setShouldShow] = useState(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 페이지 방문 카운트 — 라우트 변경 시마다 증가
  useEffect(() => {
    if (!user) return;
    const status = getStatus();
    if (status === 'completed') return;

    const newCount = getPageCount() + 1;
    setPageCount(newCount);
  }, [location.pathname, user]);

  // 첫 방문 시각 기록
  useEffect(() => {
    if (!user) return;
    if (!localStorage.getItem(FIRST_VISIT_TIME_KEY)) {
      localStorage.setItem(FIRST_VISIT_TIME_KEY, String(Date.now()));
    }
  }, [user]);

  // 주기적 조건 체크 — 30초마다 확인
  useEffect(() => {
    if (!user) return;

    const check = () => {
      const status = getStatus();
      if (status === 'completed') return;

      const now = Date.now();
      const firstVisit = parseInt(localStorage.getItem(FIRST_VISIT_TIME_KEY) || '0', 10);
      const pageCount = getPageCount();

      if (status === 'none') {
        // 1회차: 첫 방문 후 3분(180000ms) 경과 + 2페이지 이상 방문
        const elapsed = now - firstVisit;
        if (elapsed >= 180_000 && pageCount >= 2) {
          setShouldShow(true);
        }
      } else if (status === 'dismissed') {
        // 2회차: dismiss 후 10분(600000ms) 경과 + dismiss 시점 이후 5페이지 추가 방문
        const dismissTime = parseInt(localStorage.getItem(DISMISS_TIME_KEY) || '0', 10);
        const elapsed = now - dismissTime;
        const additionalPages = pageCount - getDismissPageCount();
        if (elapsed >= 600_000 && additionalPages >= 5) {
          setShouldShow(true);
        }
      }
    };

    // 초기 체크 + 30초 간격
    check();
    checkIntervalRef.current = setInterval(check, 30_000);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [user]);

  // dismiss 처리 — 자동 트리거를 닫았을 때
  const onDismiss = useCallback(() => {
    const status = getStatus();
    if (status === 'none') {
      localStorage.setItem(FEEDBACK_STATUS_KEY, 'dismissed');
      localStorage.setItem(DISMISS_TIME_KEY, String(Date.now()));
      setDismissPageCount(getPageCount());
    } else if (status === 'dismissed') {
      // 2회차에서도 dismiss → completed로 전환하여 더 이상 노출하지 않음
      localStorage.setItem(FEEDBACK_STATUS_KEY, 'completed');
    }
    setShouldShow(false);
  }, []);

  // 제출 완료 처리 — 영구 비노출
  const onComplete = useCallback(() => {
    localStorage.setItem(FEEDBACK_STATUS_KEY, 'completed');
    setShouldShow(false);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
  }, []);

  return {
    shouldShow,
    isAutoTriggered: shouldShow,
    onDismiss,
    onComplete,
  };
}

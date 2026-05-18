/**
 * 피드백 자동 트리거 훅 (Feedback Auto-Trigger Hook)
 * - 목적: 사용자의 서비스 이용 패턴에 따라 적절한 시점에 피드백 모달을 자동으로 노출
 * - 전략: 단일 단계 트리거 → 첫 진입 후 5분 경과 AND 5페이지 이상 방문 시 최대 1회 노출 (사용자별 스코프 격리)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const FEEDBACK_STATUS_KEY = 'ara_feedback_status';
const FIRST_VISIT_TIME_KEY = 'ara_first_visit_time';
const PAGE_COUNT_KEY = 'ara_page_visit_count';

type FeedbackStatus = 'none' | 'dismissed' | 'completed';

// 로그인 사용자별 스코프 key 헬퍼
const getScopedKey = (baseKey: string, userId: string) => `${baseKey}_${userId}`;

function getStatus(userId: string): FeedbackStatus {
  return (localStorage.getItem(getScopedKey(FEEDBACK_STATUS_KEY, userId)) as FeedbackStatus) || 'none';
}

function getPageCount(userId: string): number {
  return parseInt(sessionStorage.getItem(getScopedKey(PAGE_COUNT_KEY, userId)) || '0', 10);
}

function setPageCount(userId: string, count: number) {
  sessionStorage.setItem(getScopedKey(PAGE_COUNT_KEY, userId), String(count));
}

export function useFeedbackTrigger() {
  const { user } = useAuth();
  const location = useLocation();
  const [shouldShow, setShouldShow] = useState(false);
  const [dbChecked, setDbChecked] = useState(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // DB 제출 이력 조회
  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setDbChecked(false);
      setShouldShow(false);
      return;
    }

    // 새로운 user가 유입되는 순간 즉시 dbChecked와 shouldShow를 false로 초기화하여 이전 계정 상태의 race 예방
    setDbChecked(false);
    setShouldShow(false);

    const checkDbHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (error) throw error;

        if (isMounted) {
          if (data && data.length > 0) {
            // 이미 제출 이력이 있다면 사용자 스코프 completed로 보정
            localStorage.setItem(getScopedKey(FEEDBACK_STATUS_KEY, user.id), 'completed');
          }
          setDbChecked(true);
        }
      } catch (err) {
        // 에러 발생 시 기존 로컬 캐시 상태를 신뢰하여 체크 완료 처리하며 로그는 경고 수준으로 최소화
        console.warn('Feedback DB check failed, falling back to local cache.');
        if (isMounted) {
          setDbChecked(true);
        }
      }
    };

    checkDbHistory();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // 페이지 방문 카운트 — 라우트 변경 시마다 증가 (사용자별 격리)
  useEffect(() => {
    if (!user) return;
    const status = getStatus(user.id);
    if (status === 'completed' || status === 'dismissed') return;

    const newCount = getPageCount(user.id) + 1;
    setPageCount(user.id, newCount);
  }, [location.pathname, user]);

  // 첫 방문 시각 기록 (사용자별 격리)
  useEffect(() => {
    if (!user) return;
    const status = getStatus(user.id);
    if (status === 'completed' || status === 'dismissed') return;

    const firstVisitKey = getScopedKey(FIRST_VISIT_TIME_KEY, user.id);
    if (!localStorage.getItem(firstVisitKey)) {
      localStorage.setItem(firstVisitKey, String(Date.now()));
    }
  }, [user]);

  // 주기적 조건 체크 — 30초마다 확인 (사용자별 격리)
  useEffect(() => {
    if (!user || !dbChecked) return;

    const check = () => {
      const status = getStatus(user.id);
      if (status === 'completed' || status === 'dismissed') return;

      const now = Date.now();
      const firstVisitKey = getScopedKey(FIRST_VISIT_TIME_KEY, user.id);
      const firstVisit = parseInt(localStorage.getItem(firstVisitKey) || '0', 10);
      const pageCount = getPageCount(user.id);

      if (status === 'none') {
        // 단일 노출 조건: 첫 진입 후 5분(300,000ms) 경과 AND 5페이지 이상 방문
        const elapsed = now - firstVisit;
        if (elapsed >= 300_000 && pageCount >= 5) {
          // 노출 발생 즉시 사용자 스코프 localStorage를 'dismissed'로 선제 마킹하여 새로고침/이탈 시 재노출 방지
          localStorage.setItem(getScopedKey(FEEDBACK_STATUS_KEY, user.id), 'dismissed');
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
  }, [user, dbChecked]);

  // dismiss 처리 — 자동 트리거를 닫았을 때
  const onDismiss = useCallback(() => {
    if (user) {
      localStorage.setItem(getScopedKey(FEEDBACK_STATUS_KEY, user.id), 'dismissed');
    }
    setShouldShow(false);
  }, [user]);

  // 제출 완료 처리 — 영구 비노출
  const onComplete = useCallback(() => {
    if (user) {
      localStorage.setItem(getScopedKey(FEEDBACK_STATUS_KEY, user.id), 'completed');
    }
    setShouldShow(false);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
  }, [user]);

  return {
    shouldShow,
    isAutoTriggered: shouldShow,
    onDismiss,
    onComplete,
  };
}

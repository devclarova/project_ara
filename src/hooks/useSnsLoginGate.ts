// src/hooks/useSnsLoginGate.ts (가정)

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LOGIN_MODAL_DELAY = 60 * 1000; // 60초
const SNS_STAY_MS_KEY = 'sns-stay-ms';       // SNS/SnsDetail 실제 체류 시간(ms) 누적
const SNS_TIMEOUT_KEY = 'sns-login-timeout'; // 이미 60초 넘긴 세션 플래그

export function useSnsLoginGate(user: any) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  // 이번 "방문"에 대해 언제 SNS에 들어왔는지 기록
  const stayStartRef = useRef<number | null>(null);
  const timerIdRef = useRef<number | null>(null);

  useEffect(() => {
    // 로그인 상태면: 모달 끄고, 누적 시간/타임아웃 모두 초기화
    if (user) {
      setShowLoginModal(false);
      try {
        sessionStorage.removeItem(SNS_STAY_MS_KEY);
        sessionStorage.removeItem(SNS_TIMEOUT_KEY);
      } catch {}
      return;
    }

    let cancelled = false;

    // 🔹 "이번 SNS/SnsDetail 진입 시각" 기록
    const now = Date.now();
    stayStartRef.current = now;

    try {
      // 1) 이미 시간 초과한 적 있으면 → 바로 모달
      const flagged = sessionStorage.getItem(SNS_TIMEOUT_KEY);
      if (flagged === 'true') {
        setShowLoginModal(true);
        return;
      }

      // 2) 지금까지 SNS/SnsDetail에서 보낸 누적 시간(ms) 읽기
      const raw = sessionStorage.getItem(SNS_STAY_MS_KEY) ?? '0';
      const accumulatedMs = Number(raw) || 0;

      // 이미 60초 이상이면 바로 모달
      if (accumulatedMs >= LOGIN_MODAL_DELAY) {
        setShowLoginModal(true);
        sessionStorage.setItem(SNS_TIMEOUT_KEY, 'true');
        return;
      }

      // 3) 남은 시간만큼만 타이머 걸기
      const remaining = LOGIN_MODAL_DELAY - accumulatedMs;

      const id = window.setTimeout(() => {
        if (cancelled) return;
        setShowLoginModal(true);
        try {
          // 이 세션에서는 SNS 체류 시간이 60초 이상인 것으로 마킹
          sessionStorage.setItem(SNS_TIMEOUT_KEY, 'true');
          sessionStorage.setItem(SNS_STAY_MS_KEY, String(LOGIN_MODAL_DELAY));
        } catch {}
      }, remaining);

      timerIdRef.current = id;
    } catch {
      // sessionStorage 문제가 있으면, 그냥 한 번짜리 60초 타이머로 degrade
      const id = window.setTimeout(() => {
        if (cancelled) return;
        setShowLoginModal(true);
      }, LOGIN_MODAL_DELAY);
      timerIdRef.current = id;
    }

    // 🔹 SNS/SnsDetail 페이지에서 벗어날 때 정리 + 체류 시간 누적
    return () => {
      cancelled = true;

      if (timerIdRef.current !== null) {
        window.clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }

      // 여전히 비로그인 상태라면, 이번 방문 동안 머문 시간 누적
      if (!user && stayStartRef.current !== null) {
        try {
          const end = Date.now();
          const delta = end - stayStartRef.current; // 이번 마운트에서 실제 머문 시간

          const prevRaw = sessionStorage.getItem(SNS_STAY_MS_KEY) ?? '0';
          const prevAccum = Number(prevRaw) || 0;

          const nextAccum = Math.min(LOGIN_MODAL_DELAY, prevAccum + delta);
          sessionStorage.setItem(SNS_STAY_MS_KEY, String(nextAccum));
        } catch {
          // 무시
        }
      }

      stayStartRef.current = null;
    };
  }, [user]);

  const handleLoginModalClose = () => {
    setShowLoginModal(false);
    // SNS를 계속 쓰는 게 아니라, 바깥으로 내보내기
    navigate('/');
  };

  return { showLoginModal, handleLoginModalClose };
}

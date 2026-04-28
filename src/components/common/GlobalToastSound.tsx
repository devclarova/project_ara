import { useEffect, useRef } from 'react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

/**
 * 전역 알림 효과음 리스너 (MutationObserver 기반):
 * - 목적(Why): 특정 라이브러리(sonner)의 API에 의존하지 않고, DOM 변화를 직접 감지하여 알림 발생 시 소리를 재생함
 * - 방법(How): MutationObserver를 사용하여 [data-sonner-toast] 요소가 DOM에 추가되는 것을 감지하며, 브라우저 기본 Audio API를 사용함
 */
export const GlobalToastSound = () => {
  const { settings } = useSiteSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 재생 대상 타입 정의 (NotificationToast의 type 속성과 일치)
  const ALLOWED_TYPES = ['chat', 'comment', 'like', 'follow', 'system', 'mention', 'repost', 'reply', 'like_comment', 'like_feed'];


  // 음원 미리 로드
  useEffect(() => {
    if (settings?.toast_sound_url) {
      const audio = new Audio(settings.toast_sound_url);
      audio.load();
      audioRef.current = audio;
    }
  }, [settings?.toast_sound_url]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const playSound = () => {
      if (audioRef.current && settings?.toast_sound_url) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.debug('[GlobalToastSound] Audio play blocked:', err);
        });
      }
    };

    // MutationObserver를 통해 토스트 컨테이너 감시
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // 새로운 노드가 추가되었는지 확인
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              // sonner 토스트는 보통 [data-sonner-toast] 속성을 가짐
              // 또는 특정 클래스명을 가질 수 있음. 여기선 광범위하게 체크
              const isToast = node.hasAttribute('data-sonner-toast') || 
                              node.classList.contains('toast') ||
                              node.querySelector('[data-sonner-toast]');
              
              if (isToast) {
                // 1. 커스텀 데이터 속성 확인 (가장 정확함)
                const notifEl = node.getAttribute('data-is-notification') === 'true' 
                  ? node 
                  : node.querySelector('[data-is-notification="true"]');
                
                const notifType = notifEl?.getAttribute('data-notification-type');
                
                let shouldPlay = false;
                // 명시적으로 NotificationToast 컴포넌트를 사용한 (수신된) 알림에만 소리 재생
                if (notifEl && notifType && ALLOWED_TYPES.includes(notifType)) {
                  shouldPlay = true;
                }
                
                if (shouldPlay) {
                  playSound();
                }
              }
            }
          });
        }
      }
    });

  // sonner 토스트 컨테이너는 body 직속 또는 특정 루트에 생성됨
  // 전역 감시를 위해 document.body를 관찰
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

    return () => observer.disconnect();
  }, [settings?.toast_sound_url]);

  return null;
};

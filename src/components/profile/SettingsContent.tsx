/**
 * 설정 본문 뷰포트 및 스크롤 오케스트레이터(Settings Viewport & Scroll Orchestrator):
 * - 목적(Why): 다양한 설정 하위 뷰가 렌더링되는 표준화된 컨테이너를 제공하고 내부 스크롤 경험을 최적화함
 * - 방법(How): 마우스 휠 이벤트 가드 및 Body overflow 제어를 통해 스크롤 전파(Scroll Chaining)를 방지하며, 브랜드 아이덴티티가 반영된 커스텀 스크롤바 메커니즘을 적용함
 */
import React, { useRef, useEffect } from 'react';

// 설정 영역 컨테이너(Settings Viewport) — 내부 스크롤 격리(Scroll Chaining 방지) 및 뷰포트 맞춤형 오버플로우 제어
export default function SettingsContent({
  children,
  className = 'flex-1',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const atTop = el.scrollTop <= 0 && e.deltaY < 0;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 1 && e.deltaY > 0;
      if (atTop || atBottom) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 뷰 스위칭 엔진 — 탭 식별자(Active Tab)에 따라 프로필/보안/알림 등 하위 설정 뷰를 조건부 렌더링
    const lockBody = () => {
      // 스크롤 컨테이너 진입 시 body overflow를 제어하여 부모 컨텍스트의 스크롤 전파(Scroll Chaining) 방지
      document.body.style.overflow = 'hidden';
    };
    const unlockBody = () => {
      // 컨테이너 이탈 시 body overflow 속성을 초기화하여 브라우저 기본 스크롤 동작 복구
      document.body.style.overflow = '';
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('mouseenter', lockBody);
    el.addEventListener('mouseleave', unlockBody);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('mouseenter', lockBody);
      el.removeEventListener('mouseleave', unlockBody);
      unlockBody();
    };
  }, []);

  return (
    <section
      className={`bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-gray-700 shadow-[0_4px_12px_rgba(0,0,0,0.04)] h-[420px] max-h-[calc(100vh-280px)] min-h-[320px] overflow-hidden flex flex-col ${className}`}
    >
      <div
        ref={ref}
        className="flex-1 overflow-y-auto overscroll-contain p-6 scrollbar-thin scrollbar-thumb-[#00BFA5]/20 hover:scrollbar-thumb-[#00BFA5]/40 scrollbar-track-transparent custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 191, 165, 0.2) transparent'
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 191, 165, 0.2);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 191, 165, 0.4);
          }
        `}} />
        {children}
      </div>
    </section>
  );
}

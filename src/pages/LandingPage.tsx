import { useCallback, useEffect, useRef, useState } from 'react';

import { isGuideModalDismissed } from '@/components/common/GuideModal';
import CTASection from '@/components/landing/CTASection';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import PopularContentSection from '@/components/landing/PopularContentSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';

type HomeProps = {
  onSignup?: () => void;
};

const LANDING_GUIDE_KEY = 'ara-landing-guide';
const HEADER_OFFSET = 0;
const SCROLL_SNAP_BREAKPOINT = 1024; // lg 이상일 때만 스냅

type SectionId =
  | 'hero'
  | 'how-it-works'
  | 'problems'
  | 'features'
  | 'contents'
  | 'testimonials'
  | 'cta';

const sectionOrder: SectionId[] = [
  'hero',
  'how-it-works',
  'problems',
  'features',
  'contents',
  'testimonials',
  'cta',
];

const LandingPage = ({ onSignup }: HomeProps) => {
  const [showGuide, setShowGuide] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const isScrollingRef = useRef(false);
  const wheelDeltaYRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);

  // 가이드 모달
  useEffect(() => {
    if (!isGuideModalDismissed(LANDING_GUIDE_KEY)) {
      setShowGuide(true);
    }
  }, []);

  // 스크롤 진행도 + 현재 섹션 계산
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setScrollProgress(progress);

      let current: SectionId = 'hero';
      let minDelta = Infinity;

      sectionOrder.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const delta = Math.abs(rect.top - HEADER_OFFSET);
        if (delta < minDelta) {
          minDelta = delta;
          current = id;
        }
      });

      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 섹션 인덱스로 스냅 스크롤
  const scrollToIndex = useCallback((nextIndex: number) => {
    const targetId = sectionOrder[nextIndex];
    const el = document.getElementById(targetId);
    if (!el) return;

    const rawTop = el.offsetTop - HEADER_OFFSET;
    const top = rawTop < 0 ? 0 : rawTop;

    isScrollingRef.current = true;
    window.scrollTo({ top, behavior: 'smooth' });

    // 부드러운 스크롤이 끝날 시간 즈음에 플래그만 풀어줌 (강제 재스크롤 ❌)
    const TIMER = 650;
    window.setTimeout(() => {
      isScrollingRef.current = false;
      wheelDeltaYRef.current = 0;
    }, TIMER);
  }, []);

  // 현재 섹션 기준 위/아래 이동
  const goToNeighborSection = useCallback(
    (direction: 1 | -1) => {
      const currentIndex = sectionOrder.indexOf(activeSection);
      let nextIndex = currentIndex;

      if (direction === 1 && currentIndex < sectionOrder.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (direction === -1 && currentIndex > 0) {
        nextIndex = currentIndex - 1;
      }

      if (nextIndex !== currentIndex) {
        scrollToIndex(nextIndex);
      }
    },
    [activeSection, scrollToIndex],
  );

  // 휠 스크롤 제어 (데스크톱에서만 풀페이지 스냅)
  useEffect(() => {
    const handleResize = () => {
      // 리사이즈 후에도 조건 다시 체크할 수 있도록 의도적으로 비움
    };
    window.addEventListener('resize', handleResize);

    const wheelHandler = (e: WheelEvent) => {
      const enableSnap = window.innerWidth >= SCROLL_SNAP_BREAKPOINT;
      if (!enableSnap) return; // 모바일/태블릿에서는 자연 스크롤

      // 모달이 열려 있으면 모달 내부 스크롤을 방해하지 않음
      const modalRoot = document.getElementById('modal-root');
      if (modalRoot && modalRoot.children.length > 0) {
        // 모달 내부에서 발생한 이벤트인지 확인
        const target = e.target as Node;
        if (modalRoot.contains(target)) {
          return; // 모달 내부에서는 기본 스크롤 허용
        }
      }

      const deltaY = e.deltaY;

      // 섹션 스냅 모드에서는 기본 스크롤 막고 우리가 제어
      e.preventDefault();

      if (isScrollingRef.current) return;
      if (Math.abs(deltaY) < 5) return;

      wheelDeltaYRef.current += deltaY;

      const THRESHOLD = 80;

      if (Math.abs(wheelDeltaYRef.current) >= THRESHOLD) {
        const direction = wheelDeltaYRef.current > 0 ? 1 : -1;
        wheelDeltaYRef.current = 0;
        goToNeighborSection(direction as 1 | -1);
      }
    };

    window.addEventListener('wheel', wheelHandler as any, { passive: false });
    return () => {
      window.removeEventListener('wheel', wheelHandler as any);
      window.removeEventListener('resize', handleResize);
    };
  }, [goToNeighborSection]);

  // 터치 스와이프 제어 (역시 데스크톱/대화면에서만)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const enableSnap = window.innerWidth >= SCROLL_SNAP_BREAKPOINT;
      if (!enableSnap) return;
      const touch = e.touches[0];
      touchStartYRef.current = touch.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const enableSnap = window.innerWidth >= SCROLL_SNAP_BREAKPOINT;
      if (!enableSnap) return;
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const enableSnap = window.innerWidth >= SCROLL_SNAP_BREAKPOINT;
      if (!enableSnap) return;
      if (touchStartYRef.current == null) return;

      const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
      const deltaY = touchStartYRef.current - endY;
      touchStartYRef.current = null;

      const SWIPE_THRESHOLD = 50;

      if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;
      if (isScrollingRef.current) return;

      e.preventDefault();
      const direction = deltaY > 0 ? 1 : -1;
      goToNeighborSection(direction as 1 | -1);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove as any, { passive: false });
    window.addEventListener('touchend', handleTouchEnd as any, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove as any);
      window.removeEventListener('touchend', handleTouchEnd as any);
    };
  }, [goToNeighborSection]);

  const scrollToSection = (id: SectionId) => {
    const index = sectionOrder.indexOf(id);
    if (index === -1) return;
    scrollToIndex(index);
  };

  return (
    <main className="relative min-h-screen bg-white dark:bg-background text-slate-900 dark:text-gray-100">
      {/* 상단 진행 바 */}
      <div className="fixed left-0 top-0 z-40 w-full h-0.5 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-primary via-sky-400 to-emerald-400 transition-[width]"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* 오른쪽 미니 내비 (xl부터 표시) */}
      <div className="fixed right-4 top-1/2 z-30 -translate-y-1/2 hidden xl:flex flex-col gap-3">
        {[
          { id: 'hero' as SectionId, label: 'Top' },
          { id: 'how-it-works' as SectionId, label: 'How' },
          { id: 'problems' as SectionId, label: 'Problems' },
          { id: 'features' as SectionId, label: 'Features' },
          { id: 'contents' as SectionId, label: 'Contents' },
          { id: 'testimonials' as SectionId, label: 'Stories' },
          { id: 'cta' as SectionId, label: 'Start' },
        ].map(({ id, label }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className="group relative flex items-center justify-end"
            >
              <span className="mr-2 hidden text-[11px] text-gray-500 dark:text-gray-400 group-hover:inline">
                {label}
              </span>
              <span
                className={`h-2.5 rounded-full transition-all ${
                  isActive
                    ? 'w-5 bg-primary shadow-[0_0_12px_rgba(0,191,165,0.7)]'
                    : 'w-2 bg-gray-300 dark:bg-slate-600 group-hover:w-3 group-hover:bg-primary/70'
                }`}
              />
            </button>
          );
        })}
      </div>

      <HeroSection onSignup={onSignup} />
      <HowItWorksSection />
      <ProblemSection />
      <SolutionSection />
      <PopularContentSection />
      <TestimonialsSection />
      <CTASection onSignup={onSignup} />
    </main>
  );
};

export default LandingPage;

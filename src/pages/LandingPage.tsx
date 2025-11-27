import { useEffect, useRef, useState, useCallback } from 'react';
import GuideModal, { isGuideModalDismissed } from '@/components/common/GuideModal';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import PopularContentSection from '@/components/landing/PopularContentSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';

type HomeProps = {
  onSignup?: () => void;
};

const LANDING_GUIDE_KEY = 'ara-landing-guide';
const HEADER_OFFSET = 0;

type SectionId = 'hero' | 'problems' | 'features' | 'contents' | 'testimonials' | 'cta';

const sectionOrder: SectionId[] = [
  'hero',
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

  const scrollToIndex = useCallback((nextIndex: number) => {
    const targetId = sectionOrder[nextIndex];
    const el = document.getElementById(targetId);
    if (!el) return;

    const rawTop = el.offsetTop - HEADER_OFFSET;
    const top = rawTop < 0 ? 0 : rawTop;

    isScrollingRef.current = true;
    window.scrollTo({ top, behavior: 'smooth' });

    window.setTimeout(() => {
      window.scrollTo({ top, behavior: 'auto' });
      isScrollingRef.current = false;
      wheelDeltaYRef.current = 0;
    }, 700);
  }, []);

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

  // 휠 스크롤 제어
  useEffect(() => {
    const wheelHandler = (e: WheelEvent) => {
      const deltaY = e.deltaY;

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
    return () => window.removeEventListener('wheel', wheelHandler as any);
  }, [goToNeighborSection]);

  // 터치 스와이프 제어
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartYRef.current = touch.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
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
    <main className="relative bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100">
      {/* 상단 진행 바 */}
      <div className="fixed left-0 top-0 z-40 w-full h-0.5 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-primary via-sky-400 to-emerald-400 transition-[width]"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* 오른쪽 미니 내비 */}
      <div className="fixed right-4 top-1/2 z-30 -translate-y-1/2 hidden xl:flex flex-col gap-3">
        {[
          { id: 'hero' as SectionId, label: 'Top' },
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
                    ? 'w-5 bg-primary'
                    : 'w-2 bg-gray-300 dark:bg-slate-600 group-hover:w-3 group-hover:bg-primary/60'
                }`}
              />
            </button>
          );
        })}
      </div>

      <GuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        slides={LANDING_GUIDE_SLIDES}
        storageKey={LANDING_GUIDE_KEY}
      />

      <HeroSection onSignup={onSignup} />
      <ProblemSection />
      <SolutionSection />
      <PopularContentSection />
      <TestimonialsSection />
      <CTASection onSignup={onSignup} />
    </main>
  );
};

const LANDING_GUIDE_SLIDES = [
  { id: 'landing-1', image: '/images/landing_guide_1.png', alt: 'ARA 이용 방법 안내 1' },
  { id: 'landing-2', image: '/images/landing_guide_2.png', alt: 'ARA 이용 방법 안내 2' },
  { id: 'landing-3', image: '/images/landing_guide_3.png', alt: 'ARA 이용 방법 안내 3' },
  { id: 'landing-4', image: '/images/landing_guide_4.gif', alt: 'ARA 이용 방법 안내 4' },
  { id: 'landing-5', image: '/images/landing_guide_5.gif', alt: 'ARA 이용 방법 안내 5' },
  { id: 'landing-6', image: '/images/landing_guide_6.png', alt: 'ARA 이용 방법 안내 6' },
];

export default LandingPage;

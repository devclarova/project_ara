/**
 * 고감도 랜딩 페이지 오케스트레이터(High-fidelity Landing Page Orchestrator):
 * - 목적(Why): 서비스 가치 제안을 시각적으로 전달하고 신규 사용자의 전환(Signup)을 유도하는 브랜드 진입점 역할을 함
 * - 방법(How): 섹션별 물리 스냅(Section Snap) 및 휠 하이재킹(Wheel Hijacking) 메커니즘을 통해 데스크톱 중심의 시네마틱 스크롤 가속 경험을 구현함
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';


import CTASection from '@/components/landing/CTASection';
import FooterSection from '@/components/landing/FooterSection';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import PopularContentSection from '@/components/landing/PopularContentSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';

type HomeProps = {
  onSignup?: () => void;
};


const HEADER_OFFSET = 0; // 헤더 높이 보정값 — 스크롤 위치 계산 시 네비게이션 바 레이아웃 간섭 방지
const SCROLL_SNAP_BREAKPOINT = 1024; // 섹션 스냅 트리거 임계치 — 1024px(lg) 이상 데스크톱 환경에서만 풀페이지 스냅 활성화

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
  const { t } = useTranslation();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const isScrollingRef = useRef(false);
  const wheelDeltaYRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);



  // 스크롤 프로그레스 및 가시 영역 내 최인접 섹션 식별 로직
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

  // 정밀 스크롤 제어 — 섹션 인덱스 기반 좌표 계산 및 부드러운 이동(Smooth Scroll) 트리거
  const scrollToIndex = useCallback((nextIndex: number) => {
    const targetId = sectionOrder[nextIndex];
    const el = document.getElementById(targetId);
    if (!el) return;

    const rawTop = el.offsetTop - HEADER_OFFSET;
    const top = rawTop < 0 ? 0 : rawTop;

    isScrollingRef.current = true;
    window.scrollTo({ top, behavior: 'smooth' });

    // 스크롤 락 해제 메커니즘 — 부드러운 이동 완료 시점(650ms) 추정 후 휠 이벤트 다시 허용 (재귀 스크롤 방지)
    const TIMER = 650;
    window.setTimeout(() => {
      isScrollingRef.current = false;
      wheelDeltaYRef.current = 0;
    }, TIMER);
  }, []);

  // 섹션 인덱스 네비게이션 — 현재 위치 기준 상/하 인접 섹션 식별 및 이동 명령 전달
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

  // 휠 이벤트 커스텀 가로채기(Hijacking) — 브라우저 기본 스크롤 억제 및 섹션 단위 물리 스냅 구현
  useEffect(() => {
    const handleResize = () => {
      // 리사이즈 후 조건 재검증을 위한 placeholder — 필요 시 뷰포트 상태 업데이트 로직 추가 지점
    };
    window.addEventListener('resize', handleResize);

    const wheelHandler = (e: WheelEvent) => {
      const enableSnap = window.innerWidth >= SCROLL_SNAP_BREAKPOINT;
      if (!enableSnap) return; // 모바일/태블릿에서는 자연 스크롤

      // 이질적 스크롤 영역 예외 처리 — 모달(Modal) 활성 시 메인 섹션 스냅 일시 중지 및 내부 스크롤 허용
      const modalRoot = document.getElementById('modal-root');
      if (modalRoot && modalRoot.children.length > 0) {
        // 이벤트 타겟의 모달 루트 포함 여부 검증
        const target = e.target as Node;
        if (modalRoot.contains(target)) {
          return; // 샌드박스 영역(모달) 내 브라우저 네이티브 스크롤 동작 유지
        }
      }

      const deltaY = e.deltaY;

      // 스크롤 행위 강제 제어 — preventDefault를 통한 브라우저 기본 이동 사멸 및 커스텀 로직 주입
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

    window.addEventListener('wheel', wheelHandler as EventListener, { passive: false });
    return () => {
      window.removeEventListener('wheel', wheelHandler as EventListener);
      window.removeEventListener('resize', handleResize);
    };
  }, [goToNeighborSection]);

  // 터치 스와이프 인터페이스 — 모바일/태블릿 환경에서의 섹션 간 정밀 스냅 전환 로직
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
    window.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
    window.addEventListener('touchend', handleTouchEnd as EventListener, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove as EventListener);
      window.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [goToNeighborSection]);

  const scrollToSection = (id: SectionId) => {
    const index = sectionOrder.indexOf(id);
    if (index === -1) return;
    scrollToIndex(index);
  };

  return (
    <main className="relative min-h-screen bg-white dark:bg-background text-slate-900 dark:text-gray-100">
      <Helmet>
        <title>{t('study.meta_title')}</title>
        <meta name="description" content={t('landing.description')} />
      </Helmet>



      {/* 전역 스크롤 프로그레스 바 — 전체 콘텐츠 대비 현재 열람 위치를 시각적 게이지로 표현 */}
      <div className="fixed left-0 top-0 z-40 w-full h-0.5 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-primary via-sky-400 to-emerald-400 transition-[width]"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* 퀵 네비게이션 닷(Dots) — 섹션별 가시성 상태 표시 및 즉시 이동 인터페이스 */}
      <div className="fixed right-4 top-1/2 z-30 -translate-y-1/2 hidden xl:flex flex-col gap-3">
        {[
          { id: 'hero' as SectionId, label: t('landing.nav_top', 'Top') },
          { id: 'how-it-works' as SectionId, label: t('landing.nav_how', 'How') },
          { id: 'problems' as SectionId, label: t('landing.nav_problems', 'Problems') },
          { id: 'features' as SectionId, label: t('landing.nav_features', 'Features') },
          { id: 'contents' as SectionId, label: t('landing.nav_contents', 'Contents') },
          { id: 'testimonials' as SectionId, label: t('landing.nav_stories', 'Stories') },
          { id: 'cta' as SectionId, label: t('landing.nav_start', 'Start') },
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
      <FooterSection />
    </main>
  );
};

export default LandingPage;

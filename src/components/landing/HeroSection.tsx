import { useNavigate } from 'react-router-dom';
import { Film, Languages, Users } from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import RightHeroSlider from './RightHeroSlider';

export type HeroProps = {
  onSignup?: () => void;
};

export default function HeroSection({ onSignup }: HeroProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = () => {
    if (onSignup) {
      onSignup();
      return;
    }

    if (user) {
      navigate('/finalhome');
    } else {
      navigate('/signin');
    }
  };

  return (
    <motion.section
      id="hero"
      className="
    relative overflow-hidden 
    min-h-[calc(100vh-80px)]
    flex items-center
    bg-gradient-to-b from-primary/5 via-white to-sky-50 
    dark:from-background dark:via-background dark:to-background
    pt-0
  "
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* 배경 장식 */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/25"
        animate={{ y: [-12, 12] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/40"
        animate={{ y: [10, -10] }}
        transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />

      {/* 안쪽 레이아웃 */}
      <div className="w-full max-w-screen-xl mx-auto px-6 pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16 flex flex-col lg:flex-row items-center gap-10 lg:gap-12">
        {/* 왼쪽 텍스트 */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/70 dark:bg-secondary/80 px-3 py-1 text-[11px] font-medium text-primary shadow-sm backdrop-blur mx-auto lg:mx-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            role="note"
            aria-label="플랫폼 간단 소개"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            K-콘텐츠 기반 한국어 학습 플랫폼
          </motion.div>

          <h1 className="max-w-xl mx-auto lg:mx-0 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-gray-100 break-keep">
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
              콘텐츠로 언어를 배우고
            </span>
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
              문화로 연결되는 경험
            </span>
          </h1>

          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 break-keep">
            드라마, 예능, 영화 장면으로 배우는 살아있는 표현들.
            <br className="hidden md:block" />전 세계 친구들과 함께 쓰고, 고치고, 나누는 한국어 학습
            공간 ARA
          </p>

          {/* 핵심 포인트 3개 */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 text-[11px] sm:text-sm text-gray-700 dark:text-gray-200">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-secondary/80 px-3 py-1 shadow-sm border border-gray-100/60 dark:border-slate-700">
              <Film className="w-4 h-4 text-primary" />
              실제 드라마·예능 장면
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-secondary/80 px-3 py-1 shadow-sm border border-gray-100/60 dark:border-slate-700">
              <Languages className="w-4 h-4 text-primary" />
              다국어 번역
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-secondary/80 px-3 py-1 shadow-sm border border-gray-100/60 dark:border-slate-700">
              <Users className="w-4 h-4 text-primary" />
              글로벌 학습 커뮤니티
            </span>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            <button
              onClick={handleClick}
              aria-label="바로 시작하기"
              className="inline-flex items-center justify-center rounded-[10px] bg-primary px-7 py-3 text-sm sm:text-base font-semibold text-white shadow-md shadow-primary/30 transition hover:-translate-y-[1px] hover:bg-primary/90"
            >
              바로 시작하기
            </button>
            <button
              type="button"
              onClick={() => navigate('/studylist')}
              aria-label="콘텐츠 둘러보기"
              className="inline-flex items-center justify-center rounded-[10px] border border-primary/20 bg-white/80 dark:bg-secondary/80 px-6 py-3 text-xs sm:text-sm font-medium text-primary shadow-sm backdrop-blur transition hover:bg-primary/5 dark:hover:bg-primary/10"
            >
              콘텐츠 둘러보기
            </button>
          </div>
        </div>

        {/* 오른쪽: 슬라이더 카드 */}
        <div className="w-full lg:w-1/2 flex justify-center mt-8 lg:mt-0">
          <RightHeroSlider />
        </div>
      </div>

      {/* 스크롤 유도 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center text-[11px] text-gray-400 dark:text-gray-400">
        <span>Scroll to explore</span>
        <span className="mt-1 animate-bounce text-lg">⌄</span>
      </div>
    </motion.section>
  );
}

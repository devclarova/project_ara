import { useNavigate } from 'react-router-dom';
import { Film, Languages, Users } from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';

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
      className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-b from-primary/5 via-white to-sky-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* 배경 장식 */}
      <motion.div
        className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20"
        animate={{ y: [-12, 12] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/40"
        animate={{ y: [10, -10] }}
        transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />

      <div className="w-full max-w-screen-xl mx-auto px-6 pt-24 pb-20 flex flex-col lg:flex-row items-center gap-12">
        {/* 왼쪽 텍스트 */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/70 dark:bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-primary shadow-sm backdrop-blur mx-auto lg:mx-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            K-콘텐츠 기반 한국어 학습 플랫폼
          </motion.div>

          <h1 className="max-w-xl mx-auto lg:mx-0 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-100 break-keep">
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
              콘텐츠로 언어를 배우고
            </span>
            <br className="hidden sm:block" />{' '}
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
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-900/80 px-3 py-1 shadow-sm border border-gray-100/60 dark:border-slate-700">
              <Film className="w-4 h-4 text-primary" />
              실제 드라마·예능 장면
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-900/80 px-3 py-1 shadow-sm border border-gray-100/60 dark:border-slate-700">
              <Languages className="w-4 h-4 text-primary" />
              다국어 번역
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-900/80 px-3 py-1 shadow-sm border border-gray-100/60 dark:border-slate-700">
              <Users className="w-4 h-4 text-primary" />
              글로벌 학습 커뮤니티
            </span>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            <button
              onClick={handleClick}
              className="inline-flex items-center justify-center rounded-[10px] bg-primary px-7 py-3 text-sm sm:text-base font-semibold text-white shadow-md shadow-primary/30 transition hover:-translate-y-[1px] hover:bg-primary/90"
            >
              바로 시작하기
            </button>
            <button
              type="button"
              onClick={() => navigate('/studylist')}
              className="inline-flex items-center justify-center rounded-[10px] border border-primary/20 bg-white/80 dark:bg-slate-900/80 px-6 py-3 text-xs sm:text-sm font-medium text-primary shadow-sm backdrop-blur transition hover:bg-primary/5 dark:hover:bg-primary/10"
            >
              콘텐츠 둘러보기
            </button>
          </div>
        </div>

        {/* 오른쪽 이미지 카드 (고정) */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="relative w-full max-w-[360px] sm:max-w-[400px]">
            <div className="relative rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xl shadow-sky-100/60 dark:shadow-slate-900 border border-white dark:border-slate-700">
              <div className="overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                <img
                  src="https://readdy.ai/api/search-image?query=korean%20learning%20concept%2C%20modern%20illustration%2C%20person%20studying%20with%20laptop%2C%20books%20and%20korean%20text%2C%20high%20quality%20digital%20art&width=600&height=600&seq=1&orientation=squarish"
                  alt="Korean Learning"
                  className="w-full h-auto object-cover"
                  draggable={false}
                />
              </div>

              <div className="mt-4 space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-gray-700 dark:text-gray-200">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] sm:text-xs font-medium text-primary">
                    LIVE
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-400">
                    지금 128명이 함께 학습 중
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-100 font-medium text-sm break-keep">
                  &ldquo;이 장면에서 한국인은 이렇게 말해요&rdquo;
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-300 break-keep">
                  대사·표현·문화까지 한 번에 정리된 대화 스크립트로 배우는 한국어.
                </p>
              </div>
            </div>

            <div className="absolute -right-6 top-8 hidden sm:block">
              <div className="rounded-2xl bg-white dark:bg-slate-900 px-4 py-3 text-[11px] shadow-lg border border-gray-100 dark:border-slate-700">
                <div className="font-medium text-gray-700 dark:text-gray-100 mb-1">오늘의 표현</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-300">
                  &ldquo;설레다&rdquo; · &ldquo;막상막하&rdquo;
                </div>
              </div>
            </div>
          </div>
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

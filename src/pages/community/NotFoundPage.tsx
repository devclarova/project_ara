// NotFoundPage.tsx
import { useNavigate } from 'react-router-dom';
import { Film, Compass, ArrowLeft, Home, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoHome = () => navigate('/');
  const handleGoBack = () => navigate(-1);

  return (
    <div className="relative min-h-[calc(100vh-4.75rem)] sm:min-h-[calc(100vh-5.25rem)] lg:min-h-[calc(100vh-6.25rem)] flex items-center md:items-start justify-center overflow-hidden bg-gradient-to-b from-sky-100 via-white to-sky-50 dark:from-[#020617] dark:via-[#020617] dark:to-sky-950 px-4 pt-6 sm:pt-8 lg:pt-10 pb-10">
      {/* 부드러운 글로우 / 파도 느낌 배경 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* 상단 블러 */}
        <div className="absolute -top-32 -right-10 w-64 h-64 rounded-full bg-teal-300/35 blur-3xl dark:bg-teal-500/20" />
        {/* 하단 블러(조금 위로 + 연하게) */}
        <div className="absolute -bottom-28 -left-16 w-96 h-96 rounded-full bg-sky-200/25 blur-3xl dark:bg-sky-500/20" />
        {/* 바닥 파도 그라디언트 (색/높이 조정) */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-sky-100 via-sky-50/0 to-transparent dark:from-sky-950/80" />

        {/* 작은 글리터 포인트들 */}
        <div className="absolute top-20 left-10 w-1 h-1 rounded-full bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
        <div className="absolute top-32 right-16 w-1 h-1 rounded-full bg-sky-200/80 shadow-[0_0_12px_rgba(125,211,252,0.9)]" />
        <div className="absolute bottom-32 left-1/2 w-1 h-1 rounded-full bg-teal-100/80 shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
      </div>

      {/* 🛡 좌·우 호위무사 (반응형) */}
      {/* md 이상에서만 등장, 화면 작아지면 자동으로 사라짐 */}
      <img
        src="/images/guard-left.png"
        alt="left-guard"
        className="pointer-events-none hidden md:block absolute bottom-0 z-[5] left-3 lg:left-6 w-28 lg:w-40 xl:w-48 object-contain select-none"
        draggable="false"
      />
      <img
        src="/images/guard-right.png"
        alt="right-guard"
        className="pointer-events-none hidden md:block absolute bottom-0 z-[5] right-3 lg:right-6 w-28 lg:w-40 xl:w-48 object-contain select-none"
        draggable="false"
      />

      {/* 메인 카드 (유리 느낌) */}
      <motion.div
        className="relative z-10 max-w-xl w-full rounded-[2rem] border border-border/60 bg-background/80 shadow-[0_18px_55px_rgba(15,23,42,0.25)] backdrop-blur-2xl px-6 py-8 sm:px-10 sm:py-10 text-center"
        initial={{ opacity: 0, y: 26, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* 상단 라벨 + 스파클 */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-300">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">
              404
            </span>
            <span>길을 잃은 페이지를 발견했어요</span>
            <Sparkles className="h-4 w-4 text-yellow-400/80 dark:text-yellow-300/90" />
          </div>
        </div>

        {/* 나침반 아이콘 */}
        <motion.div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 via-sky-200/60 to-teal-300/30 dark:from-primary/25 dark:via-sky-900/60 dark:to-teal-700/40 shadow-lg"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Compass className="h-10 w-10 text-primary dark:text-teal-200" />
        </motion.div>

        {/* 타이틀 / 서브 타이틀 – 줄내림 전부 자동 */}
        <h1 className="text-2xl sm:text-[1.7rem] md:text-3xl font-semibold text-gray-900 dark:text-gray-50 break-keep whitespace-normal">
          아직 스크립트가 쓰이지 않은 장면이에요
        </h1>
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-gray-500 dark:text-gray-300">
          이 주소에는 아직 ARA의 에피소드가 준비되어 있지 않아요. 홈으로 돌아가서 다른 K-콘텐츠로
          한국어와 문화를 계속 즐겨보실까요?
        </p>

        {/* 인용문 스타일 서브 카피 */}
        <div className="mt-5 inline-flex max-w-xs lg:text-nowrap md:text-nowrap mid:text-nowrap sm:text-nowrap text-wrap flex-col items-center justify-center gap-2 text-xs sm:text-sm text-gray-400 dark:text-gray-400 mx-auto">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-gray-200 dark:bg-gray-700" />
            <Film className="h-4 w-4" />
            <span className="h-px w-6 bg-gray-200 dark:bg-gray-700" />
          </div>
          <p className="italic text-center">
            “언젠가 이 페이지도
            <span className="mx-1 font-medium text-primary dark:text-teal-300">하나의 장면</span>
            으로 채워질 거예요.”
          </p>
        </div>

        {/* 버튼 그룹 */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleGoHome}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm sm:text-base font-medium text-white shadow-lg shadow-primary/35 transition hover:bg-primary/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:ring-offset-[#020617]"
          >
            <Home className="h-4 w-4" />
            홈으로 가기
          </button>

          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-border bg-background/80 px-7 py-3.5 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-100 hover:bg-muted/70 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 dark:ring-offset-[#020617]"
          >
            <ArrowLeft className="h-4 w-4" />
            이전 페이지로
          </button>
        </div>

        {/* 피드백 + 이메일 문구 – 한 문단, 자동 줄내림 */}
        <p className="mt-7 text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 break-words">
          이 페이지에서 기대하셨던 기능이나 아이디어가 있다면 ARA 안의 피드백 메뉴에서 편하게
          남겨주시거나{' '}
          <a
            href="mailto:koreara25@gmail.com"
            className="font-medium text-primary dark:text-teal-300 underline-offset-2 hover:underline"
          >
            koreara25@gmail.com
          </a>
          으로 연락해주세요.
        </p>

        <div className="mt-6 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </motion.div>
    </div>
  );
}

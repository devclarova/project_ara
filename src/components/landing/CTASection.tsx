import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export type CTAProps = {
  onSignup?: () => void;
};

export default function CTASection({ onSignup }: CTAProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = () => {
    if (onSignup) {
      onSignup();
      return;
    }
    navigate('/signin');
  };

  return (
    <motion.section
      id="cta"
      className="
        relative overflow-x-hidden 
        bg-gradient-to-b from-primary/5 via-white to-sky-50 
        dark:from-background dark:via-background dark:to-background
        min-h-[calc(100vh-100px)]
        flex items-center
      "
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* 배경 포인트 */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/25" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/40" />

      {/* 🔧 다른 섹션과 패딩/높이 리듬 통일 */}
      <div className="w-full max-w-screen-xl mx-auto px-6 pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16 flex justify-center">
        <div className="w-full max-w-3xl text-center px-6 sm:px-10 py-10 sm:py-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-secondary/80 px-3 py-1 text-xs text-gray-500 dark:text-gray-300 border border-gray-100/60 dark:border-slate-700 mb-4 shadow-sm">
            {t('landing.cta_badge_text', '오늘 가입한 학습자')} <span className="font-semibold text-primary">+42</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900 dark:text-gray-100 break-keep">
            {t('landing.cta_title_1')}
            <br />
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
              {t('landing.cta_title_2')}
            </span>
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-8 text-sm md:text-base max-w-xl mx-auto break-keep">
            {t('landing.cta_description')}
          </p>

          <button
            onClick={handleClick}
            className="inline-flex items-center justify-center rounded-[10px] bg-primary px-9 py-3 text-base font-semibold text-white shadow-md shadow-primary/30 transition hover:-translate-y-[1px] hover:bg-primary/90"
          >
            {t('landing.cta_start_free', '무료로 시작하기')}
          </button>
        </div>
      </div>
    </motion.section>
  );
}

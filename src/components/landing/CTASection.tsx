import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export type CTAProps = {
  onSignup?: () => void;
};

export default function CTASection({ onSignup }: CTAProps) {
  const navigate = useNavigate();

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
      className="bg-gradient-to-b from-sky-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen flex items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-screen-xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-900/80 px-3 py-1 text-xs text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-slate-700 mb-4">
          오늘 가입한 학습자 <span className="font-semibold text-primary">+42</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100 break-keep">
          한국어를 &apos;공부&apos;가 아니라
          <br />
          <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
            &apos;경험&apos;으로 시작해 보세요
          </span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-sm md:text-base max-w-xl mx-auto break-keep">
          지금 가입하면, 가장 인기 있는 드라마 장면으로 만드는 나만의 첫 번째 학습 코스를 바로
          시작할 수 있어요.
        </p>
        <button
          onClick={handleClick}
          className="inline-flex items-center justify-center rounded-[10px] bg-primary px-9 py-3 text-base font-semibold text-white shadow-md shadow-primary/30 transition hover:-translate-y-[1px] hover:bg-primary/90"
        >
          무료로 시작하기
        </button>
      </div>
    </motion.section>
  );
}

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function ProblemSection() {
  const { t } = useTranslation();
  const problems = [
    t('landing.problems.1'),
    t('landing.problems.2'),
    t('landing.problems.3'),
    t('landing.problems.4'),
    t('landing.problems.5'),
  ];

  return (
    <motion.section
      id="problems"
      className="
        relative overflow-x-hidden 
        bg-sky-50/40 dark:bg-background 
        min-h-[calc(100vh-100px)]
        flex items-center
      "
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero와 같은 톤의 배경 포인트 */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/25" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/40" />

      {/* 🔧 Hero / HowItWorks와 패딩 통일 */}
      <div className="w-full max-w-screen-xl mx-auto px-6 pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900 dark:text-gray-100 break-keep">
            {t('landing.problem_title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base break-keep">
            {t('landing.problem_desc')}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {problems.map((text, idx) => (
            <div key={idx} className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <motion.div
                className="max-w-[80%] rounded-2xl bg-white dark:bg-secondary px-4 py-3 text-sm text-left shadow-sm border border-sky-100 dark:border-slate-700"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ amount: 0.4, once: true }}
                transition={{ duration: 0.4, delay: 0.05 * idx }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    learner #{idx + 1}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-background px-2 py-[2px] text-[10px] text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-slate-700">
                    {t('landing.problem_badge')}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-100 break-keep">{text}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

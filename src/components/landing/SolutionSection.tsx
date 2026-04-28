import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function SolutionSection() {
  const { t } = useTranslation();
  const WHY_ARA = {
    title: t('landing.solution.title'),
    description: [
      t('landing.solution.description.0'),
      t('landing.solution.description.1'),
      t('landing.solution.description.2'),
    ],
  };

  const items = [
    {
      title: t('landing.solution.features.1.title'),
      desc: t('landing.solution.features.1.desc'),
    },
    {
      title: t('landing.solution.features.2.title'),
      desc: t('landing.solution.features.2.desc'),
    },
    {
      title: t('landing.solution.features.3.title'),
      desc: t('landing.solution.features.3.desc'),
    },
  ];

  return (
    <motion.section
      id="features"
      className="
        relative overflow-x-hidden 
        bg-white dark:bg-background 
        min-h-[calc(100vh-100px)]
        flex items-center
      "
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero 포인트 복사 */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/25" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/40" />

      {/* 다른 섹션과 패딩/높이 통일 */}
      <div className="w-full max-w-screen-xl mx-auto px-6 pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16 grid gap-10 md:gap-16 md:grid-cols-[0.75fr,1.25fr] items-start">
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-gray-100 break-keep">
            {WHY_ARA.title}
          </h2>

          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed break-keep">
            {WHY_ARA.description[0]}
            <br />
            <span className="font-semibold">{WHY_ARA.description[1]}</span>
            <br />
            {WHY_ARA.description[2]}
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/40 via-sky-200 to-transparent dark:from-primary/70 dark:via-slate-700/70" />
          <div className="space-y-8">
            {items.map((item, index) => (
              <motion.div
                key={`feature-${index}`}
                className="relative pl-8"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ amount: 0.3, once: true }}
                transition={{ duration: 0.4, delay: 0.06 * index }}
              >
                <div className="rounded-2xl bg-gray-50 dark:bg-secondary px-4 py-3 md:px-5 md:py-4 shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="text-xs uppercase tracking-[0.12em] text-primary/70 mb-1">
                    feature 0{index + 1}
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-gray-100 mb-1.5 break-keep">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed break-keep">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

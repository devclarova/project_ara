import { motion } from 'framer-motion';
import { SwiperSlide } from 'swiper/react';
import { useTranslation } from 'react-i18next';

import BaseCarousel from './BaseCarousel';

export default function TestimonialsSection() {
  const { t } = useTranslation();
  const LEARNER_INTRO = {
    title: {
      line1: t('landing.testimonials.title.line1'),
      line2: t('landing.testimonials.title.line2'),
    },
    description: {
      intro: t('landing.testimonials.description.intro'),
      highlight: t('landing.testimonials.description.highlight'),
      body: t('landing.testimonials.description.body'),
      detail: [
        t('landing.testimonials.description.detail.0'),
        t('landing.testimonials.description.detail.1'),
        t('landing.testimonials.description.detail.2'),
        t('landing.testimonials.description.detail.3'),
      ],
    },
  };

  const reviews = [
    {
      name: 'Sarah Johnson',
      country: t('landing.testimonials.reviews.sarah.country'),
      persona: t('landing.testimonials.reviews.sarah.persona'),
      text: t('landing.testimonials.reviews.sarah.text'),
    },
    {
      name: 'Diego Martínez',
      country: t('landing.testimonials.reviews.diego.country'),
      persona: t('landing.testimonials.reviews.diego.persona'),
      text: t('landing.testimonials.reviews.diego.text'),
    },
    {
      name: 'Mei Lin',
      country: t('landing.testimonials.reviews.meilin.country'),
      persona: t('landing.testimonials.reviews.meilin.persona'),
      text: t('landing.testimonials.reviews.meilin.text'),
    },
    {
      name: 'Alexey Petrov',
      country: t('landing.testimonials.reviews.alexey.country'),
      persona: t('landing.testimonials.reviews.alexey.persona'),
      text: t('landing.testimonials.reviews.alexey.text'),
    },
    {
      name: 'Hana Ito',
      country: t('landing.testimonials.reviews.hana.country'),
      persona: t('landing.testimonials.reviews.hana.persona'),
      text: t('landing.testimonials.reviews.hana.text'),
    },
  ];

  const stats = [
    {
      label: t('landing.testimonials.stats.duration.label'),
      value: '2.1배',
      desc: t('landing.testimonials.stats.duration.desc'),
    },
    {
      label: t('landing.testimonials.stats.persona.label'),
      value: '15명+',
      desc: t('landing.testimonials.stats.persona.desc'),
    },
    {
      label: t('landing.testimonials.stats.scenario.label'),
      value: '20개+',
      desc: t('landing.testimonials.stats.scenario.desc'),
    },
  ];

  const REVIEW_NOTICE = {
    mobile: t('landing.testimonials.notice.mobile'),
    desktop: t('landing.testimonials.notice.desktop'),
  };

  return (
    <motion.section
      id="testimonials"
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
      {/* 배경 포인트 */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/25" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/40" />

      {/* 다른 섹션과 패딩/높이 통일 */}
      <div className="w-full max-w-screen-xl mx-auto px-6 pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16">
        <div className="grid gap-10 lg:gap-16 md:grid-cols-2 items-start">
          {/* 왼쪽 영역 */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900 dark:text-gray-100 break-keep">
                {LEARNER_INTRO.title.line1}
                <br className="hidden sm:block" />
                {LEARNER_INTRO.title.line2}
              </h2>

              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed break-keep">
                {LEARNER_INTRO.description.intro}
                <br />
                <span className="font-semibold">{LEARNER_INTRO.description.highlight}</span>
                {LEARNER_INTRO.description.body}
                <br />
                <span className="hidden sm:inline">
                  {LEARNER_INTRO.description.detail[0]}
                  <br />
                  {LEARNER_INTRO.description.detail[1]}
                  <br />
                  {LEARNER_INTRO.description.detail[2]}
                  <br />
                  {LEARNER_INTRO.description.detail[3]}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-gray-50 dark:bg-secondary px-3 py-2 sm:px-4 sm:py-3 shadow-sm border border-gray-100 dark:border-slate-700 h-full flex flex-col"
                >
                  <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 break-keep">
                    {stat.label}
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="hidden sm:block text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed break-keep flex-1">
                    {stat.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽 영역 */}
          <div className="w-full mt-10 md:mt-0 md:justify-self-end max-w-full overflow-hidden">
            <BaseCarousel autoplay loop slidesPerView={1} spaceBetween={20}>
              {reviews.map(r => (
                <SwiperSlide key={r.name} className="pb-10">
                  <div className="relative rounded-2xl bg-gray-50 dark:bg-secondary px-5 py-6 shadow-sm border border-gray-100 dark:border-slate-700 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-sky-400 text-white flex items-center justify-center text-sm font-semibold">
                        {r.name.split(' ')[0][0]}
                        {r.name.split(' ')[1]?.[0] ?? ''}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-gray-100 text-sm">
                          {r.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{r.country}</p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-2.5 py-1 text-[10px] text-primary mb-3 max-w-max">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="break-keep">{r.persona}</span>
                    </div>

                    <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed break-keep flex-1">
                      &quot;{r.text}&quot;
                    </p>
                  </div>
                </SwiperSlide>
              ))}
            </BaseCarousel>

            {/* 설명 문구 */}
            <p className="mt-4 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed break-keep sm:hidden">
              {REVIEW_NOTICE.mobile}
            </p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed break-keep hidden sm:block">
              {REVIEW_NOTICE.desktop}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

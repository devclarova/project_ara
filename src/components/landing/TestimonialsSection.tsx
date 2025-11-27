import { motion } from 'framer-motion';
import { SwiperSlide } from 'swiper/react';

import BaseCarousel from './BaseCarousel';

export default function TestimonialsSection() {
  const reviews = [
    {
      name: 'Sarah Johnson',
      country: '미국 · US',
      persona: '드라마로 한국어를 시작한 초급 학습자',
      text: '자막만 믿고 보다가 항상 중간에 놓쳤는데, ARA에서는 장면마다 중요한 표현을 딱 집어줘서 “여기서 이 말을 쓰는구나”를 느끼게 돼요. 같은 장면을 두 번, 세 번 보면서 조금씩 자막을 가리는 재미가 생겼습니다.',
    },
    {
      name: 'Diego Martínez',
      country: '스페인 · ES',
      persona: '워홀·유학 준비 중인 실전형 학습자',
      text: '워홀 준비하면서 진짜로 쓰는 말만 골라서 공부하고 싶었어요. 예능/인터뷰 클립에서 나오는 표현들이 상황별로 정리되어 있어서, “이건 친구들끼리”, “이건 회사에서”처럼 바로 적용할 수 있다는 게 제일 좋습니다.',
    },
    {
      name: 'Mei Lin',
      country: '싱가포르 · SG',
      persona: '말문을 트이고 싶은 중·고급 학습자',
      text: '문법책은 다 끝냈는데 말이 안 나오는 타입이었어요. ARA에서 장면을 보고 짧은 리액션 글을 남기면, AI가 자연스럽게 고쳐줘요. 그걸 그대로 DM이나 피드에서 써보면서 “아 이렇게 말하면 되는구나”가 몸에 붙는 느낌입니다.',
    },
    {
      name: 'Alexey Petrov',
      country: '러시아 · RU',
      persona: '비즈니스 표현이 필요한 직장인 학습자',
      text: '한국 회사와 메일을 주고받을 일이 많아서 비즈니스 표현이 필요했습니다. 드라마 “미생” 같은 장면에서 회의/보고 표현을 배우고, 예문을 제 상황에 맞게 바꿔보는 기능이 특히 인상적이었어요.',
    },
    {
      name: 'Hana Ito',
      country: '일본 · JP',
      persona: '루틴이 잘 끊기는 자기계발형 학습자',
      text: '혼자 교재로만 공부할 때는 3일만 지나도 손이 안 갔어요. 지금은 좋아하는 드라마 클립과 “오늘의 한 문장” 미션 덕분에, 잠깐이라도 들어가서 한 장면만 보고 나오는 루틴이 생겼습니다.',
    },
  ];

  const stats = [
    {
      label: '학습 지속 시간',
      value: '2.1배',
      desc: '혼자 교재로만 공부할 때보다 더 오래 머무를 수 있도록 플로우를 설계하고 있습니다.',
    },
    {
      label: '페르소나 타입',
      value: '15명+',
      desc: '여러 나라·여러 목표를 가진 학습자 타입을 상정하고 화면과 기능을 검토하고 있어요.',
    },
    {
      label: '학습 시나리오',
      value: '20개+',
      desc: '어떤 상황에서 ARA를 켜게 될지 장면 단위로 학습 시나리오를 계속 쌓아가고 있습니다.',
    },
  ];

  return (
    <motion.section
      id="testimonials"
      // ✅ 모바일에서는 위에서부터 시작, md 이상에서만 가운데 정렬
      className="bg-white dark:bg-slate-950 min-h-screen flex items-start md:items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-screen-xl mx-auto px-6 py-14 md:py-20">
        <div className="grid gap-10 lg:gap-16 md:grid-cols-2 items-start">
          {/* 왼쪽 */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100 break-keep">
                ARA는 이런 학습자들을
                <br className="hidden sm:block" />
                떠올리며 설계되고 있어요
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed break-keep">
                아직 정식 출시 전이지만, ARA는 한 명의 전형적인 학습자가 아니라{' '}
                <span className="font-semibold">여러 타입의 학습자</span>를 동시에 상상하면서
                만들어지고 있습니다.
                {/* ✅ 긴 설명은 sm 이상에서만 노출 */}
                <span className="hidden sm:inline">
                  {' '}
                  드라마로 한국어를 시작하는 사람, 워홀·유학을 준비하는 사람, 회사에서 한국어를 써야
                  하는 직장인까지. 좋아하는 K-콘텐츠와 커뮤니티를 함께 사용할 때 공부가 더 오래,
                  자연스럽게 이어지도록 플로우를 설계하고 있어요.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-gray-50 dark:bg-slate-900 px-3 py-2 sm:px-4 sm:py-3 shadow-sm border border-gray-100 dark:border-slate-700 h-full flex flex-col"
                >
                  <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 break-keep">
                    {stat.label}
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-primary mb-1">{stat.value}</div>
                  {/* ✅ 설명은 모바일에서 숨김 (높이 절약) */}
                  <div className="hidden sm:block text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed break-keep flex-1">
                    {stat.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽 */}
          <div className="w-full mt-10 md:mt-0 md:justify-self-end max-w-full overflow-hidden">
            <BaseCarousel autoplay loop slidesPerView={1} spaceBetween={20}>
              {reviews.map(r => (
                <SwiperSlide key={r.name} className="pb-10">
                  <div className="relative rounded-2xl bg-gray-50 dark:bg-slate-900 px-5 py-6 shadow-sm border border-gray-100 dark:border-slate-700 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-sky-400 text-white flex items-center justify-center text-sm font-semibold">
                        {r.name.split(' ')[0][0]}
                        {r.name.split(' ')[1]?.[0] ?? ''}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
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

            {/* ✅ 모바일: 짧은 한 줄, sm 이상: 기존 긴 설명 */}
            <p className="mt-4 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed break-keep sm:hidden">
              지금 보시는 후기는 ARA가 상정한 학습자 페르소나를 바탕으로 만든 시나리오형 예시
              리뷰입니다.
            </p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed break-keep hidden sm:block">
              지금 보시는 후기는 실제 사용자 데이터가 아닌, ARA가 타깃으로 삼고 있는 학습자
              페르소나를 바탕으로 만든 시나리오형 리뷰입니다. 정식 런칭 후에는 실제 학습자들의
              이야기와 함께 이 섹션이 계속 업데이트될 예정이에요.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

import { motion } from 'framer-motion';
import { SwiperSlide } from 'swiper/react';

import BaseCarousel from './BaseCarousel';

export default function TestimonialsSection() {
  const LEARNER_INTRO = {
    title: {
      line1: 'ARA는 이런 학습자들을',
      line2: '떠올리며 설계되고 있어요',
    },
    description: {
      intro: '아직 정식 출시 전이지만, ARA는 한 명의 전형적인 학습자를 떠올리기보다',
      highlight: '여러 타입의 학습자',
      body: '를 함께 상상하며 만들어지고 있습니다.',
      detail: [
        '한국어를 막 시작한 사람부터 워홀·유학을 준비하는 사람,',
        '일상이나 업무에서 한국어를 써야 하는 직장인까지.',
        '좋아하는 콘텐츠와 커뮤니티를 함께 사용할 때 학습이 더 오래,',
        '자연스럽게 이어지도록 플로우를 설계하고 있어요.',
      ],
    },
  };

  const reviews = [
    {
      name: 'Sarah Johnson',
      country: '미국 · US',
      persona: '드라마로 한국어를 시작한 초급 학습자',
      text: '그동안은 자막에만 의존해서 이야기를 보다 보니 중요한 표현을 자주 놓쳤어요. ARA에서는 한 장면씩 나눠서 핵심 표현을 짚어줘서 “아, 이 상황에서 이 말을 쓰는구나” 하고 이해가 됩니다. 같은 에피소드를 다시 보면서 자막을 하나씩 줄여가는 재미도 생겼어요.',
    },
    {
      name: 'Diego Martínez',
      country: '스페인 · ES',
      persona: '워홀·유학 준비 중인 실전형 학습자',
      text: '워홀 가기 전에 실제로 쓸 표현 위주로 공부하고 싶었어요. 애니메이션 속 대화가 상황별로 정리되어 있어서, “일상에서 쓰는 말”, “조심해서 써야 하는 표현”을 구분해서 익힐 수 있었던 게 좋았습니다.',
    },
    {
      name: 'Mei Lin',
      country: '싱가포르 · SG',
      persona: '말문을 트이고 싶은 중·고급 학습자',

      text: '문법이나 단어는 어느 정도 아는데, 말로 풀어내는 게 항상 어려웠어요. ARA에서 이야기를 보고 짧게 감상이나 리액션을 쓰면, 더 자연스러운 표현으로 고쳐줘요. 그 문장을 그대로 피드나 DM에서 써보면서 말하는 감각이 조금씩 살아나는 느낌을 받았습니다.',
    },
    {
      name: 'Alexey Petrov',
      country: '러시아 · RU',
      persona: '비즈니스 표현이 필요한 직장인 학습자',
      text: '한국 파트너와 소통할 일이 많아서 비즈니스 표현이 필요했습니다.  애니메이션 속 어른과 아이, 윗사람과 아랫사람의 말투를 비교해보면서, 상황에 맞는 표현을 자연스럽게 익힐 수 있었어요. 단순 번역이 아니라 맥락을 이해하게 되는 점이 인상적이었습니다.',
    },
    {
      name: 'Hana Ito',
      country: '일본 · JP',
      persona: '루틴이 잘 끊기는 자기계발형 학습자',
      text: '교재로 공부할 때는 며칠만 지나도 흐름이 끊겼어요. ARA에서는 짧은 이야기 한 편만 봐도 학습이 되다 보니 부담이 없어요. “오늘은 이 장면까지만” 하고 들어왔다가, 자연스럽게 매일 접속하는 루틴이 생겼습니다.',
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

  const REVIEW_NOTICE = {
    mobile:
      '지금 보시는 후기는 ARA가 상정한 학습자 페르소나를 바탕으로 구성한 시나리오형 예시 리뷰입니다.',
    desktop:
      '지금 보시는 후기는 실제 사용자 데이터가 아닌, ARA가 타깃으로 삼고 있는 학습자 페르소나를 바탕으로 구성한 시나리오형 리뷰입니다. 정식 런칭 이후에는 실제 학습자들의 이야기와 함께 이 섹션이 계속 업데이트될 예정이에요.',
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

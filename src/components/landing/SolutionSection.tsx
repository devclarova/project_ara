import { motion } from 'framer-motion';

export default function SolutionSection() {
  const items = [
    {
      title: '장면 중심 학습',
      desc: '드라마·예능 한 장면을 기준으로 어휘, 표현, 문화까지 한 번에 정리합니다.',
    },
    {
      title: '사용하면서 배우는 구조',
      desc: '피드·DM에서 실제로 표현을 쓰고, 예시 문장과 피드백을 통해 더 자연스러운 표현을 익힙니다.',
    },
    {
      title: '글로벌 커뮤니티',
      desc: '다른 나라 친구들의 모국어와 한국어가 섞인 타임라인에서 자연스럽게 언어 감각을 키웁니다.',
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

      {/* 🔧 다른 섹션과 패딩/높이 통일 */}
      <div className="w-full max-w-screen-xl mx-auto px-6 pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16 grid gap-10 md:gap-16 md:grid-cols-[0.75fr,1.25fr] items-start">
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-gray-100 break-keep">
            왜 ARA인가요?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed break-keep">
            단어만 외우는 학습이 아니라,
            <span className="font-semibold"> 콘텐츠 속 흐름과 감정까지 함께 기억되는 학습</span>을
            목표로 만들었습니다.
            <br />
            학습과 커뮤니티, 두 가지 경험이 한 화면 안에서 자연스럽게 이어지도록 설계했어요.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/40 via-sky-200 to-transparent dark:from-primary/70 dark:via-slate-700/70" />
          <div className="space-y-8">
            {items.map((item, index) => (
              <motion.div
                key={item.title}
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

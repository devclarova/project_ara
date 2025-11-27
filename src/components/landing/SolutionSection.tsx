import { motion } from 'framer-motion';

export default function SolutionSection() {
  const items = [
    {
      title: '장면 중심 학습',
      desc: '드라마·예능 한 장면을 기준으로 어휘, 표현, 문화까지 한 번에 정리합니다.',
    },
    {
      title: '사용하면서 배우는 구조',
      desc: '피드·DM에서 실제로 표현을 쓰고, AI가 자연스러운 문장으로 다듬어 줍니다.',
    },
    {
      title: '글로벌 커뮤니티',
      desc: '다른 나라 친구들의 모국어와 한국어가 섞인 타임라인에서 자연스럽게 언어 감각을 키웁니다.',
    },
  ];

  return (
    <motion.section
      id="features"
      className="bg-white dark:bg-slate-950 min-h-screen flex items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-screen-xl mx-auto px-6 py-20 grid gap-10 md:gap-16 md:grid-cols-[0.75fr,1.25fr] items-start">
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 break-keep">
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
          <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/40 via-sky-200 to-transparent dark:from-primary/60 dark:via-slate-700" />
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
                <div className="rounded-2xl bg-gray-50 dark:bg-slate-900 px-4 py-3 md:px-5 md:py-4 shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="text-xs uppercase tracking-[0.12em] text-primary/70 mb-1">
                    feature 0{index + 1}
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5 break-keep">
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

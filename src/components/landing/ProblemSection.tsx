import { motion } from 'framer-motion';

export default function ProblemSection() {
  const problems = [
    '자막 없이 드라마를 보고 싶은데, 어휘가 잘 안 외워져요.',
    '교과서 표현과 실제 사람들이 쓰는 말이 너무 달라요.',
    '배운 표현을 써보고 싶은데, 쓸 곳이 마땅치 않아요.',
    '내 수준에 딱 맞는 콘텐츠를 찾기가 너무 어려워요.',
    '혼자 공부하니까 동기부여가 금방 떨어져요.',
  ];

  return (
    <motion.section
      id="problems"
      className="bg-sky-50/40 dark:bg-slate-950 min-h-screen flex items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-screen-xl mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100 break-keep">
            혹시 이런 고민, 해본 적 있나요?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base break-keep">
            ARA는 실제 학습자들이 가장 많이 이야기한 고민에서 출발했습니다.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {problems.map((text, idx) => (
            <div key={text} className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <motion.div
                className="max-w-[80%] rounded-2xl bg-white dark:bg-slate-900 px-4 py-3 text-sm text-left shadow-sm border border-sky-100 dark:border-slate-700"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ amount: 0.4, once: true }}
                transition={{ duration: 0.4, delay: 0.05 * idx }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    learner #{idx + 1}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-slate-800 px-2 py-[2px] text-[10px] text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-slate-700">
                    real 고민
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

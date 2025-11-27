import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/pages/TempHomePage';

export default function PopularContentSection() {
  const contents = [
    {
      id: 1,
      level: '초급',
      title: '사랑의 불시착',
      subtitle: '운명적인 만남으로 시작되는 달달한 로맨스',
      image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/wgwl0HLr2SfLshntt0krZgu7GWn.jpg',
      time: '5분',
      meta: '20개 대화',
    },
    {
      id: 2,
      level: '중급',
      title: '런닝맨',
      subtitle: '재미있는 예능 속 다양한 한국어 표현',
      image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/3SRAHhwS8B08GnjkRR4Otf8kEWK.jpg',
      time: '8분',
      meta: '30개 대화',
    },
    {
      id: 3,
      level: '고급',
      title: '기생충',
      subtitle: '긴장감 넘치는 스토리 속 고급 한국어',
      image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg',
      time: '10분',
      meta: '40개 대화',
    },
    {
      id: 4,
      level: '고급',
      title: '자이언트',
      subtitle: '악역의 명대사로 배우는 고급 한국어',
      image: 'https://media.themoviedb.org/t/p/w500_and_h282_face/oYXxJqTEBL10zIgLlyb4K1PQEKM.jpg',
      time: '10분',
      meta: '17개 대화',
    },
    {
      id: 5,
      level: '중급',
      title: '응답하라 1988',
      subtitle: '일상 대화 속 자연스러운 가족/친구 표현',
      image: 'https://poc-cf-image.cjenm.com/public/share/menumng/1675755583445199173735.jpg',
      time: '7분',
      meta: '25개 대화',
    },
    {
      id: 6,
      level: '중급',
      title: '미생',
      subtitle: '회사 생활에서 바로 쓰는 비즈니스 표현',
      image:
        'https://image.tving.com/ntgs/contents/CTC/caip/CAIP1500/ko/20231030/0515/P000151356.jpg/dims/resize/1280',
      time: '9분',
      meta: '32개 대화',
    },
  ];

  const navigate = useNavigate();

  return (
    <motion.section
      id="contents"
      className="bg-sky-50/60 dark:bg-slate-950 min-h-screen flex items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-screen-xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 break-keep">
              이런 콘텐츠로 배우게 돼요
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base break-keep">
              실제로 많은 학습자들이 선택한 K-콘텐츠들을 기반으로 학습 플로우가 구성됩니다.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-white/90 dark:bg-slate-900/90 px-3 py-1 text-xs text-gray-500 dark:text-gray-300 border border-sky-100 dark:border-slate-700">
            오늘 업데이트된 장면 · <span className="font-semibold text-primary">+12</span>
          </span>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          loop
          speed={500}
          pagination={{ clickable: true }}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
          }}
          breakpoints={{
            0: {
              slidesPerView: 1,
              slidesPerGroup: 1,
              spaceBetween: 16,
            },
            640: {
              slidesPerView: 2,
              slidesPerGroup: 2,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3,
              slidesPerGroup: 3,
              spaceBetween: 24,
            },
          }}
          style={
            {
              '--swiper-pagination-color': 'rgb(0,191,165)',
            } as any
          }
          className="w-full"
        >
          {contents.map(course => (
            <SwiperSlide key={course.id} className="pb-10">
              <div
                className="h-full rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <Card
                  id={course.id}
                  image={course.image}
                  title={course.title}
                  subtitle={course.subtitle}
                  meta={`${course.time} · ${course.meta}`}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </motion.section>
  );
}

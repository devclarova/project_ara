import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import ContentCard from '../study/ContentCard';
import type { StudyListProps } from '@/types/study';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PopularContentSection() {
  const [items, setItems] = useState<StudyListProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('study')
        .select(
          `
        id,
        title,
        short_description,
        poster_image_url,
        video (
          contents,
          episode,
          scene,
          level,
          runtime_bucket
        )
      `,
        )
        .eq('is_featured', true)
        .order('id', { ascending: true })
        .limit(6);

      if (error) {
        setItems([]);
      } else {
        const mapped: StudyListProps[] = (data ?? []).map((row: any) => {
          const v = Array.isArray(row.video) ? row.video[0] : row.video;

          return {
            id: row.id,
            image: row.poster_image_url ?? undefined,
            title: row.title || '제목 없음',
            short_description: row.short_description || '',
            contents: v?.contents || '',
            episode: v?.episode || '',
            scene: v?.scene ?? '',
            level: v?.level || '',
            duration:
              typeof v?.runtime_bucket === 'string'
                ? v.runtime_bucket
                : (v?.runtime_bucket ?? null),
            comments: '0개 댓글',
          };
        });
        setItems(mapped);
      }

      setLoading(false);
    };

    void fetchFeatured();
  }, []);

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

        {/* 로딩 중 처리 (옵션) */}
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-16">인기 콘텐츠 불러오는 중...</div>
        ) : (
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
            {items.map(item => (
              <SwiperSlide key={item.id} className="pb-10">
                {/* 여기서 별도의 onClick / navigate 필요 없음 */}
                <ContentCard
                  basePath="/guest-study" // 게스트용으로
                  id={item.id}
                  image={item.image}
                  title={item.title}
                  short_description={item.short_description}
                  contents={item.contents}
                  episode={item.episode}
                  scene={item.scene}
                  level={item.level}
                  duration={item.duration}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </motion.section>
  );
}

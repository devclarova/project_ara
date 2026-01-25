import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';
import ContentCard from '@/components/study/ContentCard';
import type { StudyListProps } from '@/types/study';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useBatchAutoTranslation } from '@/hooks/useBatchAutoTranslation';
import SignInModal from '../auth/SignInModal';

export default function PopularContentSection() {
  const CONTENT_INTRO = {
    title: '이런 콘텐츠로 배우게 돼요',
    description:
      '전래동화와 설화를 바탕으로 한 자체 애니메이션 콘텐츠를 중심으로 학습 흐름이 구성됩니다.',
  };

  type SwiperStyle = CSSProperties & {
    '--swiper-pagination-color': string;
  };

  const [items, setItems] = useState<StudyListProps[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
        console.error('Failed to fetch featured contents', error);
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

  const { i18n } = useTranslation();
  const [showSignIn, setShowSignIn] = useState(false);
  const targetLang = i18n.language;

  // --- Batch Translation ---
  const titles = items.map(i => i.title);
  const titleKeys = items.map(i => `study_title_${i.id}`);
  const { translatedTexts: trTitles } = useBatchAutoTranslation(titles, titleKeys, targetLang);

  const descs = items.map(i => i.short_description || '');
  const descKeys = items.map(i => `study_desc_${i.id}`);
  const { translatedTexts: trDescs } = useBatchAutoTranslation(descs, descKeys, targetLang);

  const durations = items.map(i => i.duration ?? '');
  const durationKeys = items.map(i => `study_duration_${i.id}`);
  const { translatedTexts: trDurations } = useBatchAutoTranslation(
    durations,
    durationKeys,
    targetLang,
  );

  const episodes = items.map(i => i.episode || '');
  const episodeKeys = items.map(i => `study_episode_${i.id}`);
  const { translatedTexts: trEpisodes } = useBatchAutoTranslation(
    episodes,
    episodeKeys,
    targetLang,
  );
  // -------------------------

  const swiperStyle: SwiperStyle = {
    '--swiper-pagination-color': 'rgb(0,191,165)',
  };

  return (
    <motion.section
      id="contents"
      className="
        relative overflow-x-hidden 
        bg-sky-50/60 dark:bg-background 
        min-h-[calc(100vh-100px)]
        flex items-center
      "
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero와 같은 톤 배경 */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/25" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/40" />

      {/* 내부 패딩을 다른 섹션과 통일 */}
      <div className="w-full max-w-screen-xl mx-auto px-6 pt-8 pb-12 md:pt-10 md:pb-14 lg:pt-12 lg:pb-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-gray-100 mb-2 break-keep">
              {CONTENT_INTRO.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base break-keep">
              {CONTENT_INTRO.description}
            </p>
          </div>

          {/* <span className="inline-flex items-center gap-2 self-start rounded-full bg-white/90 dark:bg-secondary/90 px-3 py-1 text-xs text-gray-500 dark:text-gray-300 border border-sky-100 dark:border-slate-700">
            오늘 업데이트된 장면 · <span className="font-semibold text-primary">+12</span>
          </span> */}
        </div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-16">
            인기 콘텐츠를 불러오는 중이에요...
          </div>
        ) : (
          <Swiper
            modules={[Pagination, Autoplay]}
            loop
            speed={500}
            pagination={{ clickable: true }}
            autoplay={{
              delay: 4500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              0: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 16 },
              640: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 24 },
            }}
            style={swiperStyle}
            className="w-full landing-swiper"
          >
            {items.map((item, index) => (
              <SwiperSlide key={item.id} className="pb-10">
                <div className="h-full cursor-pointer">
                  <ContentCard
                    id={item.id}
                    image={item.image}
                    title={item.title}
                    short_description={item.short_description}
                    contents={item.contents}
                    episode={item.episode}
                    scene={item.scene}
                    level={item.level}
                    duration={item.duration}
                    comments={item.comments}
                    basePath={user ? '/study' : '/guest-study'}
                    isGuest={!user}
                    isPreview={!user}
                    openLoginModal={() => setShowSignIn(true)}
                    translatedTitleProp={trTitles[index]}
                    translatedDescProp={trDescs[index]}
                    translatedDurationProp={trDurations[index]}
                    translatedEpisodeProp={trEpisodes[index]}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
        <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
      </div>
    </motion.section>
  );
}

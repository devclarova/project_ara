import type { StudyListProps } from '@/types/study';
import { useNavigate } from 'react-router-dom';
import SignInModal from '../auth/SignInModal';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';

type ContentCardProps = StudyListProps & {
  basePath?: '/study' | '/guest-study';
  isPreview?: boolean;
  isGuest?: boolean;
  openLoginModal?: () => void; // 게스트가 잠금콘텐츠 클릭할 때 호출
};

export const InfoItem = ({ icon, text }: { icon: string; text?: string }) => {
  return (
    <span className="flex items-center gap-1 text-xs sm:text-[12px] md:text-sm text-gray-600 leading-none dark:text-gray-300">
      <i className={`${icon} text-[13px] relative top-[0.5px]`} />
      <span>{text}</span>
    </span>
  );
};

const ContentCard = ({
  id,
  image,
  title,
  contents,
  short_description,
  level,
  episode,
  scene,
  duration,
  basePath = '/study', // 기본: /study
  isPreview,
  isGuest,
  openLoginModal,
}: ContentCardProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const targetLang = i18n.language;

  // Auto Translations
  const { translatedText: translatedTitle } = useAutoTranslation(title, `study_title_${id}`, targetLang);
  const { translatedText: translatedDesc } = useAutoTranslation(short_description, `study_desc_${id}`, targetLang);
  const { translatedText: translatedDuration } = useAutoTranslation(duration || '', `study_duration_${id}`, targetLang);
  // Episode & Scene: Consistency Fix
  // Instead of auto-translating, we use static formats if possible to ensure consistency.
  // If the value is numeric, we apply a consistent format (e.g. "Ep 1", "1화").
  const formatValue = (key: string, val: string | number | null | undefined) => {
      if (!val) return '';
      // If it's a pure number or numeric string
      if (String(val).match(/^\d+$/)) {
          return t(`study.formats.${key}`, { val });
      }
      return String(val); // If mixed text, display as is (or could auto-translate if needed, but consistency first)
  };

  const displayEpisode = formatValue('episode', episode);
  const displayScene = formatValue('scene', scene);

  // Level Translation (Enum mapping)
  const translatedLevel = useMemo(() => {
    if (level === '초급') return t('study.level.beginner');
    if (level === '중급') return t('study.level.intermediate');
    if (level === '고급') return t('study.level.advanced');
    return level;
  }, [level, t]);

  // Title Formatting
  const isKoreanTitle = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title);
  let displayTitle = title;
  
  if (translatedTitle) {
     if (targetLang.startsWith('en')) {
         if (isKoreanTitle && translatedTitle.toLowerCase() !== title.toLowerCase()) {
            displayTitle = `${title} - ${translatedTitle}`;
         }
     } else if (targetLang.startsWith('ko')) {
         // 한국어 설정 시에는 번역 병기 하지 않음 (사용자 요청)
         displayTitle = title;
     } else {
         if (translatedTitle !== title) {
             displayTitle = `${title} - ${translatedTitle}`;
         }
     }
  }

  // Description Formatting
  let displayDesc = short_description;
  if (translatedDesc && translatedDesc !== short_description) {
      displayDesc = translatedDesc;
  }

  // Helpers
  const enc = (v?: string | number | null) => encodeURIComponent(String(v ?? ''));

  const buildStudyUrl = (row: {
    contents?: string | null;
    episode?: string | null;
    scene?: string | number | null;
  }) => {
    const c = enc(row.contents);
    const e = enc(row.episode);
    const s = row.scene != null && String(row.scene).length > 0 ? enc(row.scene) : null;
    return s ? `${basePath}/${c}/${e}/${s}` : `${basePath}/${c}/${e}`;
  };

  const handleClick = () => {
    if (isGuest && !isPreview) {
      openLoginModal?.(); // 로그인 모달
      return;
    }
    navigate(buildStudyUrl({ contents, episode, scene }));
  };

  return (
    <div
      onClick={handleClick}
      className="group relative rounded-xl shadow-lg cursor-pointer transition-all hover:shadow-xl sm:scale-[0.95] md:scale-100 sm:hover:scale-[0.98] origin-top duration-300 overflow-hidden transform-gpu ring-1 ring-transparent dark:bg-secondary"
    >
      {/* 이미지 */}
      <div className="flex justify-center items-center overflow-hidden">
        <div className="card__media relative w-full overflow-hidden rounded-t-xl">
          {/* 비율 유지 (모바일 4:5 → 태블릿 1:2 → 데스크톱 16:9 → 와이드 5:3) */}
          <div className="w-full pt-[110%] xs:pt-[85%] sm:pt-[75%] md:pt-[65%] lg:pt-[60%] xl:pt-[56%] min-h-[180px]" />
          {image ? (
            <img
              src={image}
              alt={displayTitle}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200 w-full h-full" />
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2">
        <div className="gird min-h-20">
          <h3 className="text-sm sm:text-[13px] md:text-base font-semibold text-gray-900 line-clamp-2 dark:text-gray-100">
            {displayTitle}
          </h3>
          <div className="flex flex-col gap-2 w-full mt-1">
            {/* 첫 번째 줄: episode | scene */}
            {(episode || scene) && (
              <div className="relative flex items-center justify-between w-full">
                {/* 가운데 구분선 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-transparent -translate-x-1/2" />

                {/* 왼쪽 아이템 */}
                <div className="flex items-center justify-start w-1/2 pr-3">
                  {episode && <InfoItem icon="ri-youtube-line" text={displayEpisode} />}
                </div>

                {/* 오른쪽 아이템 */}
                <div className="flex items-center justify-start w-1/2 pl-3">
                  {scene && <InfoItem icon="ri-clapperboard-line" text={displayScene} />}
                </div>
              </div>
            )}

            {/* 두 번째 줄: level | duration */}
            {(level || duration) && (
              <div className="relative flex items-center justify-between w-full dark:text-gray-300">
                {/* 가운데 구분선 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-transparent -translate-x-1/2" />

                {/* 왼쪽 */}
                <div className="flex items-center justify-start w-1/2 pr-3">
                  {level && <InfoItem icon="ri-star-line" text={translatedLevel} />}
                </div>

                {/* 오른쪽 */}
                <div className="flex items-center justify-start w-1/2 pl-3">
                  {duration && <InfoItem icon="ri-time-line" text={`${translatedDuration || duration}`} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover 오버레이 (배경) */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/80 md:bg-white/90 opacity-0 group-hover:opacity-100 transition duration-300"></div>
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-primary/20 md:bg-primary/30 opacity-0 group-hover:opacity-100 transition duration-300"></div>

      {/* Hover 내용 — 중앙의 작은 하얀 카드 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20 dark:bg-secondary">
        <div className="relative bg-white/90 rounded-[20px] w-[80%] max-w-[280px] sm:max-w-[320px] md:max-w-[340px] lg:max-w-[340px] h-[230px] sm:h-[190px] md:h-[190px] lg:h-[210px] p-5 sm:p-6 text-center flex flex-col justify-center gap-3 translate-y-1 group-hover:translate-y-0 transition-transform duration-300 dark:bg-gray-800">
          {/* 제목 */}
          <div className="text-[15px] sm:text-base font-semibold text-gray-900 leading-relaxed dark:text-gray-100 line-clamp-3">
            {displayTitle}
          </div>

          {/* 설명 */}
          <div className="mt-1 relative text-[12px] sm:text-[13px] text-gray-600 leading-relaxed pl-5 text-center dark:text-gray-300">
            <i
              className="ri-file-text-line absolute left-0 top-0 translate-y-[2px] sm:translate-y-[3px] text-[14px] sm:text-[15px] text-gray-500 dark:text-gray-300"
              aria-hidden
            />
            <span className="inline">{displayDesc}</span>
          </div>

          {/* 난이도 + 시간 */}
          <div className="mt-1 text-[12px] text-gray-500 flex items-center justify-center gap-3 dark:text-gray-300">
            <InfoItem icon="ri-star-line" text={translatedLevel} />
            <InfoItem icon="ri-time-line" text={`${translatedDuration || duration}`} />
          </div>
        </div>
      </div>

      {/* 게스트 */}
      {isGuest && !isPreview && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
          <div className="text-white text-sm font-semibold flex items-center gap-1">
            <i className="ri-lock-line text-lg"></i> {t('study.login_required')}
          </div>
        </div>
      )}
      {/* 미리보기 */}
      {isGuest && isPreview && (
        <span className="absolute top-3 left-3 z-30 bg-primary text-white px-2 py-1 text-[12px] font-semibold rounded-full">
          {t('study.preview')}
        </span>
      )}
    </div>
  );
};

export default ContentCard;

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
  translatedTitleProp?: string | null;
  translatedDescProp?: string | null;
  translatedDurationProp?: string | null;
  translatedEpisodeProp?: string | null;
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
  categories,
  translatedTitleProp,
  translatedDescProp,
  translatedDurationProp,
  translatedEpisodeProp,
}: ContentCardProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const targetLang = i18n.language;

  // Auto Translations
  const isMusic = categories?.includes('음악') || categories?.includes('Music');

  // Optimization: If prop is provided, pass empty string to hook to skip internal processing
  const { translatedText: translatedTitleHook } = useAutoTranslation(
    translatedTitleProp ? '' : title,
    `study_title_${id}`,
    targetLang,
  );
  const { translatedText: translatedDescHook } = useAutoTranslation(
    translatedDescProp ? '' : short_description,
    `study_desc_${id}`,
    targetLang,
  );
  const { translatedText: translatedDurationHook } = useAutoTranslation(
    translatedDurationProp ? '' : duration || '',
    `study_duration_${id}`,
    targetLang,
  );
  const { translatedText: translatedEpisodeHook } = useAutoTranslation(
    translatedEpisodeProp ? '' : episode || '',
    `study_episode_${id}`,
    targetLang,
  );

  const translatedTitle = translatedTitleProp || translatedTitleHook;
  const translatedDesc = translatedDescProp || translatedDescHook;
  const translatedDuration = translatedDurationProp || translatedDurationHook;
  const translatedEpisode = translatedEpisodeProp || translatedEpisodeHook;

  // Episode & Scene: Consistency Fix
  // Instead of auto-translating, we use static formats if possible to ensure consistency.
  // If the value is numeric, we apply a consistent format (e.g. "Ep 1", "1화").
  const formatValue = (key: string, val: string | number | null | undefined) => {
    if (!val) return '';
    const str = String(val).trim();
    // Use same robust regex as StudyPage to handle "Ep 1", "제1화", "1" etc.
    const match =
      str.match(/^(\d+)$/) || str.match(/^(?:ep|episode|제|第)?\.?\s*(\d+)(?:화|회|集|話)?$/i);

    if (match) {
      return t(`study.formats.${key}`, { val: match[1] });
    }
    return str;
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

  const shouldShowTranslation =
    translatedTitle &&
    (() => {
      if (targetLang.startsWith('ko')) return false;
      if (targetLang.startsWith('en')) {
        return isKoreanTitle && translatedTitle.toLowerCase() !== title.toLowerCase();
      }
      return translatedTitle !== title;
    })();

  if (shouldShowTranslation) {
    if (isMusic) {
      // Music: Original (Translated)
      displayTitle = `${title} (${translatedTitle})`;
    } else {
      // Others: Original - Translated
      displayTitle = `${title} - ${translatedTitle}`;
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

          {/* 게스트 잠금 오버레이 - 이미지 위에 은은하게 (Premium Look) */}
          {isGuest && !isPreview && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10 transition-colors group-hover:bg-black/50">
              <div className="relative group/lock">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full transform scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="bg-white/10 p-3 rounded-full border border-white/30 backdrop-blur-md shadow-2xl relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                  <i className="ri-lock-2-fill text-white text-2xl drop-shadow-md"></i>
                </div>
              </div>
            </div>
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
            {/* 첫 번째 줄: episode (or Song Title) | scene */}
            {(episode || scene || (isMusic && contents)) && (
              <div className="relative flex items-center justify-between w-full">
                {/* 가운데 구분선 (양쪽 다 있을 때만 표시) */}
                {scene && (
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-transparent -translate-x-1/2" />
                )}

                {/* 왼쪽 아이템 (Music: Content Title, Others: Episode) */}
                <div
                  className={`flex items-center justify-start ${scene ? 'w-1/2 pr-3' : 'w-full'}`}
                >
                  {isMusic
                    ? episode && (
                        <InfoItem
                          icon="ri-music-2-line"
                          text={
                            translatedEpisode && translatedEpisode !== episode
                              ? `${displayEpisode} (${translatedEpisode})`
                              : displayEpisode
                          }
                        />
                      )
                    : episode && <InfoItem icon="ri-youtube-line" text={displayEpisode} />}
                </div>

                {/* 오른쪽 아이템 (scene이 있을 때만 렌더링) */}
                {scene && (
                  <div className="flex items-center justify-start w-1/2 pl-3">
                    <InfoItem icon="ri-clapperboard-line" text={displayScene} />
                  </div>
                )}
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
                  {duration && (
                    <InfoItem icon="ri-time-line" text={`${translatedDuration || duration}`} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover 오버레이 (배경) - Primary Color Tints restored for brand identity */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/40 md:bg-white/50 opacity-0 group-hover:opacity-100 transition duration-300 z-20"></div>
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 z-20"></div>

      {/* Hover 내용 — 중앙의 작은 하얀 카드 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-30 dark:bg-secondary/10">
        <div
          className={`relative bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[20px] w-[85%] max-w-[280px] ${isGuest && !isPreview ? 'h-[250px]' : 'h-[220px]'} p-5 text-center flex flex-col justify-between translate-y-2 group-hover:translate-y-0 transition-transform duration-300 dark:bg-gray-800 border-2 border-primary/10 dark:border-primary/20`}
        >
          {/* 제목 - 고정 영역 */}
          <div className="flex-shrink-0 mb-2">
            <div className="text-[15px] sm:text-base font-bold text-gray-900 leading-[1.3] dark:text-gray-100 line-clamp-2 group-hover:text-primary transition-colors">
              {displayTitle}
            </div>
          </div>

          {/* 설명 - 유연한 영역 */}
          <div className="flex-1 overflow-hidden flex items-center justify-center px-1 py-2">
            {displayDesc && (
              <div className="text-[12px] sm:text-[13px] text-gray-600 leading-[1.5] dark:text-gray-300 line-clamp-4">
                {displayDesc}
              </div>
            )}
          </div>

          {/* 하단 메타 정보 - 고정 영역 */}
          <div className="flex-shrink-0 pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <i className="ri-star-fill text-primary/80"></i>
                <span>{translatedLevel}</span>
              </div>
              <div className="flex items-center gap-1">
                <i className="ri-time-line text-primary/80"></i>
                <span>{translatedDuration || duration}</span>
              </div>
            </div>
          </div>

          {/* 잠금 상태면 추가 표시 */}
          {isGuest && !isPreview && (
            <div className="mt-1.5 text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-900/20 py-1.5 rounded-lg flex items-center justify-center gap-1">
              <i className="ri-lock-2-line"></i>
              {t('study.login_required')}
            </div>
          )}
        </div>
      </div>

      {/* 미리보기 뱃지 (최상위) */}
      {isGuest && isPreview && (
        <span className="absolute top-3 left-3 z-[40] bg-primary/90 backdrop-blur-sm text-white px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-full shadow-sm tracking-wide border border-white/20">
          {t('study.preview')}
        </span>
      )}
    </div>
  );
};

export default ContentCard;

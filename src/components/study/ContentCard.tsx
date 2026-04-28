import type { StudyListProps } from '@/types/study';
import { useNavigate } from 'react-router-dom';
import SignInModal from '../auth/SignInModal';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { useAuth } from '@/contexts/AuthContext';

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
  required_plan,
  translatedTitleProp,
  translatedDescProp,
  translatedDurationProp,
  translatedEpisodeProp,
  created_at,
}: ContentCardProps) => {
  const { user, userPlan, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const targetLang = i18n.language;
  const isMusic = useMemo(() => {
    if (!categories) return false;
    const catStr = String(categories).toLowerCase();
    // Support multiple languages for music category detection (DB values + common labels)
    return catStr.includes('음악') || catStr.includes('music') || catStr.includes('音乐') || catStr.includes('音楽');
  }, [categories]);

  // 번역 최적화 파이프라인 — 외부 주입 번역 데이터(Prop) 존재 시 불필요한 자동 번역 훅(Internal Hook) 실행 스킵
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

  // 시각적 일관성 확보 — 자동 번역 대신 각 언어별 미리 정의된 포맷(i18n formats) 강제 적용
  // 숫자형 데이터(화/회 등)에 대한 정규화 필터링 수행
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
    if (!level) return '';
    const l = String(level).trim().toLowerCase();
    if (l === '초급' || l === 'beginner') return t('study.level.beginner');
    if (l === '중급' || l === 'intermediate') return t('study.level.intermediate');
    if (l === '고급' || l === 'advanced') return t('study.level.advanced');
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
    displayTitle = translatedTitle;
  }

  // Description Formatting
  let displayDesc = short_description;
  if (translatedDesc && translatedDesc !== short_description) {
    displayDesc = translatedDesc;
  }

  // Helpers
  const enc = (v?: string | number | null) => encodeURIComponent(String(v ?? ''));
  
  // 가시성 뱃지 로직 — 콘텐츠 생성 일자 기준 168시간(7일) 이내 여부 판별
  const isNew = useMemo(() => {
    if (!created_at) return false;
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const uploadTime = new Date(created_at).getTime();
    const currentTime = Date.now();
    return currentTime - uploadTime < sevenDaysInMs;
  }, [created_at]);

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

  const isPremiumLocked = required_plan === 'premium' && userPlan !== 'premium' && !isAdmin;

  const handleClick = () => {
    if (!contents || !episode) return;
    
    if (isGuest && !isPreview) {
      openLoginModal?.(); // 인증 인터페이스 트리거 — 비인증 사용자의 비미리보기 콘텐츠 접근 차단
      return;
    }

    if (isPremiumLocked) {
      navigate('/subscription');
      return;
    }
    
    navigate(buildStudyUrl({ contents, episode, scene }));
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col h-full rounded-xl shadow-lg cursor-pointer transition-all hover:shadow-xl sm:scale-[0.95] md:scale-100 sm:hover:scale-[0.98] origin-top duration-300 overflow-hidden transform-gpu ring-1 ring-transparent dark:bg-secondary"
    >
      {/* 이미지 구조 정석화 (Aspect-video 고정) */}
      <div className="card__media aspect-video relative w-full overflow-hidden rounded-t-xl">
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

        {/* 동적 권한 제어 오버레이 */}
        {((isGuest && !isPreview) || isPremiumLocked) && (
          <div className={`absolute inset-0 flex items-center justify-center z-10 transition-colors ${isPremiumLocked ? 'bg-black/60 backdrop-grayscale backdrop-blur-sm' : 'bg-black/40 backdrop-blur-[2px] group-hover:bg-black/50'}`}>
            <div className="relative group/lock flex flex-col items-center">
              <div className={`absolute inset-0 blur-xl rounded-full transform scale-150 transition-opacity duration-500 ${isPremiumLocked ? 'bg-[#00BFA5]/40 opacity-50 group-hover:opacity-100' : 'bg-primary/30 opacity-0 group-hover:opacity-100'}`}></div>
              <div className={`p-3 rounded-full border backdrop-blur-md shadow-2xl relative z-10 transform group-hover:scale-110 transition-transform duration-300 ${isPremiumLocked ? 'bg-[#0a1a14]/80 border-[#00BFA5]/50' : 'bg-white/10 border-white/30'}`}>
                <i className={`ri-lock-2-fill text-2xl drop-shadow-md ${isPremiumLocked ? 'text-[#00F0FF]' : 'text-white'}`}></i>
              </div>
              {isPremiumLocked && (
                <span className="mt-3 relative z-10 text-[#00F0FF] text-xs font-black tracking-widest uppercase drop-shadow-lg">
                  Premium Only
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 본문 구조 정석화 (flex-1 적용) */}
      <div className="flex-1 px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2">
        <div className="grid min-h-20">
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
                  {episode && (
                    <InfoItem
                      icon={isMusic ? 'ri-music-2-line' : 'ri-youtube-line'}
                      text={
                        translatedEpisode && translatedEpisode !== episode
                          ? translatedEpisode
                          : displayEpisode
                      }
                    />
                  )}
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

      {/* 상세 명세 오버레이 — 호버 시 노출되는 메타데이터 요약 및 숏 디스크립션 레이어 */}
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
          {((isGuest && !isPreview) || isPremiumLocked) && (
            <div className={`mt-1.5 text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 ${isPremiumLocked ? 'text-[#AA771C] bg-[#D4AF37]/20 border border-[#D4AF37]/30' : 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'}`}>
              <i className="ri-lock-2-line"></i>
              {isPremiumLocked ? `👑 ${t('subscription.premium_only')}` : t('study.login_required')}
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

      {/* NEW 뱃지 (최상위) - 업로드 7일 이내 */}
      {isNew && (
        <span className="absolute top-3 right-3 z-[40] bg-rose-600 text-white px-2.5 py-1 text-[10px] sm:text-[11px] font-black rounded-md shadow-lg shadow-rose-500/30 tracking-tighter border border-white/20 animate-pulse">
          NEW
        </span>
      )}
    </div>
  );
};

export default ContentCard;

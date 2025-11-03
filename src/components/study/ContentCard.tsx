import type { StudyListProps } from '@/types/study';
import { useNavigate } from 'react-router-dom';

const InfoItem = ({ icon, text }: { icon: string; text?: string }) => {
  return (
    <span className="flex items-center gap-1 text-xs sm:text-[12px] md:text-sm text-gray-600 leading-none">
      <i className={`${icon} text-[13px] relative top-[0.5px]`} />
      <span>{text}</span>
    </span>
  );
};

const ContentCard = ({
  id,
  image,
  title,
  short_description,
  level,
  episode,
  scene,
  // levelColor,
  duration,
}: StudyListProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/study/${id}`)}
      className="group relative rounded-xl shadow-lg cursor-pointer transition-all hover:shadow-xl sm:scale-[0.95] md:scale-100 sm:hover:scale-[0.98] origin-top duration-300 overflow-hidden transform-gpu ring-1 ring-transparent"
    >
      {/* 이미지 */}
      <div className="flex justify-center items-center overflow-hidden">
        <div className="card__media relative w-full overflow-hidden rounded-t-xl">
          {/* 비율 유지 (모바일 4:5 → 태블릿 1:2 → 데스크톱 16:9 → 와이드 5:3) */}
          <div className="w-full pt-[110%] xs:pt-[85%] sm:pt-[75%] md:pt-[65%] lg:pt-[60%] xl:pt-[56%] min-h-[180px]" />
          {image ? (
            <img
              src={image}
              alt={title}
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
          <h3 className="text-sm sm:text-[13px] md:text-base font-semibold text-gray-900 line-clamp-1">
            {title}
          </h3>
          <div className="flex flex-col gap-2 w-full mt-1">
            {/* 첫 번째 줄: episode | scene */}
            {(episode || scene) && (
              <div className="relative flex items-center justify-between w-full">
                {/* 가운데 구분선 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-transparent -translate-x-1/2" />

                {/* 왼쪽 아이템 */}
                <div className="flex items-center justify-start w-1/2 pr-3">
                  {episode && <InfoItem icon="ri-youtube-line" text={episode} />}
                </div>

                {/* 오른쪽 아이템 */}
                <div className="flex items-center justify-start w-1/2 pl-3">
                  {scene && <InfoItem icon="ri-clapperboard-line" text={scene} />}
                </div>
              </div>
            )}

            {/* 두 번째 줄: level | duration */}
            {(level || duration) && (
              <div className="relative flex items-center justify-between w-full">
                {/* 가운데 구분선 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-transparent -translate-x-1/2" />

                {/* 왼쪽 */}
                <div className="flex items-center justify-start w-1/2 pr-3">
                  {level && <InfoItem icon="ri-star-line" text={level} />}
                </div>

                {/* 오른쪽 */}
                <div className="flex items-center justify-start w-1/2 pl-3">
                  {duration && <InfoItem icon="ri-time-line" text={`${duration}`} />}
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
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20">
        <div className="relative bg-white/90 rounded-[20px] w-[80%] max-w-[280px] sm:max-w-[320px] md:max-w-[340px] lg:max-w-[340px] h-[230px] sm:h-[190px] md:h-[190px] lg:h-[210px] p-5 sm:p-6 text-center flex flex-col justify-center gap-3 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          {/* 제목 */}
          <div className="text-[15px] sm:text-base font-semibold text-gray-900 leading-relaxed">
            {title}
          </div>

          {/* 설명 */}
          <div className="mt-1 relative text-[12px] sm:text-[13px] text-gray-600 leading-relaxed pl-5 text-center">
            <i
              className="ri-file-text-line absolute left-0 top-0 translate-y-[2px] sm:translate-y-[3px] text-[14px] sm:text-[15px] text-gray-500"
              aria-hidden
            />
            <span className="inline">{short_description}</span>
          </div>

          {/* 난이도 + 시간 */}
          <div className="mt-1 text-[12px] text-gray-500 flex items-center justify-center gap-3">
            <InfoItem icon="ri-star-line" text={level} />
            <InfoItem icon="ri-time-line" text={`${duration}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;

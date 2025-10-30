import type { StudyListProps } from '@/types/study';
import { useNavigate } from 'react-router-dom';

const ContentCard = ({
  id,
  image,
  title,
  // subtitle,
  // desc,
  short_description,
  level,
  levelColor,
  duration,
  comments,
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
          <div className="w-full pt-[80%] xs:pt-[50%] sm:pt-[50%] md:pt-[56.25%] lg:pt-[60%] xl:pt-[48%] min-h-[140px]"></div>

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
      <div className="card__body px-3 py-3 sm:px-3 sm:py-3 md:px-4 md:py-4">
        <div className="card__content">
          <h3 className="card__title text-sm sm:text-[13px] md:text-base font-semibold text-gray-900 line-clamp-1">
            {title}
          </h3>
          <p className="card__subtitle text-xs sm:text-[12px] md:text-sm text-gray-600 line-clamp-2">
            {level} · {duration}
          </p>
        </div>
      </div>

      {/* Hover 오버레이 (배경) */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/80 md:bg-white/90 opacity-0 group-hover:opacity-100 transition duration-300"></div>
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-primary/20 md:bg-primary/30 opacity-0 group-hover:opacity-100 transition duration-300"></div>

      {/* Hover 내용 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
        <div className="bg-white/85 backdrop-blur-sm rounded-lg md:w-52 md:h-56 sm:w-72 sm:h-64 p-4 text-center flex flex-col justify-center gap-4">
          <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
          <div className="mt-1 text-xs text-gray-600">설명 : {short_description}</div>
          <div className="mt-1 text-xs text-gray-500">난이도 : {level}</div>
          <div className="text-xs text-gray-500">시간 : {duration}</div>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;

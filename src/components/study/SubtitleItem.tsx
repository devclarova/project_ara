import React from 'react';
import type { Subtitle } from '../../types/study';
import { useTranslation } from 'react-i18next';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';

interface SubtitleItemProps {
  subtitle: Subtitle;
  onSelect: (subtitle: Subtitle) => void;
  onSeek?: (start: number) => void;
  translatedPron?: string | null;
  translatedContent?: string | null;
}

const SubtitleItem: React.FC<SubtitleItemProps> = ({ subtitle, onSelect, onSeek, translatedPron, translatedContent }) => {

  return (
    <li className="p-2.5 sm:p-3 bg-white/50 dark:bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 cursor-default">
      {subtitle.korean_subtitle && (
        <button
          className="block w-full text-base sm:text-lg text-gray-600 dark:text-gray-100 hover:text-primary/80 dark:hover:text-primary/80 text-left cursor-pointer transition-colors"
          onClick={() => {
            onSelect(subtitle);
            const start = subtitle.subtitle_start_time ?? 0;
            onSeek?.(start);
          }}
        >
          {subtitle.korean_subtitle}
        </button>
      )}
      {/* 지역화 데이터 바인딩 — 번역 파이프라인에서 수신된 발음/내용 데이터가 존재할 경우 우선 렌더링, 부재 시 원문 노출 */}
      {(translatedPron || subtitle.pronunciation) && (
        <div className="block w-full text-base sm:text-lg text-gray-500 dark:text-gray-400 text-left mt-1 cursor-default select-text">
          [{translatedPron || subtitle.pronunciation}]
        </div>
      )}
      {/* 내용 번역 (또는 원본) */}
      {(translatedContent || subtitle.english_subtitle) && (
        <div className="block w-full text-base sm:text-lg text-gray-700 dark:text-gray-300 text-left mt-0.5 cursor-default select-text">
          {translatedContent || subtitle.english_subtitle}
        </div>
      )}
    </li>
  );
};

export default SubtitleItem;

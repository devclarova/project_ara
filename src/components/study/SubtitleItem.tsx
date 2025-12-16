import React from 'react';
import type { Subtitle } from '../../types/study';
import { useTranslation } from 'react-i18next';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';

interface SubtitleItemProps {
  subtitle: Subtitle;
  onSelect: (subtitle: Subtitle) => void;
  onSeek?: (start: number) => void;
}

const SubtitleItem: React.FC<SubtitleItemProps> = ({ subtitle, onSelect, onSeek }) => {
  const { i18n } = useTranslation();
  const targetLang = i18n.language;

  // 발음 번역 (옵션)
  const { translatedText: translatedPron } = useAutoTranslation(
    subtitle.pronunciation ?? '',
    `subtitle_pron_${subtitle.id}`,
    targetLang
  );
  
  // 내용(영어 자막) 번역
  const { translatedText: translatedContent } = useAutoTranslation(
    subtitle.english_subtitle ?? '',
    `subtitle_content_${subtitle.id}`,
    targetLang
  );

  return (
    <li className="p-2.5 sm:p-3 bg-white dark:bg-secondary rounded-lg shadow cursor-pointer hover:bg-gray-50 hover:border-l-4 hover:border-primary dark:hover:border-gray-600">
      {subtitle.korean_subtitle && (
        <button
          className="block w-full text-base sm:text-lg text-gray-600 dark:text-gray-100 hover:text-green-600 dark:hover:text-gray-400 text-left"
          onClick={() => {
            onSelect(subtitle);
            const start = subtitle.subtitle_start_time ?? 0;
            onSeek?.(start);
          }}
        >
          {subtitle.korean_subtitle}
        </button>
      )}
      {/* 발음 번역 (또는 원본) */}
      {(translatedPron || subtitle.pronunciation) && (
        <button
          className="block w-full text-base sm:text-lg text-gray-500 dark:text-gray-100 text-left"
          onClick={() => onSelect(subtitle)}
        >
          [{translatedPron || subtitle.pronunciation}]
        </button>
      )}
      {/* 내용 번역 (또는 원본) */}
      {(translatedContent || subtitle.english_subtitle) && (
        <button
          className="block w-full text-base sm:text-lg text-gray-700 dark:text-gray-100 text-left"
          onClick={() => onSelect(subtitle)}
        >
          {translatedContent || subtitle.english_subtitle}
        </button>
      )}
    </li>
  );
};

export default SubtitleItem;

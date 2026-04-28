import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import TranslatedCultureNoteItem from './TranslatedCultureNoteItem';

interface CultureNoteData {
  id: number;
  title: string | null;
  subtitle: string | null;
}

interface CultureNoteContentData {
  culture_note_id: number;
  content_value: string;
}

interface Props {
  note: CultureNoteData;
  contents: CultureNoteContentData[];
  translatedTitle?: string;
  translatedSubtitle?: string;
  translatedContents?: string[];
  isKorean: boolean;
}

const TranslatedCultureNoteView: React.FC<Props> = ({ 
  note, 
  contents, 
  translatedTitle, 
  translatedSubtitle,
  translatedContents = [],
  isKorean
}) => {
  const { t } = useTranslation();

  // 한국어 원문 보존 로직 (User Request: "원문 단어는 한국어로 그대로 나와야해")
  // 타 언어 환경에서는 "원문 [번역]" 패턴 사용, 한국어 환경에서는 원문만 노출
  const displayTitle = useMemo(() => {
    const rawTitle = note.title || t('study.culture_note.default_title', '문화 노트');
    if (isKorean) return rawTitle;
    
    const trTitle = translatedTitle || rawTitle;
    if (trTitle === rawTitle) return rawTitle;
    
    return `${rawTitle} [${trTitle}]`;
  }, [note.title, translatedTitle, isKorean, t]);

  const displaySubtitle = isKorean ? note.subtitle : (translatedSubtitle || note.subtitle);

  return (
    <div className="p-3 sm:p-4 bg-white dark:bg-secondary dark:text-gray-300 border dark:border-gray-600 rounded-lg shadow-sm">
      <h4 className="text-base sm:text-lg font-semibold mb-1">{displayTitle}</h4>

      {(displaySubtitle) && (
        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line p-1">
          {displaySubtitle}
        </p>
      )}

      <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
        {contents.length > 0 ? (
          contents.map((item, index) => (
            <TranslatedCultureNoteItem
              key={index}
              content={item.content_value}
              translatedValue={translatedContents[index]}
              isKorean={isKorean}
            />
          ))
        ) : (
          <li className="flex items-start text-sm sm:text-base">
            <span className="text-pink-500 mr-2">•</span>
            <span>{t('study.culture_note.empty_list', '리스트 항목이 없습니다.')}</span>
          </li>
        )}
      </ul>
    </div>
  );
};
export default TranslatedCultureNoteView;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
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
}

const TranslatedCultureNoteView: React.FC<Props> = ({ note, contents }) => {
  const { i18n } = useTranslation();
  const targetLang = i18n.language;
  
  const { translatedText: translatedTitle } = useAutoTranslation(
    note.title ?? '', 
    `cult_title_${note.id}`, 
    targetLang
  );
  
  const { translatedText: translatedSubtitle } = useAutoTranslation(
    note.subtitle ?? '', 
    `cult_subtitle_${note.id}`, 
    targetLang
  );

  let displayTitle = note.title || '문화 노트';
  if (translatedTitle && translatedTitle !== note.title) {
    displayTitle = `${note.title} - ${translatedTitle}`;
  }

  return (
     <div className="p-3 sm:p-4 bg-white dark:bg-secondary dark:text-gray-300 border dark:border-gray-600 rounded-lg shadow-sm">
        <h4 className="text-base sm:text-lg font-semibold mb-1">
          {displayTitle}
        </h4>

        {(translatedSubtitle || note.subtitle) && (
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line p-1">
            {translatedSubtitle || note.subtitle}
          </p>
        )}

        <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
          {contents.length > 0 ? (
            contents.map((item, index) => (
               <TranslatedCultureNoteItem 
                 key={index} 
                 content={item.content_value} 
                 idKey={`${note.id}_${index}`} 
               /> 
            ))
          ) : (
            <li className="flex items-start text-sm sm:text-base">
              <span className="text-pink-500 mr-2">•</span>
              <span>리스트 항목이 없습니다.</span>
            </li>
          )}
        </ul>
      </div>
  );
};
export default TranslatedCultureNoteView;

import React from 'react';

interface Props {
  content: string;
  translatedValue?: string;
  isKorean: boolean;
  isTranslating?: boolean;
}

const TranslatedCultureNoteItem: React.FC<Props> = ({ content, translatedValue, isKorean, isTranslating }) => {
  const displayContent = isKorean ? content : (translatedValue || content);

  return (
    <li className="flex items-start text-sm sm:text-base cursor-default">
      <span className="text-pink-500 mr-2">•</span>
      {isTranslating ? (
        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse my-0.5" />
      ) : (
        <span>{displayContent}</span>
      )}
    </li>
  );
};
export default TranslatedCultureNoteItem;

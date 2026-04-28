import React from 'react';

interface Props {
  content: string;
  translatedValue?: string;
  isKorean: boolean;
}

const TranslatedCultureNoteItem: React.FC<Props> = ({ content, translatedValue, isKorean }) => {
  const displayContent = isKorean ? content : (translatedValue || content);

  return (
    <li className="flex items-start text-sm sm:text-base cursor-default">
      <span className="text-pink-500 mr-2">•</span>
      <span>{displayContent}</span>
    </li>
  );
};
export default TranslatedCultureNoteItem;

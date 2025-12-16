import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';

interface Props {
  content: string;
  idKey: string; // 고유 키
}

const TranslatedCultureNoteItem: React.FC<Props> = ({ content, idKey }) => {
  const { i18n } = useTranslation();
  
  const { translatedText } = useAutoTranslation(
    content, 
    `cult_content_${idKey}`, 
    i18n.language
  );
  
  return (
    <li className="flex items-start text-sm sm:text-base">
       <span className="text-pink-500 mr-2">•</span>
       <span>{translatedText || content}</span>
    </li>
  );
};
export default TranslatedCultureNoteItem;

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  content: string;
  translatedValue?: string;
  isKorean: boolean;
  translationStatus?: 'idle' | 'loading' | 'success' | 'error';
}

const TranslatedCultureNoteItem: React.FC<Props> = ({ content, translatedValue, isKorean, translationStatus }) => {
  const displayContent = isKorean ? content : (translatedValue || content);

  return (
    <li className="flex items-start text-sm sm:text-base cursor-default">
      <span className="text-pink-500 mr-2">•</span>
      {!isKorean && translationStatus === 'loading' ? (
        <Skeleton className="h-4 w-5/6 my-0.5" />
      ) : (
        <span>{displayContent}</span>
      )}
    </li>
  );
};
export default TranslatedCultureNoteItem;

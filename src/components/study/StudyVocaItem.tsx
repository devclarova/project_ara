import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import type { WordItem } from './StudyVoca';

interface StudyVocaItemProps {
  item: WordItem;
  id: number; // for unique cache key
}

const StudyVocaItem: React.FC<StudyVocaItemProps> = ({ item, id }) => {
  const { i18n } = useTranslation();
  const targetLang = i18n.language;

  // 단어(term)는 번역하지 않고 그대로 사용
  // 뜻(meaning) 번역
  const { translatedText: translatedMeaning } = useAutoTranslation(
    item.meaning,
    `voca_meaning_${id}`,
    targetLang,
  );

  // 예문(example) 번역
  const { translatedText: translatedExample } = useAutoTranslation(
    item.example ?? '',
    `voca_example_${id}`,
    targetLang,
  );

  // 품사(pos) 번역
  const { translatedText: translatedPos } = useAutoTranslation(
    item.pos ?? '',
    `voca_pos_${id}`,
    targetLang,
  );

  // 발음(pron) 번역
  const { translatedText: translatedPron } = useAutoTranslation(
    item.pron ?? '',
    `voca_pron_${id}`,
    targetLang,
  );

  return (
    <div className="p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-secondary shadow-sm hover:bg-gray-50 dark:hover:bg-primary/5 transition-colors w-full min-h-[140px] h-full flex flex-col cursor-pointer">
      <h4 className="font-semibold dark:text-gray-300">{item.term}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {translatedMeaning || item.meaning}
      </p>

      {/* 품사 및 발음 */}
      {(item.pos || item.pron) && (
        <p className="text-[11px] text-gray-400 mt-1">
          {item.pos ? `(${translatedPos || item.pos})` : ''}
          {item.pron ? ` · ${translatedPron || item.pron}` : ''}
        </p>
      )}

      {/* 예문 */}
      {item.example && (
        <p className="text-xs text-gray-400 mt-1">예: {translatedExample || item.example}</p>
      )}
    </div>
  );
};

export default StudyVocaItem;

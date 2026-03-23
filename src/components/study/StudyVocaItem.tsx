import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { useTranslation } from 'react-i18next';
import type { WordItem } from './StudyVoca';

interface StudyVocaItemProps {
  item: WordItem;
  id: number;
}

const normalize = (v?: string | null) => (v ?? '').trim();

const StudyVocaItem = ({ item, id }: StudyVocaItemProps) => {
  const { i18n, t } = useTranslation();
  const targetLang = i18n.language;
  const isKorean = targetLang.toLowerCase().startsWith('ko');

  const meaningSrc = normalize(item.meaning);
  const exampleSrc = normalize(item.example);
  const posSrc = normalize(item.pos);
  const pronSrc = normalize(item.pron);

  const { translatedText: translatedMeaning } = useAutoTranslation(
    meaningSrc,
    `voca_meaning_${id}`,
    targetLang,
  );

  const { translatedText: translatedExample } = useAutoTranslation(
    exampleSrc,
    `voca_example_${id}`,
    targetLang,
  );

  const { translatedText: translatedPos } = useAutoTranslation(
    posSrc,
    `voca_pos_${id}`,
    targetLang,
  );

  // 한국어면 원문 유지, 아니면 번역문으로 대체
  const displayMeaning = isKorean ? meaningSrc : normalize(translatedMeaning) || meaningSrc;
  const displayExample = isKorean ? exampleSrc : normalize(translatedExample) || exampleSrc;
  const displayPos = isKorean ? posSrc : normalize(translatedPos) || posSrc;

  // 발음은 항상 원문 그대로 유지
  const displayPron = pronSrc;

  return (
    <div className="p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-secondary shadow-sm hover:bg-gray-50 dark:hover:bg-primary/5 transition-colors w-full min-h-[140px] h-full flex flex-col cursor-pointer">
      <div className="flex items-baseline gap-2">
        <h4 className="font-semibold dark:text-gray-300">{item.term}</h4>

        {displayPron ? (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            [{displayPron}]
          </span>
        ) : null}
      </div>

      {displayPos ? (
        <div className="mt-1 text-[14px] text-gray-500 dark:text-gray-400 font-medium">
          ({displayPos})
        </div>
      ) : null}

      {displayMeaning ? (
        <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 font-medium">
          {displayMeaning}
        </div>
      ) : null}

      {displayExample ? (
        <div className="mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            <span className="mr-1">{t('exampleLabel', '예:')}</span>
            <span>{displayExample}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default StudyVocaItem;

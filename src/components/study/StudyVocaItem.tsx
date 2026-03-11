import { useTranslation } from 'react-i18next';
import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import type { WordItem } from './StudyVoca';

interface StudyVocaItemProps {
  item: WordItem;
  id: number;
}

const normalize = (v?: string | null) => (v ?? '').trim();

const StudyVocaItem = ({ item, id }: StudyVocaItemProps) => {
  const { i18n, t } = useTranslation();
  const targetLang = i18n.language;

  const meaningSrc = normalize(item.meaning);
  const exampleSrc = normalize(item.example);
  const posSrc = normalize(item.pos);
  const pronSrc = normalize(item.pron);

  // 훅은 조건부로 호출하면 안 되니까 "항상" 호출
  // 대신 빈값이면 훅이 알아서 no-op 하도록(또는 UI에서 안 보여주도록) 처리

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

  const { translatedText: translatedPron } = useAutoTranslation(
    pronSrc,
    `voca_pron_${id}`,
    targetLang,
  );

  const isDifferent = (a?: string | null, b?: string | null) => {
    const A = normalize(a);
    const B = normalize(b);
    return !!A && !!B && A !== B;
  };

  const renderPair = (
    original?: string | null,
    translated?: string | null,
    originalClassName = 'text-sm text-gray-700 dark:text-gray-300 font-medium',
    translatedClassName = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5',
  ) => {
    const o = normalize(original);
    const tr = normalize(translated);

    if (!o) return null;

    return (
      <div>
        <p className={originalClassName}>{o}</p>
        {tr && isDifferent(o, tr) && <p className={translatedClassName}>{tr}</p>}
      </div>
    );
  };

  return (
    <div className="p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-secondary shadow-sm hover:bg-gray-50 dark:hover:bg-primary/5 transition-colors w-full min-h-[140px] h-full flex flex-col cursor-pointer">
      <div className="flex items-baseline gap-2">
        <h4 className="font-semibold dark:text-gray-300">{item.term}</h4>

        {!!pronSrc && (
          <div className="leading-tight">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              [{pronSrc}]
            </span>

            {normalize(translatedPron) && isDifferent(pronSrc, translatedPron) && (
              <div className="text-[11px] text-gray-400 dark:text-gray-500">
                [{normalize(translatedPron)}]
              </div>
            )}
          </div>
        )}
      </div>

      {/* pos */}
      {!!posSrc && (
        <div className="mt-1">
          {renderPair(
            posSrc,
            translatedPos,
            'text-[14px] text-gray-500 dark:text-gray-400 font-medium',
          )}
        </div>
      )}
      {/* meaning */}
      {!!meaningSrc && <div className="mt-1">{renderPair(meaningSrc, translatedMeaning)}</div>}

      {/* example */}
      {!!exampleSrc && (
        <div className="mt-1">
          {/* 같은 줄: 예: + 원문 */}
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            <span className="mr-1">{t('exampleLabel', '예:')}</span>
            <span>{exampleSrc}</span>
          </p>

          {/* 다음 줄: 번역 */}
          {normalize(translatedExample) && isDifferent(exampleSrc, translatedExample) && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              {normalize(translatedExample)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyVocaItem;

import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import type { WordItem } from './StudyVoca';
import { romanizeKorean, hasKorean } from '@/utils/romanize';

const normalize = (v?: string | null) => (v ?? '').trim();

interface StudyVocaItemProps {
  item: WordItem;
  id: number;
  translatedMeaningProp?: string;
  translatedPronProp?: string;
  translatedExampleProp?: string;
  translatedPosProp?: string;
}

const StudyVocaItem = ({
  item,
  id,
  translatedMeaningProp,
  translatedPronProp,
  translatedExampleProp,
  translatedPosProp,
}: StudyVocaItemProps) => {
  const { i18n, t } = useTranslation();
  const targetLang = i18n.language;
  const isKorean = targetLang.toLowerCase().startsWith('ko');

  const meaningSrc = normalize(item.meaning);
  const exampleSrc = normalize(item.example);
  const posSrc = normalize(item.pos);
  const pronSrc = normalize(item.pron);

  // 개별 자동 번역 로직 — 부모로부터 주입된 Props(translated*Prop)가 없을 때만 활성화 (성능 최적화)
  const { translatedText: translatedMeaningHook } = useAutoTranslation(
    translatedMeaningProp ? '' : meaningSrc,
    `voca_meaning_${id}`,
    targetLang,
  );

  const { translatedText: translatedPronHook } = useAutoTranslation(
    translatedPronProp ? '' : (isKorean ? pronSrc : (pronSrc || item.term)), // 한국어는 DB 값만, 타국어는 부재 시 원문 전사 요청
    `voca_pron_${id}`,
    targetLang,
  );

  const { translatedText: translatedExampleHook } = useAutoTranslation(
    translatedExampleProp ? '' : exampleSrc,
    `voca_example_${id}`,
    targetLang,
  );

  // 품사(PoS) 매핑 로직 — 한국어 원문 품사를 정적 i18n 키로 매핑하여 정확도 향상
  const mappedPos = useMemo(() => {
    const rawPos = posSrc.replace(/[()]/g, '').trim();
    if (!rawPos) return '';
    const POS_KEY_MAP: Record<string, string> = {
      '명사': 'voca.pos.noun',
      '동사': 'voca.pos.verb',
      '형용사': 'voca.pos.adjective',
      '부사': 'voca.pos.adverb',
      '대명사': 'voca.pos.pronoun',
      '수사': 'voca.pos.numeral',
      '조사': 'voca.pos.particle',
      '감탄사': 'voca.pos.interjection',
      '관형사': 'voca.pos.determiner',
    };
    const key = POS_KEY_MAP[rawPos];
    return key ? t(key) : rawPos;
  }, [posSrc, t]);

  const { translatedText: translatedPosHook } = useAutoTranslation(
    translatedPosProp ? '' : (mappedPos === posSrc ? mappedPos : ''), // 이미 i18n으로 번역되었다면 자동번역 스킵
    `voca_pos_${id}`,
    targetLang,
  );

  // 렌더링 텍스트 결정 — Prop 우선 > 한국어 원문(TargetLang이 한국어인 경우) > 자동번역 순
  const displayMeaning = translatedMeaningProp || (isKorean ? meaningSrc : (normalize(translatedMeaningHook) || meaningSrc));
  const displayExample = translatedExampleProp || (isKorean ? exampleSrc : (normalize(translatedExampleHook) || exampleSrc));
  const displayPos = translatedPosProp || (isKorean ? posSrc : (mappedPos !== posSrc ? mappedPos : (normalize(translatedPosHook) || posSrc)));
  
  // 발음(Pronunciation) 처리 — 부모 주입 또는 자동 번역된 현지어 발음 표기를 최우선으로 사용
  const displayPron = useMemo(() => {
    // 1. 번역된 데이터 우선 (배치 번역 또는 개별 자동 번역)
    const translated = translatedPronProp || translatedPronHook;
    if (translated) return normalize(translated);

    // 2. 한국어 타겟이고 DB에 발음 정보가 없는 경우 원문 노출 (또는 필요 시 빈값)
    if (isKorean) return normalize(item.pron);

    // 3. 타국어 타겟인데 번역이 아직 안 된 경우의 폴백
    const pron = normalize(item.pron);
    if (pron && !hasKorean(pron)) return pron; // 이미 로마자/현지어라면 그대로 노출
    
    // DB 발음 정보가 없거나 한국어일 경우 원문을 로마자로 변환 (최종 폴백)
    return romanizeKorean(item.term);
  }, [translatedPronProp, translatedPronHook, item.pron, item.term, isKorean]);

  // 단어(Term)는 번역하지 않고 항상 원문 주입 (User Request: "단어 원문은 번역되면 안되고")
  const displayTerm = item.term;

  return (
    <div className="p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-secondary shadow-sm hover:bg-gray-50 dark:hover:bg-primary/5 transition-colors w-full min-h-[140px] h-full flex flex-col cursor-pointer">
      <div className="flex items-baseline gap-2">
        <h4 className="font-semibold dark:text-gray-300">{displayTerm}</h4>

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
            <span className="mr-1">{t('study.voca.example_label')}</span>
            <span>{displayExample}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default StudyVocaItem;

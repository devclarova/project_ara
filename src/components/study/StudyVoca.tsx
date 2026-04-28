import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import StudyVocaItem from './StudyVocaItem';
import EpisodeVocabModal, { type EpisodeWord } from '@/components/study/EpisodeVocaModal';
import { useTranslation } from 'react-i18next';
import { useBatchAutoTranslation } from '@/hooks/useBatchAutoTranslation';
import { romanizeKorean, hasKorean } from '@/utils/romanize';

type WordRow = {
  id: number;
  study_id: number | null;
  words: string | null;
  means: string | null;
  example: string | null;
  parts_of_speech?: string | null;
  pronunciation?: string | null;
  image_url?: string | null;
};

export type WordItem = {
  id?: number;
  term: string;
  meaning: string;
  example?: string;
  pos?: string;
  pron?: string;
  image_url?: string | null;
};

type StudyVocaProps = {
  words?: WordItem[];
  studyId?: number;
  subscribeRealtime?: boolean;
  className?: string;

  sourceStudyPath?: string;
  sourceStudyTitle?: string;
};

// 반응형 그리드 시스템 — 뷰포트 세그먼트(sm/lg)에 최적화된 데이터 노출 밀도(PageSize) 계산
const useResponsivePageSize = () => {
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 640) setPageSize(1);
      else if (w < 1024) setPageSize(4);
      else setPageSize(6);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  return pageSize;
};

const StudyVoca = ({
  words,
  studyId,
  subscribeRealtime = false,
  className,
  sourceStudyPath,
  sourceStudyTitle,
}: StudyVocaProps) => {
  const { t } = useTranslation();
  const controlled = Array.isArray(words) && words.length > 0;

  const [localWords, setLocalWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!controlled && !!studyId);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = useResponsivePageSize();

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialWordId, setInitialWordId] = useState<string | undefined>(undefined);

  // 데이터 매핑 브릿지 — 영속성 레이어(Database Row)의 필드명을 UI 전용 데이터 규격(WordItem)으로 정규화
  const mapRow = (row: WordRow): WordItem | null => {
    if (!row.words || !row.means) return null;

    return {
      id: row.id,
      term: row.words,
      meaning: row.means,
      example: row.example ?? undefined,
      pos: row.parts_of_speech ?? undefined,
      pron: row.pronunciation ?? undefined,
      image_url: row.image_url ?? undefined,
    };
  };

  // 자체 fetch 모드일 때만 동작
  useEffect(() => {
    if (controlled) return;
    if (!studyId && studyId !== 0) return;

    let alive = true;

    const fetchWords = async () => {
      // 컴플라이언스 체크 — 비동기 요청 시작 시 멱등성 보장을 위해 이전 상태 초기화 및 로딩 게이트 개방
      setLoading(true);
      setError(null);

      const { data, error } = await (supabase.from('word') as any)
        .select('id, study_id, words, means, example, parts_of_speech, pronunciation, image_url')
        .eq('study_id', studyId)
        .order('id', { ascending: true });

      if (!alive) return;

      if (error) {
        console.error('단어 데이터 가져오기 오류:', error);
        setError(error.message);
        setLocalWords([]);
      } else {
        // console.log('word raw data:', data);
        const mapped = (data ?? []).map(mapRow).filter((v: any): v is WordItem => v !== null);
        // console.log('mapped words:', mapped);
        setLocalWords(mapped);
      }

      setLoading(false);
    };

    fetchWords();

    const channel =
      subscribeRealtime && studyId != null
        ? supabase
            .channel(`word:study:${studyId}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'word', filter: `study_id=eq.${studyId}` },
              fetchWords,
            )
            .subscribe()
        : null;

    return () => {
      alive = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [controlled, studyId, subscribeRealtime]);

  // 데이터 가용성 판별 — 외부 주입 데이터(Controlled)와 내부 패치 데이터(Local) 중 유효한 소스 자동 선택
  const data = useMemo<WordItem[]>(() => {
    if (controlled) return words!;
    return localWords;
  }, [controlled, words, localWords]);

  // 모달에 넘길 words(EpisodeWord[])로 변환
  const modalWords: EpisodeWord[] = useMemo(() => {
    const sid = studyId ?? 'study';

    return data.map(w => ({
      id: `${sid}:${String(w.id ?? `${w.term}-${w.meaning}`)}`,
      ko: w.term,
      en: w.meaning,
      exampleKo: w.example,
      difficulty: 2,
      imageEmoji: '📌',
      image_url: w.image_url ?? undefined,
      pronKo: w.pron,
      pos: w.pos,
    }));
  }, [data, studyId]);

  useEffect(() => {
    // console.log('modalWords:', modalWords);
  }, [modalWords]);

  // 페이지 인덱스 보정 — 데이터 가용 범위 변경 시 유효하지 않은 페이지 접근 방지를 위해 현재 인덱스 강제 클램프(Clamp)
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    setCurrentPage(prev => Math.min(prev, totalPages - 1));
  }, [data.length, pageSize]);

  const start = currentPage * pageSize;
  const end = start + pageSize;
  const currentData = data.slice(start, end);

  // 글로벌 번역 파이프라인 — 리스트뿐만 아니라 모달 진입 시의 지연을 방지하기 위해 전체 데이터에 대해 일괄 번역 수행
  const { i18n } = useTranslation();
  const targetLang = i18n.language;
  const isKorean = targetLang.toLowerCase().startsWith('ko');

  const combinedTexts = useMemo(() => {
    const meanings = data.map(w => w.meaning || '');
    const prons = data.map(w => {
      const p = w.pron || '';
      return (!isKorean && p) ? `[${p}]` : p;
    });
    const examples = data.map(w => w.example || '');
    const poses = data.map(w => w.pos || '');
    return [...meanings, ...prons, ...examples, ...poses];
  }, [data, isKorean]);

  const combinedKeys = useMemo(() => {
    const meanings = data.map(w => `voca_meaning_${w.id}`);
    const prons = data.map(w => `voca_pron_v4_${w.id}`);
    const examples = data.map(w => `voca_example_${w.id}`);
    const poses = data.map(w => `voca_pos_${w.id}`);
    return [...meanings, ...prons, ...examples, ...poses];
  }, [data]);

  const { translatedTexts } = useBatchAutoTranslation(combinedTexts, combinedKeys, targetLang);

  const getTr = (fieldIdx: number, itemIdx: number) => {
    let tr = translatedTexts[fieldIdx * data.length + itemIdx] || '';
    if (fieldIdx === 1 && tr.startsWith('[') && tr.endsWith(']')) {
      tr = tr.slice(1, -1);
    }
    return tr;
  };

  const isLastPage = currentPage * pageSize + pageSize >= data.length;
  const isFirstPage = currentPage === 0;

  const handleNextPage = () => setCurrentPage(prevPage => prevPage + 1);
  const handlePrevPage = () => setCurrentPage(prevPage => Math.max(prevPage - 1, 0));

  const openModal = (w: WordItem) => {
    const sid = studyId ?? 'study';
    const id = `${sid}:${String(w.id ?? `${w.term}-${w.meaning}`)}`;
    setInitialWordId(id);
    setIsModalOpen(true);
  };

  if (!controlled && loading) return <p className="p-3 text-sm text-gray-500">{t('study.voca.loading', 'Loading vocabulary...')}</p>;
  if (!controlled && error) return <p className="p-3 text-sm text-red-600">{t('study.voca.error', 'Voca error')}: {error}</p>;
  if (!currentData || currentData.length === 0)
    return <p className="p-3 text-sm text-gray-500">{t('study.voca.no_words', 'No words found.')}</p>;

  return (
    <div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className ?? ''}`}>
        {currentData.map((w, i) => {
          const globalIdx = start + i;
          return (
            <div
              key={w.id ?? i}
              role="button"
              tabIndex={0}
              onClick={() => openModal(w)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') openModal(w);
              }}
              className="cursor-pointer"
            >
              <StudyVocaItem
                item={w}
                id={w.id ?? i}
                translatedMeaningProp={translatedTexts[globalIdx] || undefined}
                translatedPronProp={translatedTexts[data.length + globalIdx] || undefined}
                translatedExampleProp={translatedTexts[data.length * 2 + globalIdx] || undefined}
                translatedPosProp={translatedTexts[data.length * 3 + globalIdx] || undefined}
              />
            </div>
          );
        })}
      </div>

      {data.length > pageSize && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handlePrevPage}
            disabled={isFirstPage}
            className="px-4 py-2 rounded disabled:opacity-50 ml-4"
            style={{
              pointerEvents: isFirstPage ? 'none' : 'auto',
              cursor: isFirstPage ? 'default' : 'pointer',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <g>
                <path
                  d="M0.75 12C0.75 14.9837 1.93526 17.8452 4.04505 19.955C6.15483 22.0647 9.01631 23.25 12 23.25C14.9837 23.25 17.8452 22.0647 19.955 19.955C22.0647 17.8452 23.25 14.9837 23.25 12C23.25 9.01631 22.0647 6.15483 19.955 4.04505C17.8452 1.93526 14.9837 0.75 12 0.75C9.01631 0.75 6.15483 1.93526 4.04505 4.04505C1.93526 6.15483 0.75 9.01631 0.75 12Z"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.7501 16.819V7.183C15.7501 6.633 15.2751 6.27 14.8621 6.504L6.36209 11.322C6.25195 11.3976 6.16187 11.4989 6.09964 11.6171C6.0374 11.7353 6.00488 11.8669 6.00488 12.0005C6.00488 12.1341 6.0374 12.2657 6.09964 12.3839C6.16187 12.5021 6.25195 12.6034 6.36209 12.679L14.8621 17.498C15.2751 17.732 15.7501 17.369 15.7501 16.819Z"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </button>

          <button
            onClick={handleNextPage}
            disabled={isLastPage}
            className="px-4 py-2 rounded disabled:opacity-50 ml-4"
            style={{
              pointerEvents: isLastPage ? 'none' : 'auto',
              cursor: isLastPage ? 'default' : 'pointer',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="rotate-180"
            >
              <g>
                <path
                  d="M0.75 12C0.75 14.9837 1.93526 17.8452 4.04505 19.955C6.15483 22.0647 9.01631 23.25 12 23.25C14.9837 23.25 17.8452 22.0647 19.955 19.955C22.0647 17.8452 23.25 14.9837 23.25 12C23.25 9.01631 22.0647 6.15483 19.955 4.04505C17.8452 1.93526 14.9837 0.75 12 0.75C9.01631 0.75 6.15483 1.93526 4.04505 4.04505C1.93526 6.15483 0.75 9.01631 0.75 12Z"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.7501 16.819V7.183C15.7501 6.633 15.2751 6.27 14.8621 6.504L6.36209 11.322C6.25195 11.3976 6.16187 11.4989 6.09964 11.6171C6.0374 11.7353 6.00488 11.8669 6.00488 12.0005C6.00488 12.1341 6.0374 12.2657 6.09964 12.3839C6.16187 12.5021 6.25195 12.6034 6.36209 12.679L14.8621 17.498C15.2751 17.732 15.7501 17.369 15.7501 16.819Z"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </button>
        </div>
      )}

      <EpisodeVocabModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        words={modalWords}
        initialWordId={initialWordId}
        title={t('study.voca.modal_title', 'Word Card')}
        sourceStudyPath={sourceStudyPath}
        sourceStudyTitle={sourceStudyTitle}
      />
    </div>
  );
};

export default StudyVoca;

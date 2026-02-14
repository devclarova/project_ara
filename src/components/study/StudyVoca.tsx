import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import StudyVocaItem from './StudyVocaItem';
import EpisodeVocabModal, { type EpisodeWord } from '@/components/study/EpisodeVocaModal';

type WordRow = {
  id: number;
  study_id: number | null;
  words: string | null;
  means: string | null;
  example: string | null;
  parts_of_speech?: string | null;
  pronunciation?: string | null;
};

export type WordItem = {
  id?: number;
  term: string;
  meaning: string;
  example?: string;
  pos?: string;
  pron?: string;
};

type StudyVocaProps = {
  words?: WordItem[];
  studyId?: number;
  subscribeRealtime?: boolean;
  className?: string;

  sourceStudyPath?: string;
  sourceStudyTitle?: string;
};

// 반응형 pageSize 훅: Tailwind 브레이크포인트와 동일한 기준 사용
const useResponsivePageSize = () => {
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 640)
        setPageSize(1); // < sm (mobile)
      else if (w < 1024)
        setPageSize(4); // < lg (tablet)
      else setPageSize(6); // >= lg (desktop)
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
  const controlled = Array.isArray(words) && words.length > 0;

  const [localWords, setLocalWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!controlled && !!studyId);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = useResponsivePageSize(); // 한번에 보여줄 단어 개수

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialWordId, setInitialWordId] = useState<string | undefined>(undefined);

  // DB Row -> UI 데이터 매핑
  const mapRow = (row: WordRow): WordItem | null => {
    if (!row.words || !row.means) return null;
    return {
      id: row.id,
      term: row.words,
      meaning: row.means,
      example: row.example ?? undefined,
      pos: row.parts_of_speech ?? undefined,
      pron: row.pronunciation ?? undefined,
    };
  };

  // 자체 fetch 모드일 때만 동작
  useEffect(() => {
    if (controlled) return; // 상위에서 words 제공 시 fetch하지 않음
    if (!studyId && studyId !== 0) return; // studyId 없으면 아무것도 안 함

    let alive = true;

    const fetchWords = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('word')
        .select('id, study_id, words, means, example, parts_of_speech, pronunciation')
        .eq('study_id', studyId)
        .order('id', { ascending: true });

      if (!alive) return;

      if (error) {
        console.error('단어 데이터 가져오기 오류:', error);
        setError(error.message);
        setLocalWords([]);
      } else {
        const mapped = (data ?? []).map(mapRow).filter((v): v is WordItem => v !== null);
        setLocalWords(mapped);
      }
      setLoading(false);
    };

    fetchWords();

    // 실시간 반영 옵션
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

  // 실제 렌더에 사용할 데이터(우선순위: props.words > localWords)
  const data = useMemo<WordItem[]>(() => {
    if (controlled) return words!;
    return localWords;
  }, [controlled, words, localWords]);

  // 모달에 넘길 words(EpisodeWord[])로 변환
  // - 앞면 ko: words(=term)
  // - 뒷면 en: means(=meaning)  ← 지금 테이블에 이미 번역/의미가 있으니 그대로 사용
  const modalWords: EpisodeWord[] = useMemo(() => {
    const sid = studyId ?? 'study';
    return data.map(w => ({
      id: `${sid}:${String(w.id ?? `${w.term}-${w.meaning}`)}`,
      ko: w.term,
      en: w.meaning,
      exampleKo: w.example,
      difficulty: 2,
      imageEmoji: '📌',
      pronKo: w.pron,
      pos: w.pos,
    }));
  }, [data, studyId]);

  // pageSize 또는 data가 바뀔 때 현재 페이지를 안전하게 클램프
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    setCurrentPage(prev => Math.min(prev, totalPages - 1));
  }, [data.length, pageSize]);

  // 페이지네이션: 현재 페이지에 해당하는 단어들만 보여주기
  const start = currentPage * pageSize;
  const end = start + pageSize;
  const currentData = data.slice(start, end);

  const isLastPage = currentPage * pageSize + pageSize >= data.length;
  const isFirstPage = currentPage === 0;

  const handleNextPage = () => setCurrentPage(prevPage => prevPage + 1);
  const handlePrevPage = () => setCurrentPage(prevPage => Math.max(prevPage - 1, 0));

  // 단어 클릭 → 모달 오픈 (해당 단어부터 시작)
  const openModal = (w: WordItem) => {
    const sid = studyId ?? 'study';
    const id = `${sid}:${String(w.id ?? `${w.term}-${w.meaning}`)}`;
    setInitialWordId(id);
    setIsModalOpen(true);
  };

  // 로딩/에러 처리 (자체 fetch 모드일 때만)
  if (!controlled && loading) return <p className="p-3 text-sm text-gray-500">보카 불러오는 중…</p>;
  if (!controlled && error) return <p className="p-3 text-sm text-red-600">보카 오류: {error}</p>;
  if (!currentData || currentData.length === 0)
    return <p className="p-3 text-sm text-gray-500">단어가 없습니다.</p>;

  return (
    <div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className ?? ''}`}>
        {currentData.map((w, i) => (
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
            <StudyVocaItem item={w} id={w.id ?? i} />
          </div>
        ))}
      </div>

      {/* 페이지네이션 버튼 */}
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

      {/* 모달 렌더 */}
      <EpisodeVocabModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        words={modalWords}
        initialWordId={initialWordId}
        title="단어 카드"
        sourceStudyPath={sourceStudyPath}
        sourceStudyTitle={sourceStudyTitle}
      />
    </div>
  );
};

export default StudyVoca;

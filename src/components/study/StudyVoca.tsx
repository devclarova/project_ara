import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
};

const StudyVoca = ({ words, studyId, subscribeRealtime = false, className }: StudyVocaProps) => {
  const controlled = Array.isArray(words) && words.length > 0;

  const [localWords, setLocalWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!controlled && !!studyId);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 6; // 한번에 보여줄 단어 개수

  // DB Row -> UI 데이터 매핑
  const mapRow = (row: WordRow): WordItem | null => {
    if (!row.words || !row.means) return null;
    return {
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

  // 페이지네이션: 현재 페이지에 해당하는 단어들만 보여주기
  const currentData = data.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleNextPage = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prevPage => Math.max(prevPage - 1, 0));
  };

  // 로딩/에러 처리 (자체 fetch 모드일 때만)
  if (!controlled && loading) {
    return <p className="p-3 text-sm text-gray-500">보카 불러오는 중…</p>;
  }
  if (!controlled && error) {
    return <p className="p-3 text-sm text-red-600">보카 오류: {error}</p>;
  }

  if (!currentData || currentData.length === 0) {
    return <p className="p-3 text-sm text-gray-500">단어가 없습니다.</p>;
  }

  // 마지막 페이지 여부 확인
  const isLastPage = currentPage * pageSize + pageSize >= data.length;
  const isFirstPage = currentPage === 0;

  return (
    <div>
      <div className={`grid grid-cols-2 gap-4 ${className ?? ''}`}>
        {currentData.map((w, i) => (
          <div
            key={i}
            className="p-3 border rounded-lg bg-white dark:bg-secondary shadow-sm hover:bg-gray-50 dark:hover:bg-primary/5 transition-colors"
          >
            <h4 className="font-semibold dark:text-gray-300">{w.term}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{w.meaning}</p>

            {(w.pos || w.pron) && (
              <p className="text-[11px] text-gray-400 mt-1">
                {w.pos ? `(${w.pos})` : ''} {w.pron ? `· ${w.pron}` : ''}
              </p>
            )}

            {w.example && <p className="text-xs text-gray-400 mt-1">예: {w.example}</p>}
          </div>
        ))}
      </div>

      {/* 페이지네이션 버튼 */}
      {data.length > pageSize && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="px-4 py-2 rounded disabled:opacity-50 ml-4 cursor-pointer"
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
            disabled={currentPage * pageSize + pageSize >= data.length}
            className="px-4 py-2 rounded disabled:opacity-50 ml-4 cursor-pointer"
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
    </div>
  );
};

export default StudyVoca;

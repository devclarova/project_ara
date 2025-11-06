import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useParams } from 'react-router-dom';
import type { Subtitle } from '../../types/study';

interface SubtitleListProps {
  onSelectDialogue: (subtitle: Subtitle) => void;
  studyId?: number; // 선택: 외부에서 명시적으로 넘길 때
  subscribeRealtime?: boolean; // 선택: 실시간 반영 여부
}

const secToMMSS = (sec: number | null | undefined) => {
  if (sec == null || Number.isNaN(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const StudySubtitles: React.FC<SubtitleListProps> = ({
  onSelectDialogue,
  studyId,
  subscribeRealtime = false,
}) => {
  const { id } = useParams<{ id: string }>();
  const resolvedStudyId = studyId ?? Number(id);

  const [dialogues, setDialogues] = useState<Subtitle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 3; // 한번에 보여줄 자막 수

  useEffect(() => {
    if (!Number.isFinite(resolvedStudyId)) {
      setError('유효하지 않은 studyId 입니다.');
      setLoading(false);
      return;
    }

    let alive = true;

    const fetchDialogues = async () => {
      setLoading(true);
      setError(null);

      // 기존 id=eq(id) → study_id 기준 조회로 수정
      const { data, error } = await supabase
        .from('subtitle')
        .select(
          'id, study_id, korean_subtitle, pronunciation, english_subtitle, subtitle_start_time, subtitle_end_time, level',
        )
        .eq('study_id', resolvedStudyId)
        .order('subtitle_start_time', { ascending: true });

      if (!alive) return;

      if (error) {
        console.error('자막 데이터 가져오기 오류:', error);
        setError(error.message);
        setDialogues([]);
      } else {
        const list = (data ?? []).filter((r): r is Subtitle => r.study_id !== null);

        setDialogues(list);

        if (list.length > 0) {
          onSelectDialogue(list[0]); // 여기서도 안전하게 Subtitle로 추론됨
        }
      }
      setLoading(false);
    };

    fetchDialogues();

    // 선택: 실시간 반영
    const channel =
      subscribeRealtime && resolvedStudyId != null
        ? supabase
            .channel(`subtitle:study:${resolvedStudyId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'subtitle',
                filter: `study_id=eq.${resolvedStudyId}`,
              },
              fetchDialogues,
            )
            .subscribe()
        : null;

    return () => {
      alive = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [resolvedStudyId, subscribeRealtime]);

  // 자막 n개씩 보여주기
  const handleNextPage = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };
  const handlePrevPage = () => {
    setCurrentPage(prevPage => Math.max(prevPage - 1, 0));
  };
  const currentDialogues = dialogues.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const showPaginationButtons = dialogues.length > pageSize; // 자막 3개 초과일 때 버튼 보이기

  // 마지막 페이지 여부
  const isLastPage = currentPage * pageSize + pageSize >= dialogues.length;
  const isFirstPage = currentPage === 0;

  return (
    <div>
      <h2 className="text-xl font-bold ml-2 mb-2 dark:text-gray-100">자막</h2>

      {loading && <p>자막 로딩 중...</p>}
      {error && <p className="text-red-600">오류: {error}</p>}

      {!loading && !error && currentDialogues.length > 0 ? (
        <>
          <ul className="space-y-2">
            {currentDialogues.map(d => (
              <li
                key={d.id} // 안정적인 key
                onClick={() => onSelectDialogue(d)}
                className="p-3 bg-white dark:bg-secondary rounded-lg shadow cursor-pointer hover:bg-gray-50 hover:border-l-4 hover:border-primary dark:hover:border-gray-600"
              >
                {d.korean_subtitle && (
                  <p className="text-lg text-gray-600 dark:text-gray-100 hover:text-green-600 dark:hover:text-gray-400">
                    {d.korean_subtitle}
                  </p>
                )}
                {d.pronunciation && (
                  <p className="text-lg text-gray-500 dark:text-gray-100 hover:text-green-600 dark:hover:text-gray-400">
                    [{d.pronunciation}]
                  </p>
                )}
                {d.english_subtitle && (
                  <p className="text-lg text-gray-700 dark:text-gray-100 hover:text-green-600 dark:hover:text-gray-400">
                    {d.english_subtitle}
                  </p>
                )}
                {/* <p className="text-xs text-gray-400 mt-1">
                  {secToMMSS(d.subtitle_start_time)} → {secToMMSS(d.subtitle_end_time)}
                  {d.level ? ` · ${d.level}` : ''}
                </p> */}
              </li>
            ))}
          </ul>
          {/* 버튼 */}
          {showPaginationButtons && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="px-4 py-2 disabled:opacity-50 ml-4 cursor-pointer"
                style={{ pointerEvents: currentPage === 0 ? 'none' : 'auto' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <g clipPath="url(#clip0_108_493)">
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
                  <defs>
                    <clipPath id="clip0_108_493">
                      <rect width="24" height="24" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage * pageSize + pageSize >= dialogues.length}
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
                  <g clipPath="url(#clip0_108_493)">
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
                  <defs>
                    <clipPath id="clip0_108_493">
                      <rect width="24" height="24" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </button>
            </div>
          )}
        </>
      ) : (
        !loading && !error && <p>자막 데이터가 없습니다.</p>
      )}
    </div>
  );
};

export default StudySubtitles;

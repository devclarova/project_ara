import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useParams } from 'react-router-dom';
import type { Subtitle } from '../../types/study';
import SubtitleItem from './SubtitleItem';

interface SubtitleListProps {
  onSelectDialogue: (subtitle: Subtitle) => void;
  onSeek?: (start: number) => void;
  studyId?: number; // 선택: 외부에서 명시적으로 넘길 때
  subscribeRealtime?: boolean; // 선택: 실시간 반영 여부
}

// 반응형 pageSize 훅: Tailwind 브레이크포인트와 동일한 기준 사용
const useResponsivePageSize = () => {
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 640)
        setPageSize(1); // < sm (mobile)
      else if (w < 1024)
        setPageSize(2); // < lg (tablet)
      else setPageSize(3); // >= lg (desktop)
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  return pageSize;
};

const StudySubtitles: React.FC<SubtitleListProps> = ({
  onSelectDialogue,
  studyId,
  subscribeRealtime = false,
  onSeek,
}) => {
  const { id } = useParams<{ id: string }>();
  const resolvedStudyId = studyId ?? Number(id);

  const [dialogues, setDialogues] = useState<Subtitle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = useResponsivePageSize(); // 한번에 보여줄 자막 수

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
          'id, study_id, korean_subtitle, pronunciation, english_subtitle, subtitle_start_time',
        )
        .eq('study_id', resolvedStudyId)
        .order('subtitle_start_time', { ascending: true });

      if (!alive) return;

      if (error) {
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
      <h2 className="text-lg sm:text-xl font-bold ml-2 mb-2 dark:text-gray-100">자막</h2>

      {loading && <p className="text-sm sm:text-base">자막 로딩 중...</p>}
      {error && <p className="text-sm sm:text-base text-red-600">오류: {error}</p>}

      {!loading && !error && currentDialogues.length > 0 ? (
        <>
          <ul className="space-y-1.5 sm:space-y-2">
            {currentDialogues.map(d => (
              <SubtitleItem
                key={d.id}
                subtitle={d}
                onSelect={onSelectDialogue}
                onSeek={onSeek}
              />
            ))}
          </ul>

          {/* 페이지네이션 버튼 (디자인 유지, 여백/폰트만 반응형) */}
          {showPaginationButtons && (
            <div className="flex justify-center mt-3 sm:mt-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="px-3 sm:px-4 py-1.5 sm:py-2 disabled:opacity-50 ml-3 sm:ml-4 cursor-pointer"
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
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded disabled:opacity-50 ml-3 sm:ml-4 cursor-pointer"
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
        !loading && !error && <p className="text-sm sm:text-base">자막 데이터가 없습니다.</p>
      )}
    </div>
  );
};

export default StudySubtitles;

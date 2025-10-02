import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { CultureNote } from '../../types/study';

// DB 테이블 타입
type CultureNoteRow = {
  id: number;
  study_id: number | null;
  title: string | null;
  subtitle: string | null;
};

type CultureNoteContent = {
  culture_note_id: number;
  content_value: string;
};

type StudyCultureNoteProps =
  | { note: string; studyId?: never } // 문자열만 받는 경우
  | { note?: never; studyId: number }; // studyId로 DB에서 불러오는 경우

const StudyCultureNote = (props: StudyCultureNoteProps) => {
  const [data, setData] = useState<CultureNoteRow[]>([]); // 여러 개의 culture_note 항목들
  const [contents, setContents] = useState<CultureNoteContent[]>([]); // 콘텐츠 항목들
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0); // 현재 보고 있는 문화 노트의 인덱스

  const studyId = props.studyId; // 타입 내 보장됨

  // DB fetch 모드
  useEffect(() => {
    if (studyId == null || !Number.isFinite(studyId)) return;

    let alive = true;

    const fetchNoteAndContents = async () => {
      setLoading(true);
      setError(null);

      // 1) study_id를 기준으로 여러 개의 culture_note 조회
      const { data: notesData, error: notesError } = await supabase
        .from('culture_note')
        .select('id, study_id, title, subtitle')
        .eq('study_id', studyId); // study_id 기준으로 여러 개의 culture_note 조회

      if (!alive) return;

      if (notesError) {
        setError(notesError.message);
        setData([]);
        setContents([]);
        setLoading(false);
        return;
      }

      setData((notesData ?? []) as CultureNote[]);

      if (!notesData || notesData.length === 0) {
        setContents([]);
        setLoading(false);
        return;
      }

      // 2) 여러 개의 culture_note_id에 해당하는 culture_note_contents 조회
      const noteIds = notesData.map(note => note.id); // 여러 개의 culture_note_id 추출
      const { data: contentsData, error: contentsError } = await supabase
        .from('culture_note_contents')
        .select('content_value, culture_note_id')
        .in('culture_note_id', noteIds); // 여러 개의 culture_note_id로 콘텐츠 조회

      if (!alive) return;

      if (contentsError) {
        setError(contentsError.message);
        setContents([]);
      } else {
        setContents((contentsData ?? []) as CultureNoteContent[]); // 여러 콘텐츠 항목을 상태에 저장
      }

      setLoading(false);
    };

    fetchNoteAndContents();

    return () => {
      alive = false;
    };
  }, [studyId]);

  // 현재 보고 있는 문화 노트로 이동
  const handleNextNote = () => {
    setCurrentNoteIndex(prevIndex => {
      if (prevIndex < data.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex; // 마지막 문화 노트에서 증가하지 않음
    });
  };

  const handlePrevNote = () => {
    setCurrentNoteIndex(prevIndex => Math.max(prevIndex - 1, 0)); // 첫 번째 문화 노트에서 감소하지 않음
  };

  // 로딩/에러 처리 (자체 fetch 모드일 때만)
  if (!loading && error) {
    return <p className="p-3 text-sm text-red-600">문화 노트 오류: {error}</p>;
  }

  if (loading) return <p className="p-3 text-sm text-gray-500">문화 노트 불러오는 중…</p>;

  if (data.length === 0) {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h4 className="font-semibold mb-2">문화 노트</h4>
        <p className="text-sm text-gray-500">문화 노트가 없습니다.</p>
      </div>
    );
  }

  // 현재 보고 있는 문화 노트 및 그에 해당하는 콘텐츠
  const currentNote = data[currentNoteIndex]; // 현재 보고 있는 문화 노트
  const currentContents = contents.filter(content => content.culture_note_id === currentNote.id); // 해당 문화 노트에 맞는 콘텐츠들

  const isLastPage = currentNoteIndex === data.length - 1; // 마지막 페이지인지 여부
  const isFirstPage = currentNoteIndex === 0; // 첫 번째 페이지인지 여부

  return (
    <div>
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h4 className="font-semibold mb-1">{currentNote.title || '문화 노트'}</h4>
        {currentNote.subtitle && (
          <p className="text-sm text-gray-700 whitespace-pre-line p-1">{currentNote.subtitle}</p>
        )}

        <ul className="mt-4 space-y-2">
          {currentContents.length > 0 ? (
            currentContents.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-pink-500 mr-2">•</span>
                <span>{item.content_value}</span> {/* 콘텐츠 항목을 나열 */}
              </li>
            ))
          ) : (
            <li className="flex items-start">
              <span className="text-pink-500 mr-2">•</span>
              <span>리스트 항목이 없습니다.</span>
            </li>
          )}
        </ul>
      </div>

      {/* 버튼들 */}
      {data.length > 1 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handlePrevNote}
            disabled={currentNoteIndex === 0}
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
            onClick={handleNextNote}
            disabled={currentNoteIndex === data.length - 1}
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

export default StudyCultureNote;

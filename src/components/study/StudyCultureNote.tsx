import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { CultureNote } from '../../types/study';
import TranslatedCultureNoteView from './TranslatedCultureNoteView';
import { useBatchAutoTranslation } from '@/hooks/useBatchAutoTranslation';

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
  const { t } = useTranslation();
  const [data, setData] = useState<CultureNoteRow[]>([]); // 여러 개의 culture_note 항목들
  const [contents, setContents] = useState<CultureNoteContent[]>([]); // 콘텐츠 항목들
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0); // 현재 보고 있는 문화 노트의 인덱스

  const studyId = props.studyId; // 타입 내 보장됨

  // 비동기 데이터 패치 파이프라인 — studyId를 식별자로 사용하여 문화 노트 원문 및 상세 콘텐츠를 순차적으로 조회
  useEffect(() => {
    if (studyId == null || !Number.isFinite(studyId)) return;

    // 경합 상태 방지 플래그 — 언마운트 또는 이펙트 재실행 시 이전 비동기 요청의 상태 업데이트 차단
    let alive = true;

    const fetchNoteAndContents = async () => {
      setLoading(true);
      setError(null);

      // 1) study_id를 기준으로 여러 개의 culture_note 조회
      const { data: notesData, error: notesError } = await (supabase.from('culture_note') as any)
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

      // 데이터 무결성 체크 — 노의 조회 결과가 유효하지 않을 경우 콘텐츠 조회 단계를 생략하고 상태 초기화
      if (!notesData || notesData.length === 0) {
        setContents([]);
        setLoading(false);
        return;
      }

      // 2) 여러 개의 culture_note_id에 해당하는 culture_note_contents 조회
      const noteIds = notesData.map((note: any) => note.id); // 여러 개의 culture_note_id 추출
      const { data: contentsData, error: contentsError } = await (supabase.from('culture_note_contents') as any)
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

  // 글로벌 번역 파이프라인 — 문화 노트의 제목, 부제목 및 모든 리스트 항목을 단일 배치로 처리하여 로딩 지연 최소화
  const { i18n } = useTranslation();
  const targetLang = i18n.language;
  const isKorean = targetLang.toLowerCase().startsWith('ko');

  const combinedItems = useMemo(() => {
    const list: { text: string; key: string }[] = [];
    
    data.forEach((note) => {
      // 1. 제목
      if (note.title) list.push({ text: note.title, key: `cult_title_${note.id}` });
      // 2. 부제목
      if (note.subtitle) list.push({ text: note.subtitle, key: `cult_subtitle_${note.id}` });
      // 3. 연관 콘텐츠 리스트
      const noteContents = contents.filter(c => c.culture_note_id === note.id);
      noteContents.forEach((c, idx) => {
        list.push({ text: c.content_value, key: `cult_content_${note.id}_${idx}` });
      });
    });
    
    return list;
  }, [data, contents]);

  const combinedTexts = useMemo(() => combinedItems.map(i => i.text), [combinedItems]);
  const combinedKeys = useMemo(() => combinedItems.map(i => i.key), [combinedItems]);

  const { translatedTexts } = useBatchAutoTranslation(combinedTexts, combinedKeys, targetLang);

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
    return <p className="p-3 text-sm text-red-600">{t('study.culture_note.error', { error })}</p>;
  }

  if (loading) return <p className="p-3 text-sm text-gray-500">{t('study.culture_note.loading')}</p>;

  if (data.length === 0) {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h4 className="font-semibold mb-2">{t('study.culture_note.title')}</h4>
        <p className="text-sm text-gray-500">{t('study.culture_note.empty')}</p>
      </div>
    );
  }

  // 뷰 상태 동기화 — 현재 인덱스 및 관계형 식별자(culture_note_id)를 기반으로 렌더링 대상 데이터 필터링
  const currentNote = data[currentNoteIndex]; // 현재 보고 있는 문화 노트
  const noteContents = contents.filter(content => content.culture_note_id === currentNote.id);

  // 번역 데이터 추출 파이프라인 — 배치 번역 결과물에서 현재 인덱스에 해당하는 제목, 부제목, 리스트 항목을 매핑
  const getNoteTranslation = (noteId: number) => {
    let offset = 0;
    let noteTitle = '';
    let noteSubtitle = '';
    const noteList: string[] = [];

    for (const note of data) {
      if (note.id === noteId) {
        if (note.title) noteTitle = translatedTexts[offset++] || '';
        if (note.subtitle) noteSubtitle = translatedTexts[offset++] || '';
        const nc = contents.filter(c => c.culture_note_id === note.id);
        nc.forEach(() => {
          noteList.push(translatedTexts[offset++] || '');
        });
        break;
      }
      if (note.title) offset++;
      if (note.subtitle) offset++;
      const nc = contents.filter(c => c.culture_note_id === note.id);
      offset += nc.length;
    }
    return { noteTitle, noteSubtitle, noteList };
  };

  const { noteTitle, noteSubtitle, noteList } = getNoteTranslation(currentNote.id);

  const isLastPage = currentNoteIndex === data.length - 1; // 마지막 페이지인지 여부
  const isFirstPage = currentNoteIndex === 0; // 첫 번째 페이지인지 여부

  return (
    <div>
      <TranslatedCultureNoteView 
        note={currentNote} 
        contents={noteContents}
        translatedTitle={noteTitle}
        translatedSubtitle={noteSubtitle}
        translatedContents={noteList}
        isKorean={isKorean}
      />

      {/* 버튼들 */}
      {data.length > 1 && (
        <div className="flex justify-center mt-3 sm:mt-4">
          {/* 이전 버튼 */}
          <button
            onClick={handlePrevNote}
            disabled={currentNoteIndex === 0}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded disabled:opacity-50 ml-3 sm:ml-4 cursor-pointer"
            style={{
              pointerEvents: isFirstPage ? 'none' : 'auto',
              cursor: isFirstPage ? 'default' : 'pointer',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
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

          {/* 다음 버튼 */}
          <button
            onClick={handleNextNote}
            disabled={currentNoteIndex === data.length - 1}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded disabled:opacity-50 ml-3 sm:ml-4 cursor-pointer"
            style={{
              pointerEvents: isLastPage ? 'none' : 'auto',
              cursor: isLastPage ? 'default' : 'pointer',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
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

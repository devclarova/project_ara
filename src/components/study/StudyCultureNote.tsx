import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// DB 테이블 타입
type CultureNoteRow = {
  id: number;
  study_id: number;
  title: string | null;
  subtitle: string | null;
  contents: string | null;
};

type Props =
  | { note: string; studyId?: never } // 문자열만 받는 경우
  | { note?: never; studyId: number }; // studyId로 DB에서 불러오는 경우

const StudyCultureNote = (props: Props) => {
  const [data, setData] = useState<CultureNoteRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 문자열 모드: 즉시 렌더
  if ('note' in props) {
    if (!props.note) {
      return (
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h4 className="font-semibold mb-2">문화 노트</h4>
          <p className="text-sm text-gray-500">문화 노트가 없습니다.</p>
        </div>
      );
    }
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h4 className="font-semibold mb-2">문화 노트</h4>
        <p className="text-sm text-gray-700 whitespace-pre-line">{props.note}</p>
      </div>
    );
  }

  const studyId = props.studyId; // 타입 내 보장됨

  // DB fetch 모드
  useEffect(() => {
    if (studyId == null || !Number.isFinite(studyId)) return;

    let alive = true;

    const fetchNote = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('culture_note')
        .select('id, study_id, title, subtitle, contents')
        .eq('study_id', studyId)
        .limit(1)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        console.error('문화 노트 불러오기 오류:', error);
        setError(error.message);
        setData(null);
      } else {
        setData(data ?? null);
      }
      setLoading(false);
    };

    fetchNote();

    return () => {
      alive = false;
    };
  }, [studyId]);

  if (loading) return <p className="p-3 text-sm text-gray-500">문화 노트 불러오는 중…</p>;
  if (error) return <p className="p-3 text-sm text-red-600">문화 노트 오류: {error}</p>;

  if (!data) {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h4 className="font-semibold mb-2">문화 노트</h4>
        <p className="text-sm text-gray-500">문화 노트가 없습니다.</p>
      </div>
    );
  }

  // contents가 문자열이면 배열로 변환
  const contentsList = data.contents ? data.contents.split('\n') : [];

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h4 className="font-semibold mb-1">{data.title || '문화 노트'}</h4>
      {/* {data.subtitle && <p className="text-xs text-gray-500 mb-1">{data.subtitle}</p>} */}
      {data.subtitle ? (
        <p className="text-sm text-gray-700 whitespace-pre-line p-1">{data.subtitle}</p>
      ) : (
        <p className="text-sm text-gray-500">내용이 없습니다.</p>
      )}

      <ul className="mt-4 space-y-2">
        {contentsList.length > 0 ? (
          contentsList.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="text-pink-500 mr-2">•</span>
              <span>{point}</span>
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
  );
};

export default StudyCultureNote;

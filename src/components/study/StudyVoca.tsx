import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type WordRow = {
  id: number;
  study_id: number;
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

type Props = {
  words?: WordItem[];
  studyId?: number;
  subscribeRealtime?: boolean;
  className?: string;
};

const StudyVoca = ({ words, studyId, subscribeRealtime = false, className }: Props) => {
  const controlled = Array.isArray(words) && words.length > 0;

  const [localWords, setLocalWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!controlled && !!studyId);
  const [error, setError] = useState<string | null>(null);

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

  // 로딩/에러 처리 (자체 fetch 모드일 때만)
  if (!controlled && loading) {
    return <p className="p-3 text-sm text-gray-500">보카 불러오는 중…</p>;
  }
  if (!controlled && error) {
    return <p className="p-3 text-sm text-red-600">보카 오류: {error}</p>;
  }

  if (!data || data.length === 0) {
    return <p className="p-3 text-sm text-gray-500">자막이 없습니다.</p>;
  }

  return (
    <div className={`grid grid-cols-2 gap-4 ${className ?? ''}`}>
      {data.map((w, i) => (
        <div
          key={i}
          className="p-3 border rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors"
        >
          <h4 className="font-semibold">{w.term}</h4>
          <p className="text-sm text-gray-600">{w.meaning}</p>

          {(w.pos || w.pron) && (
            <p className="text-[11px] text-gray-400 mt-1">
              {w.pos ? `(${w.pos})` : ''} {w.pron ? `· ${w.pron}` : ''}
            </p>
          )}

          {w.example && <p className="text-xs text-gray-400 mt-1">예: {w.example}</p>}
        </div>
      ))}
    </div>
  );
};

export default StudyVoca;

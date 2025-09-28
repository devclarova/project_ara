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
        setDialogues(data ?? []);
        if ((data?.length ?? 0) > 0) onSelectDialogue(data![0]); // 최초 선택
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

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">자막</h2>

      {loading && <p>자막 로딩 중...</p>}
      {error && <p className="text-red-600">오류: {error}</p>}

      {!loading && !error && dialogues.length > 0 ? (
        <ul className="space-y-2">
          {dialogues.map(d => (
            <li
              key={d.id} // 안정적인 key
              onClick={() => onSelectDialogue(d)}
              className="p-3 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50"
            >
              {d.korean_subtitle && (
                <p className="text-lg text-gray-700 hover:text-gray-900">{d.korean_subtitle}</p>
              )}
              {d.pronunciation && <p className="text-sm text-gray-500">{d.pronunciation}</p>}
              {d.english_subtitle && (
                <p className="text-base text-gray-700">{d.english_subtitle}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {secToMMSS(d.subtitle_start_time)} → {secToMMSS(d.subtitle_end_time)}
                {d.level ? ` · ${d.level}` : ''}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        !loading && !error && <p>자막 데이터가 없습니다.</p>
      )}
    </div>
  );
};

export default StudySubtitles;

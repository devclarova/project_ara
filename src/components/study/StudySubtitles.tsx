import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Dialogues } from '../../types/study';
import { useParams } from 'react-router-dom';

interface SubtitleListProps {
  onSelectDialogue: (dialogue: Dialogues) => void;
}

const StudySubtitles: React.FC<SubtitleListProps> = ({ onSelectDialogue }) => {
  const { id } = useParams<{ id: string }>();
  const [dialogues, setDialogues] = useState<Dialogues[]>([]);

  // 자막 데이터
  useEffect(() => {
    const fetchDialogues = async () => {
      const { data, error } = await supabase
        .from('temptts') // temptts 테이블에서 자막 데이터 가져오기
        .select('*')
        .eq('id', id); // 해당 에피소드의 대사만 필터링

      if (error) {
        console.log('자막 데이터 가져오기 오류:', error);
      } else {
        console.log('자막 데이터:', data); // 데이터를 콘솔에 출력
        if (data.length > 0) {
          setDialogues(data); // 데이터를 상태로 저장
          onSelectDialogue(data[0]); // 첫 번째 자막을 선택된 상태로 설정
        } else {
          console.log('자막 데이터가 없습니다.');
        }
      }
    };

    fetchDialogues(); // 자막 데이터 로드
  }, [id]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">자막</h2>
      {dialogues.length > 0 ? (
        <ul className="space-y-2">
          {dialogues.map((d, idx) => (
            <li
              key={idx}
              onClick={() => onSelectDialogue(d)} // 자막 클릭 시 상태 변경
              className="p-3 bg-white rounded-lg shadow "
            >
              <p className="text-lg font-medium cursor-pointer hover:bg-gray-100">{d.dialogue}</p>
              <p className="text-lg font-medium text-gray-400 cursor-pointer hover:bg-gray-100">
                {d.pronunciation}
              </p>
              <p className="text-lg cursor-pointer hover:bg-gray-100">{d.english}</p>

              {/* <p className="text-sm text-gray-500">
                {d.start} → {d.end}
              </p> */}
            </li>
          ))}
        </ul>
      ) : (
        <p>자막 로딩 중...</p> // 자막이 없거나 로딩 중일 때 표시할 메시지
      )}
    </div>
  );
};

export default StudySubtitles;

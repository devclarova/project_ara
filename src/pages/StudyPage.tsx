import { Progress } from 'antd';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import StudyCard from '../components/study/StudyCard';
import VideoPlayer from '../components/study/VideoPlayer';
import type { Dialogue } from '../types/study';
import { supabase } from '../lib/supabase';

// 더미데이터
const initialDialogues: Dialogue[] = [
  {
    character: '도깨비',
    timestamp: '00:01:50 → 00:01:53',
    dialogue: '매우 상스러운 갓을 썼군',
    category: '추측/가정; 감탄문',
    words: [
      { term: '지금쯤', meaning: 'by now / at this time', example: '지금쯤 집에 도착했겠지.' },
      { term: '끝났겠지', meaning: 'must have ended (추측)', example: '수업은 끝났겠지.' },
      { term: '얼마나', meaning: 'how much / how', example: '얼마나 예뻤을까.' },
    ],
    cultureNote:
      '‘~겠지’는 추측을 나타내는 표현으로, 누군가의 상태나 상황을 조심스럽게 예상할 때 사용합니다. ‘얼마나 ~었을까’는 감탄과 궁금증을 동시에 표현합니다.',
  },
];

interface StudyProgress {
  view_count: number;
  episode: string;
  updated_at: string;
  created_at: string;
}

const StudyPage = () => {
  const [selected, setSelected] = useState<Dialogue | null>(null);
  const [viewCount, setViewCount] = useState(0);

  // 페이지 클릭시 조회수 증가
  useEffect(() => {
    const incrementViewCount = async () => {
      const { data, error } = await supabase
        .from('study_progress')
        .select('view_count')
        .eq('episode', 'Episode 1')
        .single();

      if (error) {
        // console.log('조회수 카운트 에러:', error);
      } else if (data && data.view_count !== undefined) {
        // 데이터가 존재하고 view_count가 있다면 조회수 증가
        const updatedViewCount = data.view_count + 1;

        // 조회수 업데이트
        const { data: updatedData, error: updateError } = await supabase
          .from('study_progress')
          .update({ view_count: updatedViewCount, updated_at: new Date() })
          .eq('episode', 'Episode 1');

        if (updateError) {
          // console.log('조회수 업데이트 카운트 에러:', updateError);
        } else {
          // 조회수 업데이트가 성공적으로 이루어졌으면 화면에 반영
          setViewCount(updatedData?.view_count || 0);
          console.log('조회수 업데이트 성공:', updatedData?.view_count);
        }
      } else {
        console.log('조회수 데이터가 존재하지 않거나 view_count 없음');
      }
    };

    incrementViewCount();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="p-6 max-w-6xl mx-auto">
        {/* 카테고리 */}
        <div className="flex items-center mb-4">
          {/* 드라마 리스트 */}
          <NavLink
            to={'/studyList'}
            className={({ isActive }) =>
              isActive
                ? 'text-primary font-medium text-xl mr-6'
                : 'text-gray-600 hover:text-gray-900 text-xl mr-6'
            }
          >
            카테고리
          </NavLink>
          {/* 드라마 회차 */}
          <NavLink
            to={'/dramaList'}
            className={({ isActive }) =>
              isActive
                ? 'text-primary font-medium text-xl mr-6'
                : 'text-gray-600 hover:text-gray-900 text-xl mr-6'
            }
          >
            도깨비
          </NavLink>
          {/* 현재 학습중인 에피소드 */}
          <NavLink
            to={'/study'}
            className={({ isActive }) =>
              isActive
                ? 'text-primary font-medium text-xl mr-6'
                : 'text-gray-600 hover:text-gray-900 text-xl mr-6'
            }
          >
            Episode 1
          </NavLink>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">도깨비 Episode 1 - Scene 1</h1>
        <Progress percent={30} strokeWidth={8} strokeColor="#ff5733" />
        <div className="flex space-x-4 text-sm text-gray-600">
          <span>시간: 1:50</span>
          <span>레벨: 초급</span>
          <span>조회수: {viewCount}</span>
        </div>
      </div>
      {/* 영상 플레이어 */}
      <VideoPlayer />

      {/* 자막 리스트 */}
      <div>
        <h2 className="text-xl font-bold mb-2">자막</h2>
        <ul className="space-y-2">
          {initialDialogues.map((d, idx) => (
            <li
              key={idx}
              onClick={() => setSelected(selected?.dialogue === d.dialogue ? null : d)}
              className="p-3 bg-white rounded-lg shadow cursor-pointer hover:bg-primary/5"
            >
              <p className="font-medium">{d.dialogue}</p>
              <p className="text-sm text-gray-500">
                {d.character} · {d.timestamp}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* 학습 카드 */}
      {selected && <StudyCard dialogue={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default StudyPage;

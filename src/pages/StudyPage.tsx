import { Progress } from 'antd';
import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import StudyCard from '../components/study/StudyCard';
import VideoPlayer from '../components/study/VideoPlayer';
import { supabase } from '../lib/supabase';
import StudySubtitles from '../components/study/StudySubtitles';
import { getTts } from '../services/ClipService';
import type { Dialogues } from '../types/study';
import type { Tts } from '../types/database';

// 더미데이터
// const initialDialogues: Dialogue[] = [
//   {
//     character: '도깨비',
//     timestamp: '00:01:50 → 00:01:53',
//     dialogue: '매우 상스러운 갓을 썼군',
//     category: '추측/가정; 감탄문',
//     words: [
//       { term: '지금쯤', meaning: 'by now / at this time', example: '지금쯤 집에 도착했겠지.' },
//       { term: '끝났겠지', meaning: 'must have ended (추측)', example: '수업은 끝났겠지.' },
//       { term: '얼마나', meaning: 'how much / how', example: '얼마나 예뻤을까.' },
//     ],
//     cultureNote:
//       '‘~겠지’는 추측을 나타내는 표현으로, 누군가의 상태나 상황을 조심스럽게 예상할 때 사용합니다. ‘얼마나 ~었을까’는 감탄과 궁금증을 동시에 표현합니다.',
//   },
// ];

type VideoMap = {
  [key: string]: string;
};

const StudyPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selected, setSelected] = useState<Dialogues | null>();
  const [viewCount, setViewCount] = useState(0);
  const [clip, setClip] = useState<Tts | null>(null);
  const [videoMapTest, setVideoMapTest] = useState<VideoMap>({});

  // 자막 선택시 상태 업로드
  const handleSelectDialogue = (dialogue: Dialogues) => {
    setSelected(dialogue); // 상태 업데이트
  };

  // 페이지 클릭시 조회수 증가
  useEffect(() => {
    const incrementViewCount = async () => {
      const { data, error } = await supabase
        .from('study_progress')
        .select('view_count')
        .eq('episode', 'Episode 1')
        .single(); // 단일 데이터 반환

      if (error) {
        // console.log('조회수 카운트 에러:', error);
      } else if (data && data.view_count !== undefined) {
        // 데이터가 존재하고 view_count가 있다면 조회수 증가
        const updatedViewCount = data.view_count + 1;

        // 조회수 업데이트
        const { data: updatedData, error: updateError } = await supabase
          .from('study_progress')
          .update({ view_count: updatedViewCount, updated_at: new Date().toISOString() })
          .eq('episode', 'Episode 1'); // episode에 해당하는 데이터 업데이트

        if (updateError) {
          // console.log('조회수 업데이트 카운트 에러:', updateError);
        } else {
          // 조회수 업데이트가 성공적으로 이루어졌으면 화면에 반영
          setViewCount(updatedViewCount);
          // console.log('조회수 업데이트 성공:', updatedViewCount);
        }
      }
    };

    incrementViewCount();
  }, []);

  // id 불러오기
  useEffect(() => {
    try {
      (async () => {
        const data = await getTts();
        const target = data.find(cur => cur.id.toString() === id); // 현재 페이지 id 매칭
        if (target) {
          setClip(target);
        }
        const map = data.reduce(
          (acc, cur) => {
            if (cur.id && cur.src) {
              acc[cur.id.toString()] = cur.src;
            }
            return acc;
          },
          {} as Record<string, string>,
        );
        setVideoMapTest(map);
      })();
    } catch (err) {
      console.error(err);
    }
  }, [id]);

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
      <StudySubtitles onSelectDialogue={handleSelectDialogue} />

      {/* 학습 카드 */}
      {selected && <StudyCard dialogue={selected} onClose={() => setSelected(null)} />}

      {/* 총 회차 진행률 */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
        <button className="text-sm bg-gray-200 text-gray-600 hover:bg-gray-300 px-4 py-2">
          이전 에피소드
        </button>
        <div className="text-center flex flex-col justify-center items-center flex-grow">
          <span className="text-lg font-semibold text-gray-600">
            총 회차 진행률 <span className="text-m font-semibold text-red-400">35%</span>
          </span>
        </div>
        <button className="text-sm bg-gray-200 text-gray-600 hover:bg-gray-300 px-4 py-2">
          다음 에피소드
        </button>
      </div>
    </div>
  );
};

export default StudyPage;

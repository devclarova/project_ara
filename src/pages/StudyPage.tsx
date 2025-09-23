import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import StudyCard from '../components/study/StudyCard';
import VideoPlayer from '../components/study/VideoPlayer';
import type { Dialogue } from '../types/study';

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

const StudyPage = () => {
  const [selected, setSelected] = useState<Dialogue | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="p-6 max-w-6xl mx-auto">
        {/* 카테고리 */}
        <NavLink
          to={'/studyList'}
          className={({ isActive }) =>
            isActive ? 'text-primary font-medium' : 'text-gray-600 hover:text-gray-900'
          }
        >
          카테고리
        </NavLink>
        <h1 className="text-2xl font-bold mb-6">도깨비 Episode 1 - Scene 1</h1>
        <div>시간 레벨 조회수</div>
      </div>
      {/* 영상 플레이어  (시간 임시 설정) */}
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

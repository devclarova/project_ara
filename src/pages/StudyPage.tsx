import { Progress } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import StudyCard from '../components/study/StudyCard';
import StudySubtitles from '../components/study/StudySubtitles';
import VideoPlayer from '../components/study/VideoPlayer';
import { supabase } from '../lib/supabase';
import { getTts } from '../services/ClipService';
import type { Tts } from '../types/database';
import type { Subtitle } from '../types/study';

type VideoMap = Record<string, string>;

const StudyPage = () => {
  const { id } = useParams<{ id: string }>();

  // ✅ 라우트 파라미터 → 숫자 studyId로 변환 (NaN 방지용 가드 포함)
  const studyId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : undefined;
  }, [id]);

  const [viewCount, setViewCount] = useState(0);
  // 현재는 미사용이면 일단 주석 처리해도 됩니다.
  // const [clip, setClip] = useState<Tts | null>(null);
  // const [videoMapTest, setVideoMapTest] = useState<VideoMap>({});
  const [selectedSubtitle, setSelectedSubtitle] = useState<Subtitle | null>(null);

  const handleSelectDialogue = (s: Subtitle) => {
    setSelectedSubtitle(s);
  };

  // 페이지 클릭시 조회수 증가
  useEffect(() => {
    const incrementViewCount = async () => {
      const { data, error } = await supabase
        .from('study_progress')
        .select('view_count')
        .eq('episode', 'Episode 1')
        .single();

      if (error) return;

      if (data && typeof data.view_count === 'number') {
        const updatedViewCount = data.view_count + 1;
        const { error: updateError } = await supabase
          .from('study_progress')
          .update({ view_count: updatedViewCount, updated_at: new Date().toISOString() })
          .eq('episode', 'Episode 1');

        if (!updateError) setViewCount(updatedViewCount);
      }
    };

    incrementViewCount();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="p-1 max-w-5xl mx-auto">
        {/* 카테고리 */}
        <div className="flex items-center mb-3 gap-1">
          <NavLink
            to="/studyList"
            className={({ isActive }) =>
              isActive
                ? 'text-primary font-medium text-m mr-6'
                : 'text-gray-600 hover:text-gray-900 text-m mr-6'
            }
          >
            카테고리
          </NavLink>
          <NavLink
            to="/dramaList"
            className={({ isActive }) =>
              isActive
                ? 'text-primary font-medium text-m mr-6'
                : 'text-gray-600 hover:text-gray-900 text-m mr-6'
            }
          >
            도깨비
          </NavLink>
          <NavLink
            to="/study"
            className={({ isActive }) =>
              isActive
                ? 'text-primary font-medium text-m mr-6'
                : 'text-gray-600 hover:text-gray-900 text-m mr-6'
            }
          >
            Episode 1
          </NavLink>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">도깨비 Episode 1 - Scene 1</h1>

        <Progress percent={30} size="default" strokeColor="#ff5733" />
        <div className="flex items-center gap-5 text-sm text-gray-600">
          <span className="flex items-center gap-1">1:50</span>
          <span className="flex items-center gap-1">초급</span>
          <span className="flex items-center gap-1">{viewCount} 회 시청</span>
        </div>
      </div>

      {/* 영상 플레이어 */}
      <VideoPlayer />

      {/* 자막 리스트: studyId가 유효할 때만 전달 */}
      <StudySubtitles
        onSelectDialogue={handleSelectDialogue}
        studyId={studyId} // undefined면 내부에서 useParams로 처리 가능하도록 구현
        subscribeRealtime
      />

      {/* 학습 카드: studyId 필수이므로 가드 */}
      {studyId !== undefined && <StudyCard subtitle={selectedSubtitle} studyId={studyId} />}

      {/* 총 회차 진행률 */}
      <div className="flex justify-between items-center">
        <button className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 flex items-center gap-2 hover:scale-110 transition-transform duration-200">
          {/* 아이콘 생략 */}
        </button>
        <div className="text-center flex flex-col justify-center items-center flex-grow">
          <span className="text-lg font-semibold text-gray-600">
            총 회차 진행률 <span className="text-m font-semibold text-red-400">35%</span>
          </span>
        </div>
        <button className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 flex items-center gap-2 hover:scale-110 transition-transform duration-200">
          {/* 아이콘 생략 */}
        </button>
      </div>
    </div>
  );
};

export default StudyPage;

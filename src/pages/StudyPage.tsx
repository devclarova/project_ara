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
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="14"
              viewBox="0 0 16 14"
              fill="none"
            >
              <path
                d="M7.99141 12.834C7.19836 12.834 6.44029 12.6823 5.71722 12.379C5.02524 12.0834 4.40908 11.6654 3.86871 11.1248C3.32835 10.5843 2.91044 9.96787 2.61499 9.27565C2.31177 8.55232 2.16016 7.79398 2.16016 7.00065C2.16016 6.20732 2.31177 5.44898 2.61499 4.72565C2.91044 4.03343 3.32835 3.41704 3.86871 2.87648C4.40908 2.33593 5.02524 1.91787 5.71722 1.62232C6.44029 1.31898 7.19836 1.16732 7.99141 1.16732C8.78446 1.16732 9.54252 1.31898 10.2656 1.62232C10.9576 1.91787 11.5737 2.33593 12.1141 2.87648C12.6545 3.41704 13.0724 4.03343 13.3678 4.72565C13.671 5.44898 13.8227 6.20732 13.8227 7.00065C13.8227 7.79398 13.671 8.55232 13.3678 9.27565C13.0724 9.96787 12.6545 10.5843 12.1141 11.1248C11.5737 11.6654 10.9576 12.0834 10.2656 12.379C9.54252 12.6823 8.78446 12.834 7.99141 12.834ZM7.99141 11.6673C8.83888 11.6673 9.62416 11.4534 10.3472 11.0257C11.047 10.6134 11.6029 10.0573 12.015 9.35732C12.4426 8.63398 12.6564 7.84843 12.6564 7.00065C12.6564 6.15287 12.4426 5.36732 12.015 4.64398C11.6029 3.94398 11.047 3.38787 10.3472 2.97565C9.62416 2.54787 8.83888 2.33398 7.99141 2.33398C7.14393 2.33398 6.35866 2.54787 5.63558 2.97565C4.93583 3.38787 4.37992 3.94398 3.96784 4.64398C3.54022 5.36732 3.32641 6.15287 3.32641 7.00065C3.32641 7.84843 3.54022 8.63398 3.96784 9.35732C4.37992 10.0573 4.93583 10.6134 5.63558 11.0257C6.35866 11.4534 7.14393 11.6673 7.99141 11.6673ZM8.57453 7.00065H10.907V8.16732H7.40828V4.08398H8.57453V7.00065Z"
                fill="#4B5563"
              />
            </svg>
            1:50
          </span>
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="14"
              viewBox="0 0 16 14"
              fill="none"
            >
              <path
                d="M4.31263 11.714L4.90742 10.699C4.33984 10.2634 3.89667 9.73065 3.57789 9.10065C3.24357 8.43954 3.07641 7.73954 3.07641 7.00065C3.07641 6.15287 3.29022 5.36732 3.71784 4.64398C4.12992 3.94398 4.68583 3.38787 5.38558 2.97565C6.10866 2.54787 6.89393 2.33398 7.74141 2.33398C8.58888 2.33398 9.37416 2.54787 10.0972 2.97565C10.797 3.38787 11.3529 3.94398 11.765 4.64398C12.1926 5.36732 12.4064 6.15287 12.4064 7.00065C12.4064 7.73954 12.2392 8.43954 11.9049 9.10065C11.5861 9.73065 11.143 10.2634 10.5754 10.699L11.1702 11.714C11.9166 11.1773 12.4997 10.5007 12.9196 9.68398C13.355 8.84398 13.5727 7.94954 13.5727 7.00065C13.5727 6.20732 13.421 5.44898 13.1178 4.72565C12.8224 4.03343 12.4045 3.41704 11.8641 2.87648C11.3237 2.33593 10.7076 1.91787 10.0156 1.62232C9.29252 1.31898 8.53446 1.16732 7.74141 1.16732C6.94836 1.16732 6.19029 1.31898 5.46722 1.62232C4.77524 1.91787 4.15908 2.33593 3.61871 2.87648C3.07835 3.41704 2.66044 4.03343 2.36499 4.72565C2.06177 5.44898 1.91016 6.20732 1.91016 7.00065C1.91016 7.94954 2.12786 8.84398 2.56326 9.68398C2.98311 10.5007 3.56623 11.1773 4.31263 11.714ZM5.49054 9.68398C5.10179 9.35732 4.79857 8.96454 4.58087 8.50565C4.35539 8.03121 4.24266 7.52954 4.24266 7.00065C4.24266 6.37065 4.40204 5.78343 4.72082 5.23898C5.03182 4.7101 5.45167 4.2901 5.98037 3.97898C6.52462 3.6601 7.11163 3.50065 7.74141 3.50065C8.37118 3.50065 8.95819 3.6601 9.50244 3.97898C10.0311 4.2901 10.451 4.7101 10.762 5.23898C11.0808 5.78343 11.2402 6.37065 11.2402 7.00065C11.2402 7.52954 11.1274 8.03121 10.9019 8.50565C10.6842 8.96454 10.381 9.35732 9.99227 9.68398L9.38582 8.65732C9.60352 8.43954 9.77262 8.18871 9.89314 7.90482C10.0136 7.62093 10.0739 7.31954 10.0739 7.00065C10.0739 6.58065 9.96894 6.19176 9.75902 5.83398C9.54909 5.47621 9.26531 5.19232 8.90766 4.98232C8.55001 4.77232 8.16126 4.66732 7.74141 4.66732C7.32156 4.66732 6.93281 4.77232 6.57516 4.98232C6.21751 5.19232 5.93372 5.47621 5.72379 5.83398C5.51387 6.19176 5.40891 6.58065 5.40891 7.00065C5.40891 7.31954 5.46916 7.62093 5.58967 7.90482C5.71019 8.18871 5.87929 8.43954 6.09699 8.65732L5.49054 9.68398ZM7.15828 7.58398H8.32453V12.834H7.15828V7.58398Z"
                fill="#4B5563"
              />
            </svg>
            초급
          </span>
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="14"
              viewBox="0 0 15 14"
              fill="none"
            >
              <path
                d="M7.50863 1.75C8.53493 1.75 9.50681 1.98333 10.4243 2.45C11.3028 2.90111 12.0434 3.52528 12.646 4.3225C13.2485 5.11972 13.6392 6.01222 13.818 7C13.6392 7.98778 13.2485 8.88028 12.646 9.6775C12.0434 10.4747 11.3028 11.0989 10.4243 11.55C9.50681 12.0167 8.53493 12.25 7.50863 12.25C6.48233 12.25 5.51046 12.0167 4.59301 11.55C3.71443 11.0989 2.97386 10.4747 2.3713 9.6775C1.76874 8.88028 1.37804 7.98778 1.19922 7C1.37804 6.01222 1.76874 5.11972 2.3713 4.3225C2.97386 3.52528 3.71443 2.90111 4.59301 2.45C5.51046 1.98333 6.48233 1.75 7.50863 1.75ZM7.50863 11.0833C8.31723 11.0833 9.08696 10.9044 9.81781 10.5467C10.5253 10.2044 11.1259 9.72222 11.6197 9.1C12.1134 8.47778 12.4496 7.77778 12.6285 7C12.4496 6.22222 12.1134 5.52222 11.6197 4.9C11.1259 4.27778 10.5253 3.79556 9.81781 3.45333C9.08696 3.09556 8.31723 2.91667 7.50863 2.91667C6.70003 2.91667 5.93031 3.09556 5.19946 3.45333C4.49193 3.79556 3.89131 4.27778 3.3976 4.9C2.90389 5.52222 2.56762 6.22222 2.38879 7C2.56762 7.77778 2.90389 8.47778 3.3976 9.1C3.89131 9.72222 4.49193 10.2044 5.19946 10.5467C5.93031 10.9044 6.70003 11.0833 7.50863 11.0833ZM7.50863 9.625C7.03436 9.625 6.59701 9.50639 6.1966 9.26917C5.79619 9.03194 5.47741 8.71306 5.24027 8.3125C5.00314 7.91194 4.88457 7.47444 4.88457 7C4.88457 6.52556 5.00314 6.08806 5.24027 5.6875C5.47741 5.28694 5.79619 4.96806 6.1966 4.73083C6.59701 4.49361 7.03436 4.375 7.50863 4.375C7.98291 4.375 8.42025 4.49361 8.82066 4.73083C9.22108 4.96806 9.53985 5.28694 9.77699 5.6875C10.0141 6.08806 10.1327 6.52556 10.1327 7C10.1327 7.47444 10.0141 7.91194 9.77699 8.3125C9.53985 8.71306 9.22108 9.03194 8.82066 9.26917C8.42025 9.50639 7.98291 9.625 7.50863 9.625ZM7.50863 8.45833C7.77298 8.45833 8.01595 8.39222 8.23754 8.26C8.45913 8.12778 8.63601 7.95083 8.76818 7.72917C8.90036 7.5075 8.96644 7.26444 8.96644 7C8.96644 6.73556 8.90036 6.4925 8.76818 6.27083C8.63601 6.04917 8.45913 5.87222 8.23754 5.74C8.01595 5.60778 7.77298 5.54167 7.50863 5.54167C7.24428 5.54167 7.00131 5.60778 6.77973 5.74C6.55814 5.87222 6.38126 6.04917 6.24908 6.27083C6.11691 6.4925 6.05082 6.73556 6.05082 7C6.05082 7.26444 6.11691 7.5075 6.24908 7.72917C6.38126 7.95083 6.55814 8.12778 6.77973 8.26C7.00131 8.39222 7.24428 8.45833 7.50863 8.45833Z"
                fill="#4B5563"
              />
            </svg>
            {viewCount} 회 시청
          </span>
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
        <button className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 flex items-center gap-2 hover:scale-110 transition-transform duration-200"></button>
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

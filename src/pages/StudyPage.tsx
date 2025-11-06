import { InfoItem } from '@/components/study/ContentCard';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import StudyCard from '../components/study/StudyCard';
import StudySubtitles from '../components/study/StudySubtitles';
import VideoPlayer from '../components/study/VideoPlayer';
import { supabase } from '../lib/supabase';
import type { Subtitle } from '../types/study';
import Sidebar from './homes/feature/Sidebar';

// 이 페이지에서 실제로 사용하는 video 행 타입을 로컬로 정의(컬럼명과 일치)
type VideoRow = {
  id: number;
  categories: string | null;
  contents: string | null; // 작품/콘텐츠 이름
  episode: string | null;
  scene: string | number | null;
  level: string | null;
  runtime: string | null; // 예: "1:50" 등
  runtime_bucket: string | null;
  image_url: string | null;
  view_count: number | null;
};

const StudyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // useNavigate 훅 사용

  // 숫자 변환 가드
  const studyId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : undefined;
  }, [id]);

  const [selectedSubtitle, setSelectedSubtitle] = useState<Subtitle | null>(null);
  const [study, setStudy] = useState<VideoRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTweetModal, setShowTweetModal] = useState(false);

  const handleSelectDialogue = (s: Subtitle) => setSelectedSubtitle(s);

  // video 단건 조회
  useEffect(() => {
    if (studyId === undefined) return;

    const fetchStudy = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('video')
        .select(
          'id,categories,contents,episode,scene,level,runtime,runtime_bucket,image_url,study_id,view_count',
        )
        .eq('study_id', studyId)
        .order('id', { ascending: true }) // 가장 이른 것 1개
        .limit(1)
        .single();

      if (error) {
        console.error('[video fetch error]', error);
      }

      setStudy((data as VideoRow) ?? null);
      setLoading(false);
    };

    fetchStudy();
  }, [studyId]);

  const gotoNextExisting = async () => {
    if (studyId === undefined) return;

    // 현재 studyId 보다 큰 것 중 가장 작은 study_id
    const { data, error } = await supabase
      .from('video')
      .select('study_id')
      .gt('study_id', studyId)
      .order('study_id', { ascending: true })
      .limit(1);

    if (error) {
      console.error('[next study_id error]', error);
      return;
    }
    const next = data?.[0]?.study_id;
    if (next) navigate(`/study/${next}`);
  };

  const gotoPrevExisting = async () => {
    if (studyId === undefined) return;

    // 현재 studyId 보다 작은 것 중 가장 큰 study_id
    const { data, error } = await supabase
      .from('video')
      .select('study_id')
      .lt('study_id', studyId)
      .order('study_id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[prev study_id error]', error);
      return;
    }
    const prev = data?.[0]?.study_id;
    if (prev) navigate(`/study/${prev}`);
  };

  const handleNextPage = () => {
    void gotoNextExisting();
  };
  const handlePrevPage = () => {
    void gotoPrevExisting();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="flex justify-center">
        <div className="flex w-full max-w-7xl min-h-screen">
          {/* Left Sidebar */}
          <aside className="w-20 lg:w-64 shrink-0 border-r-2 border-gray-200 dark:border-gray-800 h-screen sticky top-0">
            <Sidebar onTweetClick={() => setShowTweetModal(true)} />
          </aside>

          <div className="max-w-4xl mx-auto ml-10 mr-10 space-y-6 overflow-y-auto hide-scrollbar flex-1">
            <div className="p-1 max-w-5xl mx-auto">
              {/* 링크 */}
              <nav aria-label="Breadcrumb" className="mb-4">
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 py-2 backdrop-blur">
                  {/* 1) Studylist */}
                  <NavLink
                    to="/studylist"
                    className={({
                      isActive,
                    }) => `group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full leading-none transition-all text-sm
        ${
          isActive
            ? 'ring-indigo-200 text-indigo-700 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10'
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white'
        }`}
                  >
                    <i className="ri-home-5-line text-base opacity-70 group-hover:opacity-100" />
                    <span className="font-medium hidden sm:inline-block">Studylist</span>{' '}
                    {/* 텍스트 숨기기 */}
                  </NavLink>

                  {/* chevron */}
                  <span className="text-gray-300 hidden sm:inline-block">/</span>

                  {/* 2) 카테고리 */}
                  <NavLink
                    to={
                      study?.categories
                        ? `/studylist?category=${encodeURIComponent(study.categories)}`
                        : '/studylist'
                    }
                    className={({
                      isActive,
                    }) => `group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full leading-none transition-all text-sm max-w-[32vw] md:max-w-[28vw] truncate
        ${
          isActive
            ? 'ring-indigo-200 text-indigo-700 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10'
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white'
        }`}
                    title={study?.categories ?? '카테고리'}
                  >
                    <i className="ri-folder-2-line text-base opacity-70 group-hover:opacity-100" />
                    <span className="font-medium hidden sm:inline-block truncate">
                      {study?.categories ?? '카테고리'}
                    </span>{' '}
                    {/* 텍스트 숨기기 */}
                  </NavLink>

                  {/* chevron (sm↑에서만 보이게) */}
                  <span className="text-gray-300 hidden sm:inline-block">/</span>

                  {/* 3) 콘텐츠(작품명) */}
                  <NavLink
                    to={
                      study?.contents
                        ? {
                            pathname: '/studylist',
                            search: `?category=${encodeURIComponent(study?.categories ?? '전체')}&content=${encodeURIComponent(String(study.contents))}`,
                          }
                        : '/studylist'
                    }
                    className={({ isActive }) =>
                      `group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full leading-none transition-all text-sm max-w-[32vw] md:max-w-[28vw] truncate
        ${
          isActive
            ? 'ring-indigo-200 text-indigo-700 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10'
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white'
        }`
                    }
                    title={loading ? '로딩 중' : (study?.contents ?? '제목 없음')}
                  >
                    <i className="ri-movie-2-line text-base opacity-70 group-hover:opacity-100" />
                    <span className="font-medium hidden sm:inline-block truncate">
                      {loading ? '로딩 중' : (study?.contents ?? '제목 없음')}
                    </span>{' '}
                    {/* 텍스트 숨기기 */}
                  </NavLink>

                  {/* chevron (md↑에서만) */}
                  <span className="text-gray-300 hidden md:inline-block">/</span>

                  {/* 4) 에피소드 */}
                  <NavLink
                    to={
                      study?.episode
                        ? {
                            pathname: '/studylist',
                            search: `?category=${encodeURIComponent(study?.categories ?? '전체')}&content=${encodeURIComponent(String(study.contents))}&episode=${encodeURIComponent(study.episode)}`,
                          }
                        : '/studylist'
                    }
                    className={({ isActive }) =>
                      `group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full leading-none transition-all text-sm max-w-[32vw] md:max-w-[28vw] truncate
        ${
          isActive
            ? 'ring-indigo-200 text-indigo-700 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10'
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white'
        }`
                    }
                    title={loading ? '로딩 중' : (study?.episode ?? '에피소드 없음')}
                  >
                    <i className="ri-hashtag text-base opacity-70 group-hover:opacity-100" />
                    <span className="font-medium hidden sm:inline-block truncate">
                      {loading ? '로딩 중' : (study?.episode ?? '에피소드 없음')}
                    </span>{' '}
                    {/* 텍스트 숨기기 */}
                  </NavLink>

                  {/* 로딩일 때 스켈레톤 */}
                  {loading && (
                    <span className="ml-auto h-6 w-24 rounded-full bg-gray-200/70 animate-pulse" />
                  )}
                </div>
              </nav>

              {/* 콘텐츠명 */}
              <div className="flex justify-between items-center mb-3 relative h-14">
                {/* 이전 버튼 */}
                <button
                  onClick={handlePrevPage}
                  className="group flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 text-gray-700 hover:text-primary"
                >
                  <i className="ri-arrow-drop-left-line text-5xl transition-transform duration-200 group-hover:-translate-x-1 dark:text-gray-300" />
                </button>

                {/* 중앙 타이틀 */}
                <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-bold text-gray-900 select-none tracking-tight transition-all duration-300 whitespace-nowrap">
                  {loading ? (
                    <span className="animate-pulse text-gray-400 text-lg sm:text-xl lg:text-2xl xl:text-3xl">
                      로딩 중...
                    </span>
                  ) : (
                    <div className="relative flex items-baseline justify-center">
                      <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl">
                        {study?.contents ?? '제목 없음'}
                      </span>

                      <div className="flex items-baseline ml-2">
                        {study?.episode && (
                          <span className="text-sm sm:text-base lg:text-lg text-gray-600 mr-1">
                            {study.episode}
                          </span>
                        )}
                        {study?.scene && (
                          <span className="text-xs sm:text-sm lg:text-base text-gray-500">
                            Scene {study.scene}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </h1>

                {/* 다음 버튼 */}
                <button
                  onClick={handleNextPage}
                  className="group flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 text-gray-700 hover:text-primary"
                >
                  <i className="ri-arrow-drop-right-line text-5xl transition-transform duration-200 group-hover:-translate-x-1 dark:text-gray-300" />
                </button>
              </div>

              {/* 메타 정보 라인: 시간/난이도(임시)/카테고리 */}
              <div className="flex items-center gap-5 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  {/* 시간(runtime) */}
                  <InfoItem
                    icon="ri-time-line"
                    text={loading ? '—' : (study?.runtime_bucket ?? study?.runtime ?? '—')}
                  />
                </span>
                <span className="flex items-center gap-1">
                  {/* 난이도: video에 없으면 임시로 표기 */}
                  <InfoItem icon="ri-star-line" text={loading ? '—' : (study?.level ?? '—')} />
                </span>
                {/* 조회수 */}
                <span className="flex items-center gap-1">
                  <InfoItem
                    icon="ri-eye-line"
                    text={loading ? '—' : `${study?.view_count ?? '—'}`}
                  />
                </span>
              </div>
            </div>

            {/* 영상 플레이어 */}
            <VideoPlayer />

            {/* 자막 리스트 */}
            <StudySubtitles
              onSelectDialogue={handleSelectDialogue}
              studyId={studyId}
              subscribeRealtime
            />

            {/* 학습 카드 */}
            {studyId !== undefined && <StudyCard subtitle={selectedSubtitle} studyId={studyId} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPage;

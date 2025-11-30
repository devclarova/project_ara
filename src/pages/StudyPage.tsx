import ShareButton from '@/components/common/ShareButton';
import { InfoItem } from '@/components/study/ContentCard';
import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import StudyCard from '../components/study/StudyCard';
import StudySubtitles from '../components/study/StudySubtitles';
import VideoPlayer, { type VideoPlayerHandle } from '../components/study/VideoPlayer';
import { supabase } from '../lib/supabase';
import type { Subtitle } from '../types/study';
import Sidebar from './homes/feature/Sidebar';

// 이 페이지에서 실제로 사용하는 video 행 타입을 로컬로 정의(컬럼명과 일치)
type VideoRow = {
  id: number;
  study_id: number;
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
  const { contents, episode, scene } = useParams<{
    contents: string;
    episode: string;
    scene?: string;
  }>();
  const navigate = useNavigate(); // useNavigate 훅 사용

  const [selectedSubtitle, setSelectedSubtitle] = useState<Subtitle | null>(null);
  const [study, setStudy] = useState<VideoRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTweetModal, setShowTweetModal] = useState(false);
  const location = useLocation();
  const isGuestRoute = location.pathname.startsWith('/guest-study');
  const basePath = isGuestRoute ? '/guest-study' : '/study';

  const handleSelectDialogue = (s: Subtitle) => setSelectedSubtitle(s);
  const vref = useRef<VideoPlayerHandle>(null);

  const dec = (v?: string | null) => (v == null ? v : decodeURIComponent(v));
  const enc = (v?: string | number | null) => encodeURIComponent(String(v ?? ''));

  // 페이지 메타
  const baseTitle = 'ARA - Learn Korean with K-Content';
  const pageTitle = study
    ? `${study.contents ?? 'ARA Study'}${study.episode ? ` ${study.episode}` : ''}${
        study.scene ? ` - Scene ${study.scene}` : ''
      } | ${baseTitle}`
    : `Study | ${baseTitle}`;

  const description = study
    ? `K-콘텐츠 장면으로 한국어 공부하기: ${study.contents ?? ''}${
        study.episode ? ` ${study.episode}` : ''
      }${study.scene ? ` - Scene ${study.scene}` : ''}`
    : 'ARA에서 K-콘텐츠로 즐겁게 한국어를 공부해보세요.';

  const ogImage = study?.image_url ?? '/images/font_slogan_logo.png';

  // URL 생성기: scene이 없으면 세그먼트 생략
  const buildStudyUrl = (row: {
    contents?: string | null;
    episode?: string | null;
    scene?: string | number | null;
  }) => {
    const c = enc(row.contents);
    const e = enc(row.episode);
    const s = row.scene != null && String(row.scene).length > 0 ? enc(row.scene) : null;
    return s ? `${basePath}/${c}/${e}/${s}` : `${basePath}/${c}/${e}`;
  };

  // video 단건 조회
  // 단건 조회: scene 있으면 정확 매칭, 없으면 첫 장면 선택 후 URL 정규화
  useEffect(() => {
    const fetchStudy = async () => {
      if (!contents || !episode) return;
      setLoading(true);

      const c = dec(contents);
      const e = dec(episode);

      if (scene != null) {
        const s = dec(scene);
        const { data, error } = await supabase
          .from('video')
          .select(
            'id,study_id,categories,contents,episode,scene,level,runtime,runtime_bucket,image_url,view_count',
          )
          .eq('contents', c)
          .eq('episode', e)
          .eq('scene', s)
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) console.error('[video fetch error]', error);
        setStudy((data as VideoRow) ?? null);
        setLoading(false);
        return;
      }

      // scene 미지정: 같은 contents/episode에서 첫 장면 고르기
      const { data, error } = await supabase
        .from('video')
        .select(
          'id,study_id,categories,contents,episode,scene,level,runtime,runtime_bucket,image_url,view_count',
        )
        .eq('contents', c)
        .eq('episode', e)
        .order('scene', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })
        .limit(1);

      if (error) {
        setStudy(null);
      } else {
        const row = (data?.[0] as VideoRow) ?? null;
        setStudy(row);
        if (row) {
          const canonical = buildStudyUrl(row);
          if (canonical !== location.pathname) navigate(canonical, { replace: true });
        }
      }
      setLoading(false);
    };

    void fetchStudy();
  }, [contents, episode, scene, navigate]);

  // 1-1) 보조 함수 추가: study_id로 행을 찾아 새 URL로 이동
  const goToByStudyId = async (targetStudyId: number) => {
    const { data, error } = await supabase
      .from('video')
      .select('contents,episode,scene')
      .eq('study_id', targetStudyId)
      .order('id', { ascending: true })
      .limit(1);

    if (error) {
      console.error('[goToByStudyId error]', error);
      return;
    }
    const row = data?.[0];
    if (!row) return;

    const url = buildStudyUrl(row);
    navigate(url);
  };

  const gotoNextExisting = async () => {
    // if (studyId === undefined) return;
    if (!study?.study_id) return;
    const { data, error } = await supabase
      .from('video')
      .select('study_id')
      .gt('study_id', study.study_id)
      .order('study_id', { ascending: true })
      .limit(1);

    if (error) {
      console.error('[next study_id error]', error);
      return;
    }
    const next = data?.[0]?.study_id;
    if (next) await goToByStudyId(next);
  };

  const gotoPrevExisting = async () => {
    // if (studyId === undefined) return;
    if (!study?.study_id) return;
    const { data, error } = await supabase
      .from('video')
      .select('study_id')
      .lt('study_id', study.study_id)
      .order('study_id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[prev study_id error]', error);
      return;
    }
    const prev = data?.[0]?.study_id;
    if (prev) await goToByStudyId(prev);
  };

  const handleNextPage = () => {
    void gotoNextExisting();
  };
  const handlePrevPage = () => {
    void gotoPrevExisting();
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>

        <meta name="description" content={description} />

        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta
          property="og:url"
          content={
            study
              ? `https://ara.com${buildStudyUrl(study)}`
              : `https://ara.com/study/${enc(contents)}/${enc(episode)}${scene ? `/${enc(scene)}` : ''}`
          }
        />
        <meta property="og:type" content="article" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      <div className="min-h-screen bg-white dark:bg-background">
        <div className="flex justify-center">
          <div className="flex w-full max-w-7xl min-h-screen">
            {/* Left Sidebar */}
            <aside className="w-20 lg:w-64 shrink-0 border-r-2 border-gray-200 dark:border-gray-700 h-screen sticky top-0 bg-white dark:bg-background">
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
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white dark:hover:bg-gray-600'
        }`}
                    >
                      <i className="ri-home-5-line text-base opacity-70 group-hover:opacity-100 dark:text-gray-100" />
                      <span className="font-medium hidden sm:inline-block dark:text-gray-100">
                        Studylist
                      </span>
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
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white dark:hover:bg-gray-600'
        }`}
                      title={study?.categories ?? '카테고리'}
                    >
                      <i className="ri-folder-2-line text-base opacity-70 group-hover:opacity-100 dark:text-gray-100" />
                      <span className="font-medium hidden sm:inline-block truncate dark:text-gray-100">
                        {study?.categories ?? '카테고리'}
                      </span>
                    </NavLink>

                    {/* chevron (sm↑에서만 보이게) */}
                    <span className="text-gray-300 hidden sm:inline-block">/</span>

                    {/* 3) 콘텐츠(작품명) */}
                    <NavLink
                      to={
                        study?.contents
                          ? {
                              pathname: '/studylist',
                              search: `?category=${encodeURIComponent(
                                study?.categories ?? '전체',
                              )}&content=${encodeURIComponent(String(study.contents))}`,
                            }
                          : '/studylist'
                      }
                      className={({ isActive }) =>
                        `group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full leading-none transition-all text-sm max-w-[32vw] md:max-w-[28vw] truncate
        ${
          isActive
            ? 'ring-indigo-200 text-indigo-700 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10'
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white dark:hover:bg-gray-600'
        }`
                      }
                      title={loading ? '로딩 중' : (study?.contents ?? '제목 없음')}
                    >
                      <i className="ri-movie-2-line text-base opacity-70 group-hover:opacity-100 dark:text-gray-100" />
                      <span className="font-medium hidden sm:inline-block truncate dark:text-gray-100">
                        {loading ? '로딩 중' : (study?.contents ?? '제목 없음')}
                      </span>
                    </NavLink>

                    {/* chevron (md↑에서만) */}
                    <span className="text-gray-300 hidden md:inline-block">/</span>

                    {/* 4) 에피소드 */}
                    <NavLink
                      to={
                        study?.episode
                          ? {
                              pathname: '/studylist',
                              search: `?category=${encodeURIComponent(
                                study?.categories ?? '전체',
                              )}&content=${encodeURIComponent(
                                String(study.contents),
                              )}&episode=${encodeURIComponent(study.episode)}`,
                            }
                          : '/studylist'
                      }
                      className={({ isActive }) =>
                        `group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full leading-none transition-all text-sm max-w-[32vw] md:max-w-[28vw] truncate
        ${
          isActive
            ? 'ring-indigo-200 text-indigo-700 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10'
            : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:bg-white hover:dark:bg-gray-600 dark:text-gray-300'
        }`
                      }
                      title={loading ? '로딩 중' : (study?.episode ?? '에피소드 없음')}
                    >
                      <i className="ri-hashtag text-base opacity-70 group-hover:opacity-100 dark:text-gray-100" />
                      <span className="font-medium hidden sm:inline-block truncate dark:text-gray-100">
                        {loading ? '로딩 중' : (study?.episode ?? '에피소드 없음')}
                      </span>
                    </NavLink>
                  </div>
                </nav>

                {/* 콘텐츠명 */}
                <div className="flex justify-between items-center mb-3 relative h-14">
                  {/* 이전 버튼 */}
                  <button
                    onClick={handlePrevPage}
                    className="group flex justify-start items-center gap-2 pl-4 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:text-primary w-full sm:w-auto dark:text-gray-100"
                  >
                    <i className="ri-arrow-drop-left-line text-5xl transition-transform duration-200 group-hover:-translate-x-1" />
                  </button>

                  {/* 중앙 타이틀 */}
                  <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-bold text-gray-900 select-none tracking-tight transition-all duration-300 whitespace-nowrap">
                    {loading ? (
                      <span className="animate-pulse text-gray-400 text-lg sm:text-xl lg:text-2xl xl:text-3xl dark:text-gray-100">
                        로딩 중...
                      </span>
                    ) : (
                      <div className="relative flex items-baseline justify-center">
                        <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl dark:text-gray-100">
                          {study?.contents ?? '제목 없음'}
                        </span>

                        <div className="flex items-baseline ml-2">
                          {study?.episode && (
                            <span className="text-sm sm:text-base lg:text-lg text-gray-600 mr-1 dark:text-gray-300">
                              {study.episode}
                            </span>
                          )}
                          {study?.scene && (
                            <span className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
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
                    className="group flex justify-end items-center gap-2 pr-4 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:text-primary w-full sm:w-auto dark:text-gray-100"
                  >
                    <i className="ri-arrow-drop-right-line text-5xl transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* 메타 정보 라인: 시간/난이도/카테고리 */}
              <div className="flex items-center gap-5 text-sm text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1">
                  {/* 시간(runtime) */}
                  <InfoItem
                    icon="ri-time-line"
                    text={loading ? '—' : (study?.runtime_bucket ?? study?.runtime ?? '—')}
                  />
                </span>
                <span className="flex items-center gap-1">
                  {/* 난이도 */}
                  <InfoItem icon="ri-star-line" text={loading ? '—' : (study?.level ?? '—')} />
                </span>
                {/* 조회수 */}
                <span className="flex items-center gap-1">
                  <InfoItem
                    icon="ri-eye-line"
                    text={loading ? '—' : `${study?.view_count ?? '—'}`}
                  />
                </span>
                {!loading && (
                  <div className="ml-auto">
                    <ShareButton
                      title={`${study?.contents ?? 'ARA Study'}`}
                      text={`K-콘텐츠로 배우는 학습 ${
                        study?.episode ? ` (${study.episode})` : ''
                      }${study?.scene ? ` - Scene ${study.scene}` : ''}`}
                    />
                  </div>
                )}
              </div>

              {/* 영상 플레이어 */}
              <VideoPlayer key={`${contents}-${episode}-${scene}`} ref={vref} />

              {/* 자막 리스트 */}
              <StudySubtitles
                onSelectDialogue={handleSelectDialogue}
                studyId={study?.study_id}
                subscribeRealtime
                onSeek={start => {
                  vref.current?.playDialogue(start);
                }}
              />

              {/* 학습 카드 */}
              {study?.study_id !== undefined && (
                <StudyCard subtitle={selectedSubtitle} studyId={study?.study_id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudyPage;

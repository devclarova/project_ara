import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface VideoPlayerProps {
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ autoPlay = false }) => {
  const playerRef = useRef<any>(null);
  const { id } = useParams<{ id: string }>();

  const [playing, setPlaying] = useState(autoPlay);
  const [video, setVideo] = useState<string | undefined>(undefined);

  const [startSec, setStartSec] = useState<number>(); // 기본값
  const [endSec, setEndSec] = useState<number>(); // 기본값
  const [videoDuration, setVideoDuration] = useState<number>();

  // 영상 불러오기
  useEffect(() => {
    const fetchVideo = async () => {
      const { data, error } = await supabase
        .from('video')
        .select('id, video_url,video_start_time, video_end_time')
        .eq('study_id', Number(id))
        .single(); // id에 해당하는 영상 URL 가져오기

      if (error) {
        console.log('영상 가져오기 오류 : ', error);
        return;
      }
      if (!data) return;

      if (data.video_url) setVideo(data.video_url);
      if (typeof data.video_start_time === 'number') setStartSec(data.video_start_time);
      if (typeof data.video_end_time === 'number') setEndSec(data.video_end_time);
    };

    if (id) fetchVideo();
  }, [id]); // id가 변경될 때마다 호출

  // 영상이 준비되면 시작 지점으로 이동
  const handleReady = () => {
    playerRef.current?.seekTo(startSec, 'seconds');
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    // endSec 값이 있을 때만 동작
    if (endSec !== undefined && state.playedSeconds >= endSec) {
      setPlaying(false);
      playerRef.current?.seekTo(endSec, 'seconds');
    }
  };

  // 재생/일시정지
  const handlePlayPause = () => {
    const t = playerRef.current?.getCurrentTime?.();

    // 영상 끝에 있을 때 → startSec으로 돌리고 재생 시작
    if (
      (endSec !== undefined && typeof t === 'number' && t >= endSec) ||
      (endSec === undefined &&
        typeof t === 'number' &&
        videoDuration !== undefined &&
        t >= videoDuration)
    ) {
      playerRef.current?.seekTo(startSec ?? 0, 'seconds');
      setPlaying(true);
      return;
    }

    // 일반적인 토글
    setPlaying(p => !p);
  };

  // 영상 구간 이동
  const handleBackward = (seconds: number) => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime - seconds, 'seconds');
    }
  };
  const handleForward = (seconds: number) => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime + seconds, 'seconds');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-t-xl overflow-hidden relative">
        <ReactPlayer
          ref={playerRef}
          url={video || undefined}
          playing={playing}
          controls={false}
          width="100%"
          height="400px"
          onReady={handleReady}
          onProgress={handleProgress}
          onDuration={d => setVideoDuration(d)}
          progressInterval={100}
        />
        {/* 오버레이 (클릭 차단) */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto" />
      </div>

      {/* 커스텀 컨트롤 */}
      <div
        className="overflow-hidden shadow-md bg-gray-100 border-2 border-gray-300 
                  border-t-0 rounded-b-xl"
      >
        <div className="flex justify-center items-center gap-3">
          {/* 3초 전으로 이동 */}
          <button
            onClick={() => handleBackward(3)}
            aria-label="Backward 1 second"
            className="p-5 text-2xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M0.9599 7.17125L6.86209 3.64C7.0081 3.55116 7.1753 3.50316 7.3462 3.50101C7.51711 3.49887 7.68545 3.54266 7.83365 3.62781C7.99445 3.72145 8.1276 3.85597 8.21959 4.01772C8.31158 4.17947 8.35913 4.36268 8.3574 4.54875V7.01906L14.0049 3.63906C14.1509 3.55022 14.3181 3.50222 14.489 3.50008C14.6599 3.49793 14.8283 3.54172 14.9765 3.62688C15.1373 3.72051 15.2704 3.85504 15.3624 4.01679C15.4544 4.17853 15.5019 4.36175 15.5002 4.54781V11.4541C15.502 11.6402 15.4545 11.8235 15.3625 11.9853C15.2705 12.1471 15.1373 12.2817 14.9765 12.3753C14.8283 12.4605 14.6599 12.5043 14.489 12.5021C14.3181 12.5 14.1509 12.452 14.0049 12.3631L8.3574 8.98156V11.4528C8.35944 11.6392 8.31204 11.8227 8.22003 11.9848C8.12803 12.1468 7.9947 12.2816 7.83365 12.3753C7.68545 12.4605 7.51711 12.5043 7.3462 12.5021C7.1753 12.5 7.0081 12.452 6.86209 12.3631L0.9599 8.83188C0.819588 8.74398 0.70391 8.62188 0.623721 8.47703C0.543533 8.33217 0.501465 8.16932 0.501465 8.00375C0.501465 7.83818 0.543533 7.67533 0.623721 7.53048C0.70391 7.38562 0.819588 7.26352 0.9599 7.17563V7.17125Z"
                fill="black"
              />
            </svg>
          </button>
          <button onClick={handlePlayPause} aria-label="Pause:Play" className="p-5 text-2xl">
            {playing ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 18H7V6H9V18ZM15 6H17V18H15V6Z"
                  fill="black"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
              >
                <path
                  d="M26.7612 11.6916C27.3616 12.0109 27.8638 12.4875 28.214 13.0704C28.5642 13.6532 28.7492 14.3204 28.7492 15.0004C28.7492 15.6804 28.5642 16.3475 28.214 16.9304C27.8638 17.5133 27.3616 17.9899 26.7612 18.3091L10.7463 27.0179C8.1675 28.4216 5 26.5966 5 23.7104V6.29163C5 3.40413 8.1675 1.58038 10.7463 2.98163L26.7612 11.6916Z"
                  fill="black"
                />
              </svg>
            )}
          </button>
          {/* 3초 앞으로 이동 */}
          <button
            onClick={() => handleForward(3)}
            aria-label="Forward 1 second"
            className="p-5 text-2xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M15.0404 7.17125L9.13817 3.64C8.99216 3.55116 8.82497 3.50316 8.65406 3.50101C8.48315 3.49887 8.31481 3.54266 8.16661 3.62781C8.00581 3.72145 7.87265 3.85597 7.78067 4.01772C7.68868 4.17947 7.64113 4.36268 7.64286 4.54875V7.01906L1.99536 3.63906C1.84935 3.55022 1.68215 3.50222 1.51125 3.50008C1.34034 3.49793 1.172 3.54172 1.0238 3.62688C0.862998 3.72051 0.729843 3.85504 0.637854 4.01679C0.545866 4.17853 0.498321 4.36175 0.500048 4.54781V11.4541C0.498265 11.6402 0.545784 11.8235 0.637775 11.9853C0.729767 12.1471 0.862952 12.2817 1.0238 12.3753C1.172 12.4605 1.34034 12.5043 1.51125 12.5021C1.68215 12.5 1.84935 12.452 1.99536 12.3631L7.64286 8.98156V11.4528C7.64086 11.6391 7.68827 11.8227 7.78027 11.9847C7.87227 12.1468 8.00558 12.2815 8.16661 12.3753C8.31481 12.4605 8.48315 12.5043 8.65406 12.5021C8.82497 12.5 8.99216 12.452 9.13817 12.3631L15.0404 8.83188C15.1807 8.74398 15.2964 8.62188 15.3765 8.47703C15.4567 8.33217 15.4988 8.16932 15.4988 8.00375C15.4988 7.83818 15.4567 7.67533 15.3765 7.53048C15.2964 7.38562 15.1807 7.26352 15.0404 7.17563V7.17125Z"
                fill="black"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;

import React, { useEffect, useRef, useState } from 'react';
import { getTts } from '../../services/ClipService';
import { useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import type { Tts } from '../../types/database';
import { supabase } from '../../lib/supabase';

interface VideoPlayerProps {
  start?: number;
  end?: number;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = () => {
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const { id } = useParams<{ id: string }>();

  // 반복 구간
  const START_TIME = 70;
  const END_TIME = 122;

  // 영상 이동
  // const jumpSeconds = 1;

  // 영상이 준비되면 시작 지점으로 이동
  const handleReady = () => {
    if (playerRef.current) {
      playerRef.current.currentTime = START_TIME;
    }
  };

  const handleTimeUpdate = () => {
    if (!playerRef.current) return;
    if (playerRef.current.currentTime >= END_TIME) {
      playerRef.current.currentTime = START_TIME;
    }
    if (playerRef.current.currentTime < START_TIME) {
      playerRef.current.currentTime = START_TIME;
    }
  };

  // 영상 불러오기
  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('video')
          .select('id, video_url')
          .eq('study_id', id)
          .single(); // id에 해당하는 영상 URL 가져오기

        if (error) {
          console.error('영상 가져오기 오류:', error);
        } else {
          if (data?.video_url) {
            setVideoUrl(data.video_url); // video_url 상태 업데이트
          }
        }
      } catch (err) {
        console.error('데이터 불러오기 에러:', err);
      }
    };

    fetchVideoUrl();
  }, [id]); // id가 변경될 때마다 호출

  // 재생/일시 정지 버튼 토글
  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  // 영상 구간 이동
  const jumpForward = () => {};
  const jumpBackward = () => {};

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-xl overflow-hidden shadow-md bg-gray-100 border-2 border-gray-300">
        <div className="rounded-t-1 overflow-hidden shadow-md bg-black/5">
          <ReactPlayer
            ref={playerRef}
            src={videoUrl || undefined}
            playing={playing}
            controls={false}
            width="100%"
            height="400px"
            config={{
              youtube: {
                origin: window.location.origin,
              },
            }}
            onReady={handleReady}
            onPlay={() => {
              playerRef.current?.addEventListener('timeupdate', handleTimeUpdate);
            }}
            onPause={() => {
              playerRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
            }}
          />
        </div>

        {/* 커스텀 컨트롤 */}
        <div className="flex justify-center items-center gap-3">
          <button onClick={jumpBackward} aria-label="Backward 1 second" className="p-5 text-2xl">
            ⏪
          </button>
          <button onClick={handlePlayPause} aria-label="Pause:Play" className="p-5 text-2xl">
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={jumpForward} aria-label="Forward 1 second" className="p-5 text-2xl">
            ⏩
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;

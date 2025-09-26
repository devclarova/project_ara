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
          .from('study')
          .select('id, video_url')
          .eq('id', id)
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

  // 영상 구간 이동
  const jumpForward = () => {};
  const jumpBackward = () => {};

  return (
    <div style={{ maxWidth: '100%' }}>
      <ReactPlayer
        ref={playerRef}
        src={videoUrl || undefined}
        playing={playing}
        controls={false}
        width="100%"
        height="360px"
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

      {/* 커스텀 컨트롤 */}
      <div className="flex space-x-2 mt-2">
        <button onClick={() => setPlaying(true)}>▶ Play</button>
        <button onClick={() => setPlaying(false)}>⏸ Pause</button>
        <button onClick={jumpBackward}>⏪ -1s</button>
        <button onClick={jumpForward}>⏩ +1s</button>
      </div>
    </div>
  );
};

export default VideoPlayer;

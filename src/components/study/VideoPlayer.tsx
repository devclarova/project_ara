import React, { useEffect, useRef, useState } from 'react';
import { getTts } from '../../services/ClipService';
import { useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import type { Tts } from '../../types/database';
import { supabase } from '../../lib/supabase';

type VideoMap = {
  [key: string]: string;
};

interface VideoPlayerProps {
  start?: number;
  end?: number;
  autoPlay?: boolean;
}

interface ProgressState {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = () => {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const { id } = useParams<{ id: string }>();
  // const [clip, setClip] = useState<Tts[] | null>(null);
  const [videoMapTest, setVideoMapTest] = useState<VideoMap>({});

  // 반복 구간
  const START_TIME = 70;
  const END_TIME = 122;

  // 영상 이동
  const jumpSeconds = 1;

  // 영상이 준비되면 시작 지점으로 이동
  const handleReady = () => {
    if (playerRef.current) {
      playerRef.current.currentTime = START_TIME;
      setPlaying(true);
    }
  };

  // const handleTimeUpdate = () => {
  //   if (!playerRef.current) return;
  //   if (playerRef.current.currentTime >= END_TIME) {
  //     playerRef.current.currentTime = START_TIME;
  //   }
  //   if (playerRef.current.currentTime < START_TIME) {
  //     playerRef.current.currentTime = START_TIME;
  //   }
  // };

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const data = await getTts();
  //       console.log(data);

  //       const map = data.reduce(
  //         (acc, cur) => {
  //           if (cur.id && cur.src) {
  //             acc[cur.id.toString()] = cur.src;
  //           }
  //           return acc;
  //         },
  //         {} as Record<string, string>,
  //       );

  //       setVideoMapTest(map);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   })();
  // }, []);

  // 영상 불러오기
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('study').select('id, video_url').eq('id', id);

        if (error) {
          console.error('영상 가져오기 오류:', error);
        } else {
          // videoMap에 id와 video_url 저장
          const map = data.reduce(
            (acc, cur) => {
              if (cur.id && cur.video_url) {
                acc[cur.id.toString()] = cur.video_url;
              }
              return acc;
            },
            {} as Record<string, string>,
          );

          setVideoMapTest(map);
        }
      } catch (err) {
        console.error('데이터 불러오기 에러:', err);
      }
    })();
  }, [id]);

  const videoUrl =
    id && videoMapTest[id] ? videoMapTest[id] : 'https://www.youtube.com/watch?v=5d0nzj_99ac';

  // 영상 구간 이동
  const jumpForward = () => {};
  const jumpBackward = () => {};

  return (
    <div style={{ maxWidth: '100%' }}>
      <ReactPlayer
        ref={playerRef}
        src={videoUrl}
        playing={playing}
        controls={false}
        width="100%"
        height="360px"
        onReady={handleReady}
        onProgress={state => {
          const playedSeconds = Number((state as any)?.playedSeconds);
          if (!Number.isFinite(playedSeconds)) return;
          if (playedSeconds >= END_TIME || playedSeconds < START_TIME) {
            (playerRef.current as any).seekTo(START_TIME, 'seconds');
          }
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

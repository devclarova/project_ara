import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom';
import type { Tts } from '../types/database';
import { supabase } from '../lib/supabase';
import { getTts, getTtsById } from '../services/ClipService';

type Dialogue = {
  character: string;
  timestamp: string;
  dialogue: string;
  category: string;
  words: { term: string; meaning: string; example?: string }[];
  cultureNote: string;
};

const initialDialogues: Dialogue[] = [
  {
    character: '타요',
    timestamp: '00:32:58 → 00:34:11',
    dialogue: '지금쯤 영화는 끝났겠지 얼마나 재미있었을까',
    category: '추측/가정; 감탄문',
    words: [
      { term: '지금쯤', meaning: 'by now / at this time', example: '지금쯤 집에 도착했겠지.' },
      { term: '끝났겠지', meaning: 'must have ended (추측)', example: '수업은 끝났겠지.' },
      { term: '얼마나', meaning: 'how much / how', example: '얼마나 예뻤을까.' },
    ],
    cultureNote:
      '‘~겠지’는 추측을 나타내는 표현으로, 누군가의 상태나 상황을 조심스럽게 예상할 때 사용합니다. ‘얼마나 ~었을까’는 감탄과 궁금증을 동시에 표현합니다.',
  },
  {
    character: '라니',
    timestamp: '00:09:34 → 00:10:23',
    dialogue: '용기의 하트 덕분이에요',
    category: '감사 표현',
    words: [
      { term: '덕분이에요', meaning: 'thanks to (you/it)', example: '친구 덕분이에요.' },
      { term: '용기', meaning: 'courage', example: '용기를 내서 발표했어요.' },
    ],
    cultureNote:
      '‘~덕분이에요’는 한국어에서 상대방에게 감사할 때 자주 쓰이는 표현입니다. 단순한 고마움이 아니라, 상대방의 도움으로 긍정적인 결과가 생겼다는 뉘앙스를 담고 있습니다.',
  },
  {
    character: '기타',
    timestamp: '01:33:50 → 01:34:42',
    dialogue: '열심히 일한 뒤에 씻으니까',
    category: '시간 표현',
    words: [
      { term: '뒤에', meaning: 'after', example: '수업이 끝난 뒤에 밥을 먹었어요.' },
      { term: '씻다', meaning: 'to wash', example: '손을 씻으세요.' },
    ],
    cultureNote:
      '‘~한 뒤에’는 어떤 행동이 끝난 후 다음 행동이 이어짐을 나타냅니다. 일상 회화에서 시간 순서를 설명할 때 자주 쓰입니다.',
  },
];

function WordExplanation({
  words,
}: {
  words: { term: string; meaning: string; example?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {words.map((w, i) => (
        <div key={i} className="p-3 border rounded-lg bg-white shadow-sm hover:bg-gray-50">
          <h4 className="font-semibold">{w.term}</h4>
          <p className="text-sm text-gray-600">{w.meaning}</p>
          {w.example && <p className="text-xs text-gray-400 mt-1">예: {w.example}</p>}
        </div>
      ))}
    </div>
  );
}

function CultureNote({ note }: { note: string }) {
  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h4 className="font-semibold mb-2">문화 노트</h4>
      <p className="text-sm text-gray-700">{note}</p>
    </div>
  );
}

type VideoMap = {
  [key: string]: string;
};

// const videoMap: VideoMap = {
//   '1': 'https://youtu.be/SFg64eR3aKA?...',
//   '2': 'https://youtu.be/f1ZJlT0yASs?...',
//   '3': 'https://youtu.be/12o0jwxBcJI?...',
//   '4': 'https://youtu.be/mhfacjgHrMY?...',
//   default: 'https://youtu.be/jJAIFMiPdds?si=EGEHykwWqDMzMqhu',
// };

const VideoS = () => {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const { id } = useParams<{ id: string }>();
  const [clip, setClip] = useState<Tts | null>(null);
  const [videoMapTest, setVideoMapTest] = useState<VideoMap>({});

  // 유틸 함수: HH:MM:SS -> 초
  const timeStringToSeconds = (time: string): number => {
    const parts = time.split(':').map(Number);
    if (parts.length === 3) {
      const [h, m, s] = parts;
      return h * 3600 + m * 60 + s;
    } else if (parts.length === 2) {
      const [m, s] = parts;
      return m * 60 + s;
    } else {
      return Number(parts[0]) || 0;
    }
  };

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

  const videoUrl =
    id && videoMapTest[id]
      ? videoMapTest[id]
      : 'https://www.youtube.com/watch?v=jJAIFMiPdds&t=538s';

  const START_TIME_TEST = clip ? timeStringToSeconds(clip.start) : 0;
  const END_TIME_TEST = clip ? timeStringToSeconds(clip.end) : 30;
  console.log('시작:', START_TIME_TEST, '끝:', END_TIME_TEST);

  // 영상이 준비되면 시작 지점으로 이동
  const handleReady = () => {
    if (playerRef.current) {
      playerRef.current.currentTime = START_TIME_TEST;
    }
  };

  const handleTimeUpdate = () => {
    if (!playerRef.current) return;
    if (playerRef.current.currentTime >= END_TIME_TEST) {
      playerRef.current.currentTime = START_TIME_TEST;
    }
    if (playerRef.current.currentTime < START_TIME_TEST) {
      playerRef.current.currentTime = START_TIME_TEST;
    }
  };

  return (
    <div style={{ maxWidth: '100%', margin: '2rem auto' }}>
      <h2>ReactPlayer v3 구간 반복 테스트용, 크기 상관 고려 안함</h2>
      <ReactPlayer
        ref={playerRef}
        src={videoUrl}
        playing={playing}
        controls={true}
        width="100%"
        height="360px"
        onReady={handleReady}
        onPlay={() => {
          playerRef.current?.addEventListener('timeupdate', handleTimeUpdate);
        }}
        onPause={() => {
          playerRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
        }}
      />

      {/* 커스텀 컨트롤 */}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setPlaying(p => !p)}>{playing ? '⏸ Pause' : '▶️ Play'}</button>
      </div>
    </div>
  );
};

const LearningPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selected, setSelected] = useState<Dialogue | null>(null);
  const [activeTab, setActiveTab] = useState<'words' | 'culture'>('words');
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 영상 플레이어 */}
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-xl">
        🎬 영상 플레이어 (데모)
      </div>
      <VideoS />
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
      {selected && (
        <div className="p-4 bg-primary/5 rounded-xl shadow-md space-y-4">
          <h3 className="text-lg font-semibold">학습 카드</h3>
          <p>
            <strong>한국어:</strong> {selected.dialogue}
          </p>
          <p>
            <strong>영어:</strong> (자동 번역 자리)
          </p>
          <p>
            <strong>학습 포인트:</strong> {selected.category}
          </p>

          {/* 탭 메뉴 */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('words')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'words' ? 'bg-primary text-white' : 'bg-white text-gray-600 border'
              }`}
            >
              단어 설명
            </button>
            <button
              onClick={() => setActiveTab('culture')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'culture' ? 'bg-primary text-white' : 'bg-white text-gray-600 border'
              }`}
            >
              문화 노트
            </button>
          </div>

          {/* 탭 내용 */}
          {activeTab === 'words' ? (
            <WordExplanation words={selected.words} />
          ) : (
            <CultureNote note={selected.cultureNote} />
          )}

          <button
            onClick={() => setSelected(null)}
            className="mt-3 px-4 py-2 bg-primary text-white rounded-lg"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningPage;

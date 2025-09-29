// 난이도 enum
export type DifficultyLevel = '초급' | '중급' | '고급';

// 1. Study (학습 단위)
export interface Study {
  id: number;
  title: string;
  created_at: string; // ISO timestamp
  poster_image_url: string;
}

// 2. Subtitle (자막)
export interface Subtitle {
  id: number;
  study_id: number;
  korean_subtitle: string | null;
  pronunciation: string | null; // 발음 설명 (한국어/기타)
  english_subtitle: string | null; // 영어 번역
  subtitle_start_time: number | null; // 초 단위
  subtitle_end_time: number | null; // 초 단위
  level: DifficultyLevel | null; // 난이도
}

// 3. Video (영상 정보)
export interface Video {
  id: number;
  study_id: number;
  categories: string | null;
  contents: string | null;
  episode: number | null;
  scene: string | null;
  start_time: number | null; // 초 단위
  end_time: number | null; // 초 단위
  video_url: string | null;
  runtime: number | null; // 자동 계산된 러닝타임
}

// 4. Culture Note (문화포인트)
export interface CultureNote {
  id: number;
  study_id: number;
  title: string | null;
  subtitle: string | null;
  contents: string | null;
}

// 5. Word (단어장)
export interface Word {
  id: number;
  study_id: number;
  words: string | null; // 단어
  means: string | null; // 의미 (한/영 혼합)
  parts_of_speech: string | null; // 품사
  pronunciation: string | null; // 발음
  example: string | null; // 예문
}

// 6. Memo (사용자 메모)
export interface Memo {
  id: number;
  user_id: string; // UUID
  study_id: number;
  note: string | null;
  created_at: string; // ISO timestamp
}

// 7. Progress (학습 진도)
export interface Progress {
  id: number;
  user_id: string; // UUID
  study_id: number;
  completed_lessons: number;
  total_lessons: number;
  progress_rate: number; // 자동 계산된 진도율 (%)
  updated_at: string; // ISO timestamp
}

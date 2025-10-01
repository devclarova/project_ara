import type { Database } from './database';

// 난이도 enum
export type DifficultyLevel = '초급' | '중급' | '고급';

// 1. Study (학습 단위)
export interface Study {
  id: number;
  title: string;
  created_at: string; // ISO timestamp
  poster_image_url: string;
  short_description: string;
}

// 2. Subtitle (자막)
export interface Subtitle {
  english_subtitle: string | null;
  id: number;
  korean_subtitle: string | null;
  level: Database['public']['Enums']['difficulty_level'] | null;
  pronunciation: string | null;
  study_id: number | null;
  subtitle_end_time: number | null;
  subtitle_start_time: number | null;
}

// 3. Video (영상 정보)
export interface Video {
  categories: string | null;
  contents: string | null;
  episode: string | null;
  id: number;
  image_url: string | null;
  runtime: number | null;
  scene: string | null;
  study_id: number | null;
  video_end_time: number | null;
  video_start_time: number | null;
  video_url: string | null;
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
  example: string | null;
  id: number;
  means: string | null;
  parts_of_speech: string | null;
  pronunciation: string | null;
  study_id: number | null;
  words: string | null;
}

// 6. Memo (사용자 메모)
export interface Memo {
  created_at: string | null;
  id: number;
  note: string | null;
  study_id: number | null;
  user_id: string;
}

// 7. Progress (학습 진도)
export interface Progress {
  completed_lessons: number | null;
  id: number;
  progress_rate: number | null;
  study_id: number | null;
  total_lessons: number | null;
  updated_at: string | null;
  user_id: string;
}

// 이메일 복구를 위한 질문 목록 (다국어 지원)
export const RECOVERY_QUESTIONS = [
  'recovery.question_favorite_color',
  'recovery.question_pet_name',
  'recovery.question_birthplace',
  'recovery.question_first_school',
  'recovery.question_favorite_teacher',
  'recovery.question_childhood_nickname',
  'recovery.question_mothers_maiden',
  'recovery.question_favorite_food',
  'recovery.question_first_car',
  'recovery.question_favorite_movie',
  'recovery.question_parents_met_city',
] as const;

export type RecoveryQuestion = typeof RECOVERY_QUESTIONS[number];

// Recovery 정보 타입
export interface RecoveryInfo {
  question: RecoveryQuestion;
  answer: string;
  tempEmail?: string; // 선택 사항
}

export type Step = 1 | 2 | 3;

export type Verified = {
  email: { value: string; ok: boolean };
  nickname: { value: string; ok: boolean };
};

export type SignupKind = 'email' | 'social';
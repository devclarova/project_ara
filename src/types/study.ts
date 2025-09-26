export type CardDialogue = {
  character: string;
  timestamp: string;
  dialogue: string;
  category: string;
  words: { term: string; meaning: string; example?: string }[];
  cultureNote: string;
};

export interface Dialogues {
  dialogue: string; // 대사
  pronunciation: string; // 발음
  english: string; // 영어 자막
  character: string; // 등장인물
  start: string; // 특정 자막 시작 시간
  end: string; // 특정 자막 종료 시간
  timestamp: string;
  category: string;
  words: { term: string; meaning: string; example?: string }[];
  cultureNote: string;
}

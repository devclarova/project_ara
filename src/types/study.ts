export type Dialogue = {
  character: string;
  timestamp: string;
  dialogue: string;
  category: string;
  words: { term: string; meaning: string; example?: string }[];
  cultureNote: string;
};

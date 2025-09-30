import { supabase } from '../lib/supabase';
import type { Dialogues } from '../types/database';

type Clip = {
  id: number;
};

type Tts = {
  id: number;
  start: string;
  end: string;
};

// Clip 목록 조회
export const getClips = async (): Promise<Clip[]> => {
  const { data, error } = await supabase.from('clip').select('*').order('id', { ascending: false });
  // 실행은 되었지만, 결과가 오류이다.
  if (error) {
    throw new Error(`getClips 오류 : ${error.message}`);
  }
  return data || [];
};

// Dialogue 목록 조회
export const getDialogues = async (): Promise<Dialogues[]> => {
  const { data, error } = await supabase
    .from('dialogues')
    .select('*')
    .order('id', { ascending: false });
  // 실행은 되었지만, 결과가 오류이다.
  if (error) {
    throw new Error(`getClips 오류 : ${error.message}`);
  }
  return data || [];
};

export const getTts = async (): Promise<Tts[]> => {
  const { data, error } = await supabase
    .from('temptts')
    .select('*')
    .order('id', { ascending: false });
  // 실행은 되었지만, 결과가 오류이다.
  if (error) {
    throw new Error(`getClips 오류 : ${error.message}`);
  }
  return data || [];
};

// 디테일 부분 id 가져오기
// services/ClipService.ts
export async function getTtsById(id: number) {
  const { data, error } = await supabase.from('tts').select('*').eq('id', id).single();

  if (error) throw error;
  return data;
}

import { supabase } from '../lib/supabase';
import type { Clip, Dialogues, Tts } from '../types/database';

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

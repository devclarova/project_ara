/**
 * 클라우드 스토리지 인터페이스 핸들러(Cloud Storage Interface Handler):
 * - 목적(Why): 프로필 이미지 및 미디어 자산의 업로드 프로토콜을 정의하며, CDN 캐시 무효화 및 공용 URL 생성을 담당함
 * - 방법(How): Supabase Storage 정책과의 정합성 유지를 위한 경로 직렬화를 수행함
 */
import { supabase } from '../lib/supabase';

export async function uploadProfileImage(file: File, userId: string) {
  const ext = file.name.split('.').pop();
  const filePath = `profiles/${userId}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('profiles')
    .upload(filePath, file, { upsert: true });

  if (uploadErr) throw uploadErr;

  const { data } = supabase.storage.from('dream-images').getPublicUrl(filePath);

  const publicUrl = data.publicUrl;
}

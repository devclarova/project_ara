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

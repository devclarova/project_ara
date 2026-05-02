import { supabase } from './src/lib/supabase';

async function test() {
  const { data } = await supabase.from('tts_cache').select('*').maybeSingle();
  console.log(data?.text_key);
}

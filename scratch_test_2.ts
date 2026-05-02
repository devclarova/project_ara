import { supabase } from './src/lib/supabase';

async function test() {
  const query = supabase.from('tts_cache');
  // @ts-expect-error - check type
  type T = typeof query;
}

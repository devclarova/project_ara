import { supabase } from './src/lib/supabase';
import type { DatabaseWithRPC } from './src/types/supabase-augment';

async function test() {
  const x = supabase.from('feedback');
  const y = supabase.from('site_config');
  // intentional type error to see inferred types:
  const z: 'test' = x;
  const w: 'test' = y;
}

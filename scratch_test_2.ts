import { supabase } from './src/lib/supabase';
import type { DatabaseWithRPC } from './src/types/supabase-augment';

type Tables = DatabaseWithRPC['public']['Tables'];
type FeedbackTable = Tables['feedback'];

async function test() {
  const x = supabase.from('feedback');
  console.log(x);
}

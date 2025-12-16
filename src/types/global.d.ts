import { RealtimeChannel } from '@supabase/supabase-js';

declare global {
  interface Window {
    // TweetDetail.tsx specific channels
    _replyInsertChannel?: RealtimeChannel | null;
    _replyDeleteChannel?: RealtimeChannel | null;
  }
}

export {};

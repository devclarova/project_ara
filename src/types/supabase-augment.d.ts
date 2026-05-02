import type { Database as BaseDB } from './database';

type Merge<T, U> = Omit<T, keyof U> & U;

/**
 * Augmented Tables
 */
type AugmentedTables = {
  site_config: {
    Row: {
      id: number;
      notice_enabled: boolean;
      notice_text: string | null;
      notice_color: 'blue' | 'red' | 'amber' | 'emerald' | null;
      maintenance_enabled: boolean;
      maintenance_message: string | null;
      maintenance_end_time: string | null;
      site_title: string;
      site_description: string | null;
      site_logo_url: string | null;
      sec_ip_restriction: boolean;
      sec_ip_whitelist: string[];
      updated_at: string;
      toast_sound_url: string | null;
    };
    Insert: {
      id?: number;
      notice_enabled?: boolean;
      notice_text?: string | null;
      notice_color?: 'blue' | 'red' | 'amber' | 'emerald' | null;
      maintenance_enabled?: boolean;
      maintenance_message?: string | null;
      maintenance_end_time?: string | null;
      site_title?: string;
      site_description?: string | null;
      site_logo_url?: string | null;
      sec_ip_restriction?: boolean;
      sec_ip_whitelist?: string[];
      updated_at?: string;
      toast_sound_url?: string | null;
    };
    Update: {
      id?: number;
      notice_enabled?: boolean;
      notice_text?: string | null;
      notice_color?: 'blue' | 'red' | 'amber' | 'emerald' | null;
      maintenance_enabled?: boolean;
      maintenance_message?: string | null;
      maintenance_end_time?: string | null;
      site_title?: string;
      site_description?: string | null;
      site_logo_url?: string | null;
      sec_ip_restriction?: boolean;
      sec_ip_whitelist?: string[];
      updated_at?: string;
      toast_sound_url?: string | null;
    };
    Relationships: [];
  };
  direct_chats: {
    Row: BaseDB['public']['Tables']['direct_chats']['Row'] & {
      user_pair_low: string | null;
      user_pair_high: string | null;
    };
    Insert: BaseDB['public']['Tables']['direct_chats']['Insert'] & {
      user_pair_low?: string | null;
      user_pair_high?: string | null;
    };
    Update: BaseDB['public']['Tables']['direct_chats']['Update'] & {
      user_pair_low?: string | null;
      user_pair_high?: string | null;
    };
    Relationships: BaseDB['public']['Tables']['direct_chats']['Relationships'];
  };
  // missing tables in generated types but used in code
  reports: {
    Row: {
      id: string;
      reporter_id: string;
      reported_id: string;
      reason: string;
      reported_message_ids: string[];
      report_context_url: string | null;
      created_at: string;
      status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
      admin_note: string | null;
      updated_at: string;
    };
    Insert: {
      id?: string;
      reporter_id: string;
      reported_id: string;
      reason: string;
      reported_message_ids?: string[];
      report_context_url?: string | null;
      created_at?: string;
      status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
      admin_note?: string | null;
      updated_at?: string;
    };
    Update: {
      id?: string;
      reporter_id?: string;
      reported_id?: string;
      reason?: string;
      reported_message_ids?: string[];
      report_context_url?: string | null;
      created_at?: string;
      status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
      admin_note?: string | null;
      updated_at?: string;
    };
    Relationships: [];
  };
};

export type DatabaseWithRPC = {
  [K in keyof BaseDB]: K extends 'public'
    ? {
        [P in keyof BaseDB['public']]: P extends 'Tables'
          ? Merge<BaseDB['public']['Tables'], AugmentedTables>
          : BaseDB['public'][P]
      }
    : BaseDB[K]
};

export type Database = BaseDB;

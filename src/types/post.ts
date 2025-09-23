import type { Database } from './database';

export type Post = Database['public']['Tables']['posts']['Row'];
export type PostInsert = Database['public']['Tables']['posts']['Insert'] & {
  user_id?: number;
  category?: string | null;
  comments?: number | null;
  content?: string | null;
  created_at?: string | null;
  like?: number | null;
  title?: string | null;
  unlike?: number | null;
  updated_at?: string | null;
  view?: number | null;
};
export type PostUpdate = Database['public']['Tables']['posts']['Update'];

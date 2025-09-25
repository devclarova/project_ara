import type { Database } from './database';

export type Post = Database['public']['Tables']['posts']['Row'];
export type PostInsert = Database['public']['Tables']['posts']['Insert'] & {
  category: Database['public']['Enums']['category_type'];
  comments?: number | null;
  content: string;
  created_at?: string;
  id?: number;
  like?: number;
  title: string;
  unlike?: number;
  updated_at?: string | null;
  user_id: number;
  view?: number;
};
export type PostUpdate = Database['public']['Tables']['posts']['Update'];

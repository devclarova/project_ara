export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4';
  };
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      banned_words: {
        Row: {
          id: number;
          is_regex: boolean;
          lang_code: string;
          pattern: string;
        };
        Insert: {
          id?: number;
          is_regex?: boolean;
          lang_code: string;
          pattern: string;
        };
        Update: {
          id?: number;
          is_regex?: boolean;
          lang_code?: string;
          pattern?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: number;
          name: Database['public']['Enums']['category_type'];
        };
        Insert: {
          created_at?: string;
          id?: number;
          name: Database['public']['Enums']['category_type'];
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: Database['public']['Enums']['category_type'];
        };
        Relationships: [];
      };
      chat_user_state: {
        Row: {
          chat_id: string;
          is_archived: boolean;
          is_pinned: boolean;
          left_at: string | null;
          muted_until: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          chat_id: string;
          is_archived?: boolean;
          is_pinned?: boolean;
          left_at?: string | null;
          muted_until?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          chat_id?: string;
          is_archived?: boolean;
          is_pinned?: boolean;
          left_at?: string | null;
          muted_until?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_user_state_chat_id_fkey';
            columns: ['chat_id'];
            isOneToOne: false;
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_user_state_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      chats: {
        Row: {
          created_at: string;
          id: string;
          lastmessage: string | null;
          user1_id: string;
          user2_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          lastmessage?: string | null;
          user1_id: string;
          user2_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          lastmessage?: string | null;
          user1_id?: string;
          user2_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chats_user1_id_fkey';
            columns: ['user1_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chats_user2_id_fkey';
            columns: ['user2_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      countries: {
        Row: {
          flag: string | null;
          flag_url: string | null;
          id: number;
          iso_code: string | null;
          name: string;
          phone_code: number;
        };
        Insert: {
          flag?: string | null;
          flag_url?: string | null;
          id?: number;
          iso_code?: string | null;
          name: string;
          phone_code: number;
        };
        Update: {
          flag?: string | null;
          flag_url?: string | null;
          id?: number;
          iso_code?: string | null;
          name?: string;
          phone_code?: number;
        };
        Relationships: [];
      };
      creditcard: {
        Row: {
          company: string | null;
          cvc: string | null;
          date: string | null;
          id: number;
          number: string | null;
          user_id: string | null;
        };
        Insert: {
          company?: string | null;
          cvc?: string | null;
          date?: string | null;
          id?: number;
          number?: string | null;
          user_id?: string | null;
        };
        Update: {
          company?: string | null;
          cvc?: string | null;
          date?: string | null;
          id?: number;
          number?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      culture_note: {
        Row: {
          contents: string | null;
          id: number;
          study_id: number | null;
          subtitle: string | null;
          title: string | null;
        };
        Insert: {
          contents?: string | null;
          id?: never;
          study_id?: number | null;
          subtitle?: string | null;
          title?: string | null;
        };
        Update: {
          contents?: string | null;
          id?: never;
          study_id?: number | null;
          subtitle?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'culture_note_study_id_fkey';
            columns: ['study_id'];
            isOneToOne: false;
            referencedRelation: 'study';
            referencedColumns: ['id'];
          },
        ];
      };
      culture_note_contents: {
        Row: {
          content_value: string | null;
          culture_note_id: number | null;
          id: number;
          study_id: number | null;
        };
        Insert: {
          content_value?: string | null;
          culture_note_id?: number | null;
          id?: number;
          study_id?: number | null;
        };
        Update: {
          content_value?: string | null;
          culture_note_id?: number | null;
          id?: number;
          study_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'culture_note_contents_culture_note_id_fkey';
            columns: ['culture_note_id'];
            isOneToOne: false;
            referencedRelation: 'culture_note';
            referencedColumns: ['id'];
          },
        ];
      };
      dialogues: {
        Row: {
          culture_note: string | null;
          dialogue: string | null;
          english: string | null;
          id: number;
          timeline: string | null;
        };
        Insert: {
          culture_note?: string | null;
          dialogue?: string | null;
          english?: string | null;
          id: number;
          timeline?: string | null;
        };
        Update: {
          culture_note?: string | null;
          dialogue?: string | null;
          english?: string | null;
          id?: number;
          timeline?: string | null;
        };
        Relationships: [];
      };
      memo: {
        Row: {
          created_at: string | null;
          id: number;
          note: string | null;
          study_id: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: never;
          note?: string | null;
          study_id?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: never;
          note?: string | null;
          study_id?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memo_study_id_fkey';
            columns: ['study_id'];
            isOneToOne: false;
            referencedRelation: 'study';
            referencedColumns: ['id'];
          },
        ];
      };
      message_files: {
        Row: {
          created_at: string;
          file_name: string | null;
          file_size: number | null;
          file_type: string | null;
          file_url: string;
          id: string;
          message_id: string;
        };
        Insert: {
          created_at?: string;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          file_url: string;
          id?: string;
          message_id: string;
        };
        Update: {
          created_at?: string;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          file_url?: string;
          id?: string;
          message_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'message_files_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
      };
      message_receipts: {
        Row: {
          message_id: string;
          read_at: string;
          user_id: string;
        };
        Insert: {
          message_id: string;
          read_at?: string;
          user_id: string;
        };
        Update: {
          message_id?: string;
          read_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'message_receipts_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_receipts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          auth_id: string;
          chat_id: string;
          content: string | null;
          content_tsv: unknown;
          created_at: string;
          id: string;
          sender_id: string;
          translated_lang: string | null;
          translated_text: string | null;
          type: string;
        };
        Insert: {
          auth_id: string;
          chat_id: string;
          content?: string | null;
          content_tsv?: unknown;
          created_at?: string;
          id?: string;
          sender_id: string;
          translated_lang?: string | null;
          translated_text?: string | null;
          type?: string;
        };
        Update: {
          auth_id?: string;
          chat_id?: string;
          content?: string | null;
          content_tsv?: unknown;
          created_at?: string;
          id?: string;
          sender_id?: string;
          translated_lang?: string | null;
          translated_text?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_chat_id_fkey';
            columns: ['chat_id'];
            isOneToOne: false;
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      post_dislikes: {
        Row: {
          created_at: string;
          post_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_dislikes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      post_likes: {
        Row: {
          created_at: string;
          post_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      posts: {
        Row: {
          category: Database['public']['Enums']['category_type'];
          comments: number | null;
          content: string;
          created_at: string;
          id: number;
          like: number;
          title: string;
          unlike: number;
          updated_at: string | null;
          user_id: string | null;
          view: number;
        };
        Insert: {
          category: Database['public']['Enums']['category_type'];
          comments?: number | null;
          content: string;
          created_at?: string;
          id?: number;
          like?: number;
          title: string;
          unlike?: number;
          updated_at?: string | null;
          user_id?: string | null;
          view?: number;
        };
        Update: {
          category?: Database['public']['Enums']['category_type'];
          comments?: number | null;
          content?: string;
          created_at?: string;
          id?: number;
          like?: number;
          title?: string;
          unlike?: number;
          updated_at?: string | null;
          user_id?: string | null;
          view?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          birthday: string;
          country: string;
          created_at: string;
          gender: Database['public']['Enums']['gender_enum'];
          id: string;
          is_online: boolean;
          last_active_at: string | null;
          nickname: string;
          nickname_lang: Database['public']['Enums']['nickname_lang_enum'] | null;
          nickname_normalized: string | null;
          nickname_script: string | null;
          nickname_set_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          birthday?: string;
          country?: string;
          created_at?: string;
          gender: Database['public']['Enums']['gender_enum'];
          id?: string;
          is_online?: boolean;
          last_active_at?: string | null;
          nickname: string;
          nickname_lang?: Database['public']['Enums']['nickname_lang_enum'] | null;
          nickname_normalized?: string | null;
          nickname_script?: string | null;
          nickname_set_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          birthday?: string;
          country?: string;
          created_at?: string;
          gender?: Database['public']['Enums']['gender_enum'];
          id?: string;
          is_online?: boolean;
          last_active_at?: string | null;
          nickname?: string;
          nickname_lang?: Database['public']['Enums']['nickname_lang_enum'] | null;
          nickname_normalized?: string | null;
          nickname_script?: string | null;
          nickname_set_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      progress: {
        Row: {
          completed_lessons: number | null;
          id: number;
          progress_rate: number | null;
          study_id: number | null;
          total_lessons: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_lessons?: number | null;
          id?: never;
          progress_rate?: number | null;
          study_id?: number | null;
          total_lessons?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_lessons?: number | null;
          id?: never;
          progress_rate?: number | null;
          study_id?: number | null;
          total_lessons?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'progress_study_id_fkey';
            columns: ['study_id'];
            isOneToOne: false;
            referencedRelation: 'study';
            referencedColumns: ['id'];
          },
        ];
      };
      reserved_words: {
        Row: {
          id: number;
          lang: Database['public']['Enums']['nickname_lang_enum'] | null;
          lang_code: string;
          reason: string | null;
          word: string;
          word_normalized: string | null;
        };
        Insert: {
          id?: number;
          lang?: Database['public']['Enums']['nickname_lang_enum'] | null;
          lang_code: string;
          reason?: string | null;
          word: string;
          word_normalized?: string | null;
        };
        Update: {
          id?: number;
          lang?: Database['public']['Enums']['nickname_lang_enum'] | null;
          lang_code?: string;
          reason?: string | null;
          word?: string;
          word_normalized?: string | null;
        };
        Relationships: [];
      };
      restricted_words: {
        Row: {
          id: number;
          is_strict: boolean;
          lang: Database['public']['Enums']['nickname_lang_enum'] | null;
          note: string | null;
          pattern: string;
        };
        Insert: {
          id?: number;
          is_strict?: boolean;
          lang?: Database['public']['Enums']['nickname_lang_enum'] | null;
          note?: string | null;
          pattern: string;
        };
        Update: {
          id?: number;
          is_strict?: boolean;
          lang?: Database['public']['Enums']['nickname_lang_enum'] | null;
          note?: string | null;
          pattern?: string;
        };
        Relationships: [];
      };
      saves: {
        Row: {
          created_at: string | null;
          id: number;
          study_id: number;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          study_id: number;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          study_id?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };
      study: {
        Row: {
          created_at: string | null;
          id: number;
          poster_image_url: string | null;
          short_description: string | null;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          id?: never;
          poster_image_url?: string | null;
          short_description?: string | null;
          title: string;
        };
        Update: {
          created_at?: string | null;
          id?: never;
          poster_image_url?: string | null;
          short_description?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      subtitle: {
        Row: {
          english_subtitle: string | null;
          id: number;
          korean_subtitle: string | null;
          level: Database['public']['Enums']['difficulty_level'] | null;
          pronunciation: string | null;
          study_id: number | null;
          subtitle_end_time: number | null;
          subtitle_start_time: number | null;
        };
        Insert: {
          english_subtitle?: string | null;
          id?: never;
          korean_subtitle?: string | null;
          level?: Database['public']['Enums']['difficulty_level'] | null;
          pronunciation?: string | null;
          study_id?: number | null;
          subtitle_end_time?: number | null;
          subtitle_start_time?: number | null;
        };
        Update: {
          english_subtitle?: string | null;
          id?: never;
          korean_subtitle?: string | null;
          level?: Database['public']['Enums']['difficulty_level'] | null;
          pronunciation?: string | null;
          study_id?: number | null;
          subtitle_end_time?: number | null;
          subtitle_start_time?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'subtitle_study_id_fkey';
            columns: ['study_id'];
            isOneToOne: false;
            referencedRelation: 'study';
            referencedColumns: ['id'];
          },
        ];
      };
      tweet_replies: {
        Row: {
          author_id: string;
          content: string;
          created_at: string | null;
          id: string;
          like_count: number | null;
          repost_count: number | null;
          tweet_id: string;
        };
        Insert: {
          author_id: string;
          content: string;
          created_at?: string | null;
          id?: string;
          like_count?: number | null;
          repost_count?: number | null;
          tweet_id: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string | null;
          id?: string;
          like_count?: number | null;
          repost_count?: number | null;
          tweet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tweet_replies_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tweet_replies_tweet_id_fkey';
            columns: ['tweet_id'];
            isOneToOne: false;
            referencedRelation: 'tweets';
            referencedColumns: ['id'];
          },
        ];
      };
      tweets: {
        Row: {
          author_id: string;
          bookmark_count: number | null;
          content: string;
          created_at: string | null;
          id: string;
          image_url: string | null;
          like_count: number | null;
          repost_count: number | null;
        };
        Insert: {
          author_id: string;
          bookmark_count?: number | null;
          content: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          like_count?: number | null;
          repost_count?: number | null;
        };
        Update: {
          author_id?: string;
          bookmark_count?: number | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          like_count?: number | null;
          repost_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tweets_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
          ended_at: string | null;
          id: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_blocks_blocked_id_fkey';
            columns: ['blocked_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_blocks_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_reports: {
        Row: {
          created_at: string;
          id: string;
          reason: string | null;
          reported_id: string;
          reporter_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          reason?: string | null;
          reported_id: string;
          reporter_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          reason?: string | null;
          reported_id?: string;
          reporter_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_reports_reported_id_fkey';
            columns: ['reported_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          auth_user_id: string;
          created_at: string;
          email: string;
          id: number;
          last_login: string;
          password: string | null;
        };
        Insert: {
          auth_user_id: string;
          created_at?: string;
          email: string;
          id?: number;
          last_login?: string;
          password?: string | null;
        };
        Update: {
          auth_user_id?: string;
          created_at?: string;
          email?: string;
          id?: number;
          last_login?: string;
          password?: string | null;
        };
        Relationships: [];
      };
      users_posts_comments: {
        Row: {
          comments: string | null;
          created_at: string | null;
          id: number;
          posts_id: number;
          updated_at: string | null;
          users_id: string | null;
        };
        Insert: {
          comments?: string | null;
          created_at?: string | null;
          id?: number;
          posts_id: number;
          updated_at?: string | null;
          users_id?: string | null;
        };
        Update: {
          comments?: string | null;
          created_at?: string | null;
          id?: number;
          posts_id?: number;
          updated_at?: string | null;
          users_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'users_posts_comments_posts_id_fkey';
            columns: ['posts_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      users_study_review: {
        Row: {
          content: string | null;
          created_at: string | null;
          id: number;
          study_id: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string | null;
          id: number;
          study_id: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string | null;
          id?: number;
          study_id?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      video: {
        Row: {
          categories: Database['public']['Enums']['category_enum'] | null;
          contents: string | null;
          episode: string | null;
          id: number;
          image_url: string | null;
          level: Database['public']['Enums']['level_enum'] | null;
          runtime: number | null;
          scene: string | null;
          study_id: number | null;
          video_end_time: number | null;
          video_start_time: number | null;
          video_url: string | null;
        };
        Insert: {
          categories?: Database['public']['Enums']['category_enum'] | null;
          contents?: string | null;
          episode?: string | null;
          id?: never;
          image_url?: string | null;
          level?: Database['public']['Enums']['level_enum'] | null;
          runtime?: number | null;
          scene?: string | null;
          study_id?: number | null;
          video_end_time?: number | null;
          video_start_time?: number | null;
          video_url?: string | null;
        };
        Update: {
          categories?: Database['public']['Enums']['category_enum'] | null;
          contents?: string | null;
          episode?: string | null;
          id?: never;
          image_url?: string | null;
          level?: Database['public']['Enums']['level_enum'] | null;
          runtime?: number | null;
          scene?: string | null;
          study_id?: number | null;
          video_end_time?: number | null;
          video_start_time?: number | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'video_study_id_fkey';
            columns: ['study_id'];
            isOneToOne: false;
            referencedRelation: 'study';
            referencedColumns: ['id'];
          },
        ];
      };
      word: {
        Row: {
          example: string | null;
          id: number;
          means: string | null;
          parts_of_speech: string | null;
          pronunciation: string | null;
          study_id: number | null;
          words: string | null;
        };
        Insert: {
          example?: string | null;
          id?: never;
          means?: string | null;
          parts_of_speech?: string | null;
          pronunciation?: string | null;
          study_id?: number | null;
          words?: string | null;
        };
        Update: {
          example?: string | null;
          id?: never;
          means?: string | null;
          parts_of_speech?: string | null;
          pronunciation?: string | null;
          study_id?: number | null;
          words?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'word_study_id_fkey';
            columns: ['study_id'];
            isOneToOne: false;
            referencedRelation: 'study';
            referencedColumns: ['id'];
          },
        ];
      };
      words: {
        Row: {
          completed: boolean | null;
          created_at: string | null;
          example: string | null;
          explain: string | null;
          id: number;
          study_id: number;
          user_id: string | null;
        };
        Insert: {
          completed?: boolean | null;
          created_at?: string | null;
          example?: string | null;
          explain?: string | null;
          id: number;
          study_id: number;
          user_id?: string | null;
        };
        Update: {
          completed?: boolean | null;
          created_at?: string | null;
          example?: string | null;
          explain?: string | null;
          id?: number;
          study_id?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      post_like_counts: {
        Row: {
          likes: number | null;
          post_id: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'post_likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      email_exists: { Args: { _email: string }; Returns: boolean };
      ensure_profile: { Args: never; Returns: undefined };
      fn_normalize_nickname: { Args: { nick: string }; Returns: string };
      hhmmss_to_seconds: { Args: { t: string }; Returns: number };
      is_admin: { Args: never; Returns: boolean };
      load_wordlists: {
        Args: { _reserved?: Json; _restricted?: Json };
        Returns: undefined;
      };
      nickname_exists:
        | {
            Args: {
              _lang: Database['public']['Enums']['nickname_lang_enum'];
              _nickname: string;
            };
            Returns: boolean;
          }
        | { Args: { _nickname: string }; Returns: boolean };
      set_nickname: {
        Args: {
          p_lang: Database['public']['Enums']['nickname_lang_enum'];
          p_nick: string;
        };
        Returns: undefined;
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      unaccent: { Args: { '': string }; Returns: string };
      unaccent_immutable: { Args: { txt: string }; Returns: string };
      validate_nickname_policy: {
        Args: {
          in_lang: Database['public']['Enums']['nickname_lang_enum'];
          in_nick: string;
        };
        Returns: string;
      };
    };
    Enums: {
      category_enum: '영화' | '드라마' | '예능' | '음악';
      category_type: 'Notice' | 'Reviews' | 'Q&A' | 'Study tips' | 'Communication';
      difficulty_level: '초급' | '중급' | '고급';
      gender_enum: 'Male' | 'Female';
      level_enum: '초급' | '중급' | '고급';
      nickname_lang_enum:
        | 'ko'
        | 'en'
        | 'ja'
        | 'zh'
        | 'ru'
        | 'vi'
        | 'bn'
        | 'ar'
        | 'hi'
        | 'th'
        | 'es'
        | 'fr'
        | 'pt'
        | 'pt-br';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      category_enum: ['영화', '드라마', '예능', '음악'],
      category_type: ['Notice', 'Reviews', 'Q&A', 'Study tips', 'Communication'],
      difficulty_level: ['초급', '중급', '고급'],
      gender_enum: ['Male', 'Female'],
      level_enum: ['초급', '중급', '고급'],
      nickname_lang_enum: [
        'ko',
        'en',
        'ja',
        'zh',
        'ru',
        'vi',
        'bn',
        'ar',
        'hi',
        'th',
        'es',
        'fr',
        'pt',
        'pt-br',
      ],
    },
  },
} as const;

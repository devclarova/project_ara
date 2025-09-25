export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4';
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: number;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      clip: {
        Row: {
          created_at: string;
          dialogue: string;
          difficulty_level: number | null;
          end_time: string;
          episode: number | null;
          id: number;
          runtime: number | null;
          start_time: string;
          study_id: number;
          title: string;
        };
        Insert: {
          created_at?: string;
          dialogue: string;
          difficulty_level?: number | null;
          end_time: string;
          episode?: number | null;
          id?: number;
          runtime?: number | null;
          start_time: string;
          study_id: number;
          title: string;
        };
        Update: {
          created_at?: string;
          dialogue?: string;
          difficulty_level?: number | null;
          end_time?: string;
          episode?: number | null;
          id?: number;
          runtime?: number | null;
          start_time?: string;
          study_id?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clip_study_id_fkey';
            columns: ['study_id'];
            isOneToOne: false;
            referencedRelation: 'study';
            referencedColumns: ['id'];
          },
        ];
      };
      clip_words: {
        Row: {
          clip_id: number;
          created_at: string | null;
          id: number;
          mean: string | null;
          parts_of_speech: string | null;
          pronunciation: string | null;
          study_id: number;
          updated_at: string | null;
          word: string;
          words_id: number;
        };
        Insert: {
          clip_id: number;
          created_at?: string | null;
          id?: number;
          mean?: string | null;
          parts_of_speech?: string | null;
          pronunciation?: string | null;
          study_id: number;
          updated_at?: string | null;
          word: string;
          words_id: number;
        };
        Update: {
          clip_id?: number;
          created_at?: string | null;
          id?: number;
          mean?: string | null;
          parts_of_speech?: string | null;
          pronunciation?: string | null;
          study_id?: number;
          updated_at?: string | null;
          word?: string;
          words_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_clip_words_clip';
            columns: ['clip_id'];
            isOneToOne: false;
            referencedRelation: 'clip';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_clip_words_study';
            columns: ['study_id'];
            isOneToOne: false;
            referencedRelation: 'study';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_clip_words_words';
            columns: ['words_id'];
            isOneToOne: false;
            referencedRelation: 'words';
            referencedColumns: ['id'];
          },
        ];
      };
      countries: {
        Row: {
          id: number;
          name: string;
          phone_code: number;
        };
        Insert: {
          id?: number;
          name: string;
          phone_code: number;
        };
        Update: {
          id?: number;
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
          user_id: number | null;
        };
        Insert: {
          company?: string | null;
          cvc?: string | null;
          date?: string | null;
          id?: number;
          number?: string | null;
          user_id?: number | null;
        };
        Update: {
          company?: string | null;
          cvc?: string | null;
          date?: string | null;
          id?: number;
          number?: string | null;
          user_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
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
      posts: {
        Row: {
          category: Database["public"]["Enums"]["category_type"]
          comments: number | null
          content: string
          created_at: string
          id: number
          like: number
          title: string
          unlike: number
          updated_at: string | null
          user_id: number
          view: number
        }
        Insert: {
          category: Database["public"]["Enums"]["category_type"]
          comments?: number | null
          content: string
          created_at?: string
          id?: number
          like?: number
          title: string
          unlike?: number
          updated_at?: string | null
          user_id: number
          view?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["category_type"]
          comments?: number | null
          content?: string
          created_at?: string
          id?: number
          like?: number
          title?: string
          unlike?: number
          updated_at?: string | null
          user_id?: number
          view?: number
        }
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      saves: {
        Row: {
          created_at: string | null;
          id: number;
          study_id: number;
          user_id: number;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          study_id: number;
          user_id: number;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          study_id?: number;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_saves_study';
            columns: ['study_id'];
            isOneToOne: false;
            referencedRelation: 'study';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_saves_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      study: {
        Row: {
          categories_id: number | null;
          created_at: string;
          explain: string | null;
          id: number;
          note: string | null;
          save: boolean | null;
          user_id: number;
          view: number | null;
        };
        Insert: {
          categories_id?: number | null;
          created_at?: string;
          explain?: string | null;
          id?: number;
          note?: string | null;
          save?: boolean | null;
          user_id: number;
          view?: number | null;
        };
        Update: {
          categories_id?: number | null;
          created_at?: string;
          explain?: string | null;
          id?: number;
          note?: string | null;
          save?: boolean | null;
          user_id?: number;
          view?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'study_categories_id_fkey';
            columns: ['categories_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'study_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ]
      }
      study_progress: {
        Row: {
          created_at: string | null
          episode: string
          id: number
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          episode: string
          id?: number
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          episode?: string
          id?: number
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      temptts: {
        Row: {
          culture_note: string | null
          dialogue: string | null
          end: string
          english: string | null
          id: number
          imgUrl: string | null
          src: string | null
          start: string
        }
        Insert: {
          culture_note?: string | null
          dialogue?: string | null
          end: string
          english?: string | null
          id: number
          imgUrl?: string | null
          src?: string | null
          start: string
        }
        Update: {
          culture_note?: string | null
          dialogue?: string | null
          end?: string
          english?: string | null
          id?: number
          imgUrl?: string | null
          src?: string | null
          start?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null;
          birth: string;
          created_at: string;
          email: string;
          gender: Database['public']['Enums']['gender_enum'] | null;
          id: number;
          nationality: string | null;
          nickname: string;
          password: string;
        };
        Insert: {
          avatar_url?: string | null;
          birth: string;
          created_at?: string;
          email?: string;
          gender?: Database['public']['Enums']['gender_enum'] | null;
          id?: number;
          nationality?: string | null;
          nickname?: string;
          password?: string;
        };
        Update: {
          avatar_url?: string | null;
          birth?: string;
          created_at?: string;
          email?: string;
          gender?: Database['public']['Enums']['gender_enum'] | null;
          id?: number;
          nationality?: string | null;
          nickname?: string;
          password?: string;
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
          users_id: number;
        };
        Insert: {
          comments?: string | null;
          created_at?: string | null;
          id?: number;
          posts_id: number;
          updated_at?: string | null;
          users_id: number;
        };
        Update: {
          comments?: string | null;
          created_at?: string | null;
          id?: number;
          posts_id?: number;
          updated_at?: string | null;
          users_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'users_posts_comments_posts_id_fkey';
            columns: ['posts_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_posts_comments_users_id_fkey';
            columns: ['users_id'];
            isOneToOne: false;
            referencedRelation: 'users';
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
          user_id: number;
        };
        Insert: {
          content?: string | null;
          created_at?: string | null;
          id: number;
          study_id: number;
          updated_at?: string | null;
          user_id: number;
        };
        Update: {
          content?: string | null;
          created_at?: string | null;
          id?: number;
          study_id?: number;
          updated_at?: string | null;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'users_study_review_study_id_fkey';
            columns: ['study_id'];
            isOneToOne: false;
            referencedRelation: 'study';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_study_review_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
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
          user_id: number;
        };
        Insert: {
          completed?: boolean | null;
          created_at?: string | null;
          example?: string | null;
          explain?: string | null;
          id: number;
          study_id: number;
          user_id: number;
        };
        Update: {
          completed?: boolean | null;
          created_at?: string | null;
          example?: string | null;
          explain?: string | null;
          id?: number;
          study_id?: number;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'words_study_id_fkey';
            columns: ['study_id'];
            isOneToOne: false;
            referencedRelation: 'study';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'words_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      category_type:
        | "Notice"
        | "Reviews"
        | "Q&A"
        | "Study tips"
        | "Communication"
      gender_enum: "남" | "여"
    }
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
      category_type: [
        "Notice",
        "Reviews",
        "Q&A",
        "Study tips",
        "Communication",
      ],
      gender_enum: ["남", "여"],
    },
  },
} as const;

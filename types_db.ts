export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: number
          name: Database["public"]["Enums"]["category_type"]
        }
        Insert: {
          created_at?: string
          id?: number
          name: Database["public"]["Enums"]["category_type"]
        }
        Update: {
          created_at?: string
          id?: number
          name?: Database["public"]["Enums"]["category_type"]
        }
        Relationships: []
      }
      countries: {
        Row: {
          flag: string | null
          flag_url: string | null
          id: number
          iso_code: string | null
          name: string
          phone_code: number
        }
        Insert: {
          flag?: string | null
          flag_url?: string | null
          id?: number
          iso_code?: string | null
          name: string
          phone_code: number
        }
        Update: {
          flag?: string | null
          flag_url?: string | null
          id?: number
          iso_code?: string | null
          name?: string
          phone_code?: number
        }
        Relationships: []
      }
      creditcard: {
        Row: {
          company: string | null
          cvc: string | null
          date: string | null
          id: number
          number: string | null
          user_id: number | null
        }
        Insert: {
          company?: string | null
          cvc?: string | null
          date?: string | null
          id?: number
          number?: string | null
          user_id?: number | null
        }
        Update: {
          company?: string | null
          cvc?: string | null
          date?: string | null
          id?: number
          number?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_note: {
        Row: {
          contents: string | null
          id: number
          study_id: number | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          contents?: string | null
          id?: never
          study_id?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          contents?: string | null
          id?: never
          study_id?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "culture_note_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "study"
            referencedColumns: ["id"]
          },
        ]
      }
      dialogues: {
        Row: {
          culture_note: string | null
          dialogue: string | null
          english: string | null
          id: number
          timeline: string | null
        }
        Insert: {
          culture_note?: string | null
          dialogue?: string | null
          english?: string | null
          id: number
          timeline?: string | null
        }
        Update: {
          culture_note?: string | null
          dialogue?: string | null
          english?: string | null
          id?: number
          timeline?: string | null
        }
        Relationships: []
      }
      memo: {
        Row: {
          created_at: string | null
          id: number
          note: string | null
          study_id: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          note?: string | null
          study_id?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          note?: string | null
          study_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memo_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "study"
            referencedColumns: ["id"]
          },
        ]
      }
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
          user_id: number | null
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
          user_id?: number | null
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
          user_id?: number | null
          view?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          country: string | null
          created_at: string | null
          gender: string | null
          id: number
          nickname: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string | null
          gender?: string | null
          id?: never
          nickname?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string | null
          gender?: string | null
          id?: never
          nickname?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      progress: {
        Row: {
          completed_lessons: number | null
          id: number
          progress_rate: number | null
          study_id: number | null
          total_lessons: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_lessons?: number | null
          id?: never
          progress_rate?: number | null
          study_id?: number | null
          total_lessons?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_lessons?: number | null
          id?: never
          progress_rate?: number | null
          study_id?: number | null
          total_lessons?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "study"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          created_at: string | null
          id: number
          study_id: number
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          study_id: number
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          study_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_saves_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study: {
        Row: {
          created_at: string | null
          id: number
          poster_image_url: string | null
          short_description: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          poster_image_url?: string | null
          short_description?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: never
          poster_image_url?: string | null
          short_description?: string | null
          title?: string
        }
        Relationships: []
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
      subtitle: {
        Row: {
          english_subtitle: string | null
          id: number
          korean_subtitle: string | null
          level: Database["public"]["Enums"]["difficulty_level"] | null
          pronunciation: string | null
          study_id: number | null
          subtitle_end_time: number | null
          subtitle_start_time: number | null
        }
        Insert: {
          english_subtitle?: string | null
          id?: never
          korean_subtitle?: string | null
          level?: Database["public"]["Enums"]["difficulty_level"] | null
          pronunciation?: string | null
          study_id?: number | null
          subtitle_end_time?: number | null
          subtitle_start_time?: number | null
        }
        Update: {
          english_subtitle?: string | null
          id?: never
          korean_subtitle?: string | null
          level?: Database["public"]["Enums"]["difficulty_level"] | null
          pronunciation?: string | null
          study_id?: number | null
          subtitle_end_time?: number | null
          subtitle_start_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subtitle_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "study"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: number
          last_login: string | null
          password: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: number
          last_login?: string | null
          password?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          last_login?: string | null
          password?: string
        }
        Relationships: []
      }
      users_posts_comments: {
        Row: {
          comments: string | null
          created_at: string | null
          id: number
          posts_id: number
          updated_at: string | null
          users_id: number
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          id?: number
          posts_id: number
          updated_at?: string | null
          users_id: number
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          id?: number
          posts_id?: number
          updated_at?: string | null
          users_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "users_posts_comments_posts_id_fkey"
            columns: ["posts_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_posts_comments_users_id_fkey"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users_study_review: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          study_id: number
          updated_at: string | null
          user_id: number
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id: number
          study_id: number
          updated_at?: string | null
          user_id: number
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          study_id?: number
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "users_study_review_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      video: {
        Row: {
          categories: string | null
          contents: string | null
          episode: string | null
          id: number
          image_url: string | null
          runtime: number | null
          scene: string | null
          study_id: number | null
          video_end_time: number | null
          video_start_time: number | null
          video_url: string | null
        }
        Insert: {
          categories?: string | null
          contents?: string | null
          episode?: string | null
          id?: never
          image_url?: string | null
          runtime?: number | null
          scene?: string | null
          study_id?: number | null
          video_end_time?: number | null
          video_start_time?: number | null
          video_url?: string | null
        }
        Update: {
          categories?: string | null
          contents?: string | null
          episode?: string | null
          id?: never
          image_url?: string | null
          runtime?: number | null
          scene?: string | null
          study_id?: number | null
          video_end_time?: number | null
          video_start_time?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "study"
            referencedColumns: ["id"]
          },
        ]
      }
      word: {
        Row: {
          example: string | null
          id: number
          means: string | null
          parts_of_speech: string | null
          pronunciation: string | null
          study_id: number | null
          words: string | null
        }
        Insert: {
          example?: string | null
          id?: never
          means?: string | null
          parts_of_speech?: string | null
          pronunciation?: string | null
          study_id?: number | null
          words?: string | null
        }
        Update: {
          example?: string | null
          id?: never
          means?: string | null
          parts_of_speech?: string | null
          pronunciation?: string | null
          study_id?: number | null
          words?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "word_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "study"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          completed: boolean | null
          created_at: string | null
          example: string | null
          explain: string | null
          id: number
          study_id: number
          user_id: number
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          example?: string | null
          explain?: string | null
          id: number
          study_id: number
          user_id: number
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          example?: string | null
          explain?: string | null
          id?: number
          study_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      hhmmss_to_seconds: {
        Args: { t: string }
        Returns: number
      }
    }
    Enums: {
      category_type:
        | "Notice"
        | "Reviews"
        | "Q&A"
        | "Study tips"
        | "Communication"
      difficulty_level: "초급" | "중급" | "고급"
      gender_enum: "남" | "여"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

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
      difficulty_level: ["초급", "중급", "고급"],
      gender_enum: ["남", "여"],
    },
  },
} as const

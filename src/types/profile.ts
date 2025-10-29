export type ActivityTab = 'posts' | 'replies' | 'media' | 'likes';

export type ProfileData = {
  nickname: string;
  handle: string;
  bio?: string;
  location?: string;
  joined?: string; // 예: "2025.10"
  birth?: string;
  followingCount: number;
  followerCount: number;
  coverUrl?: string | null;
  avatarUrl?: string;
};

export type DbProfile = {
  id: string; // uuid (PK)
  user_id: string; // uuid (FK to auth.users.id)
  nickname: string | null;
  avatar_url: string | null;
  birthday: string | null; // date → string으로 옵니다
  gender: string | null; // public.gender_enum
  country: string | null;
  created_at: string | null; // timestamp without tz
  updated_at: string | null; // timestamp without tz
  is_online: boolean | null;
  last_active_at: string | null;
  nickname_normalized: string | null;
  nickname_script: string | null;
  nickname_lang: string | null; // public.nickname_lang_enum
  nickname_set_at: string | null;
  bio: string | null;
  tos_agreed: boolean | null;
  privacy_agreed: boolean | null;
  age_confirmed: boolean | null;
  marketing_opt_in: boolean | null;
  is_onboarded: boolean | null;
  is_public: boolean | null;
};

export type Step = 1 | 2 | 3;

export type Verified = {
  email: { value: string; ok: boolean };
  nickname: { value: string; ok: boolean };
};

export type SignupKind = 'email' | 'social';
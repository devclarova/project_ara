import type { Database as BaseDB } from './database';

type DatabaseWithRPC = Database & {
  public: Database['public'] & {
    Functions: Database['public']['Functions'] & {
      // 이메일 중복 확인
      email_exists: {
        Args: { _email: string };
        Returns: boolean;
      };
      // 닉네임 중복 확인
      nickname_exists: {
        Args: { _nickname: string };
        Returns: boolean;
      };
    };
  };
};

import type { Database as BaseDB } from './database';

type EmailExistsFn = {
  Args: { _email: string };
  Returns: boolean;
};

declare module './database' {
  export type DatabaseWithRPC = Omit<BaseDB, 'public'> & {
    public: Omit<BaseDB['public'], 'Functions'> & {
      Functions: BaseDB['public']['Functions'] & {
        email_exists: EmailExistsFn;
      };
    };
  };
}
